/**
 * POST /api/ai/index-code
 *
 * Called whenever code changes in the collab editor.
 * Splits code into author-attributed chunks, embeds them with Gemini,
 * and upserts into MongoDB for vector search.
 *
 * Body:
 *   roomId     - collaboration room UUID
 *   code       - full current editor code
 *   language   - programming language
 *   authorMap  - Record<lineNumber, username>  (who typed each line)
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db/dbConfig";
import { CodeChunk } from "@/models/collabSessionModel";
import { getEmbedding } from "@/lib/gemini";

interface AuthorMap {
  [line: string]: string;
}

interface Chunk {
  content: string;
  author: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Group consecutive lines by the same author into chunks.
 * Lines with no author entry are attributed to the last known author.
 */
function buildAuthorChunks(code: string, authorMap: AuthorMap): Chunk[] {
  const lines = code.split("\n");
  const chunks: Chunk[] = [];
  let currentChunk: Chunk | null = null;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const author = authorMap[lineNum] || authorMap[String(lineNum)] || "unknown";

    if (!currentChunk || currentChunk.author !== author) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = {
        content: line,
        author,
        lineStart: lineNum,
        lineEnd: lineNum,
      };
    } else {
      currentChunk.content += "\n" + line;
      currentChunk.lineEnd = lineNum;
    }
  });

  if (currentChunk) chunks.push(currentChunk);

  // Filter out empty / whitespace-only chunks
  return chunks.filter((c) => c.content.trim().length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, code, language, authorMap } = body as {
      roomId: string;
      code: string;
      language: string;
      authorMap: AuthorMap;
    };

    if (!roomId || !code) {
      return NextResponse.json({ error: "roomId and code are required" }, { status: 400 });
    }

    await connectDB();

    const chunks = buildAuthorChunks(code, authorMap || {});

    // Delete old chunks for this room before re-indexing
    await CodeChunk.deleteMany({ roomId });

    // Embed each chunk and save
    const saved = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await getEmbedding(
          `Language: ${language}\nAuthor: ${chunk.author}\n${chunk.content}`
        );
        return CodeChunk.create({
          roomId,
          author: chunk.author,
          content: chunk.content,
          lineStart: chunk.lineStart,
          lineEnd: chunk.lineEnd,
          language,
          embedding,
        });
      })
    );

    return NextResponse.json({ success: true, indexed: saved.length });
  } catch (err) {
    console.error("[index-code] Error:", err);
    return NextResponse.json(
      { error: "Failed to index code", details: String(err) },
      { status: 500 }
    );
  }
}
