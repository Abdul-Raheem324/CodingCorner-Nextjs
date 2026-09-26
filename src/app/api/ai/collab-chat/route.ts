/**
 * POST /api/ai/collab-chat
 *
 * Streaming RAG chat endpoint. Returns a plain-text stream so the frontend
 * can render tokens as they arrive (~200-400ms to first token vs 3-4s before).
 *
 * Optimisations applied:
 *  1. Streaming response  — first token in ~300ms
 *  2. Smart context       — skips fullCode / embedding for member/room queries
 *  3. Code trimming       — caps fullCode at 4000 chars to reduce prompt size
 */

import { NextRequest } from "next/server";
import connectDB from "@/db/dbConfig";
import { CodeChunk } from "@/models/collabSessionModel";
import { getEmbedding, askGeminiStream, RagContext } from "@/lib/gemini";

const VECTOR_INDEX_NAME = "code_chunk_vector_index";
const TOP_K             = 5;
const MAX_CODE_CHARS    = 4000; // cap fullCode to keep prompts lean

// ── Query classifier ─────────────────────────────────────────────────────────
// Detects simple room/member queries that don't need code context or embeddings

const MEMBER_PATTERNS = [
  /who('s| is| are)( in| here| active| online| present)/i,
  /how many (people|users|members|collaborators)/i,
  /list (the )?(members|users|people)/i,
  /active (users|members)/i,
  /room members/i,
];

function isRoomQuery(q: string): boolean {
  return MEMBER_PATTERNS.some((p) => p.test(q));
}

// ── Vector search ─────────────────────────────────────────────────────────────

async function retrieveRelevantChunks(
  roomId: string,
  queryEmbedding: number[],
  topK: number
) {
  try {
    return await CodeChunk.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: { roomId },
        },
      },
      {
        $project: {
          content: 1,
          author: 1,
          lineStart: 1,
          lineEnd: 1,
          language: 1,
          score: { $meta: "vectorSearchScore" },
          _id: 0,
        },
      },
    ]);
  } catch {
    // Fallback if Atlas index not yet created
    return CodeChunk.find(
      { roomId },
      { content: 1, author: 1, lineStart: 1, lineEnd: 1, language: 1, _id: 0 }
    )
      .limit(topK)
      .lean();
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      question,
      language     = "javascript",
      members      = [],
      currentUser,
      fullCode,
      selectedText,
    } = body as {
      roomId: string;
      question: string;
      language: string;
      members: string[];
      currentUser?: string;
      fullCode?: string;
      selectedText?: string;
    };

    if (!roomId || !question) {
      return new Response(
        JSON.stringify({ error: "roomId and question are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const uniqueMembers = [
      ...new Set([...members, currentUser].filter(Boolean) as string[]),
    ];

    // ── Smart context decisions ──────────────────────────────────────────────
    const roomOnly     = isRoomQuery(question);
    const hasSelection = Boolean(selectedText?.trim());

    // Trim fullCode to keep prompt size reasonable
    const trimmedCode = fullCode
      ? fullCode.length > MAX_CODE_CHARS
        ? fullCode.slice(0, MAX_CODE_CHARS) + "\n// … (truncated)"
        : fullCode
      : undefined;

    // For room-member queries: skip DB connect + embedding entirely
    let chunks: unknown[] = [];

    if (!roomOnly) {
      await connectDB();

      // Run embedding + vector search only for code-related queries
      try {
        // Embed just the key part of the question (first 200 chars is enough)
        const queryEmbedding = await getEmbedding(question.slice(0, 200));
        chunks = await retrieveRelevantChunks(roomId, queryEmbedding, TOP_K);
      } catch (e) {
        console.warn("[collab-chat] Embedding/search skipped:", e);
      }
    }

    // ── Build RAG context ────────────────────────────────────────────────────
    const ctx: RagContext = {
      chunks: chunks as RagContext["chunks"],
      members: uniqueMembers,
      currentUser,
      // For room-only queries, skip fullCode entirely (saves ~1000 tokens)
      fullCode: roomOnly ? undefined : (hasSelection ? undefined : trimmedCode),
      selectedText: hasSelection ? selectedText : undefined,
      language,
      roomId,
    };

    // ── Stream the response ──────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of askGeminiStream(question, ctx)) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          // Surface error as a text chunk so the frontend can display it
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        // Disable buffering on Vercel / nginx so chunks arrive immediately
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[collab-chat] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to get AI response", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
