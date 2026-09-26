/**
 * Gemini utilities for the Collab AI feature.
 *  - getEmbedding()  → 768-dim vector via gemini-embedding-001
 *  - askGemini()     → AI suggestions & code assistance via Gemini 3.8 Flash
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY!;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ── Embedding ────────────────────────────────────────────────────────────────

export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// ── Chat / Code Intelligence ─────────────────────────────────────────────────

export interface RagContext {
  /** Code chunks retrieved from vector search or context */
  chunks?: Array<{
    content: string;
    lineStart?: number;
    lineEnd?: number;
    language?: string;
  }>;
  /** Current room members list */
  members?: string[];
  /** Username of current user chatting with AI */
  currentUser?: string;
  /** Full current code in the editor */
  fullCode?: string;
  /** Currently selected text in the editor */
  selectedText?: string;
  /** Language active in the editor */
  language: string;
  /** Room ID */
  roomId: string;
}

/**
 * Build the system prompt with room and code context:
 * The AI has complete awareness of all room members, focuses on the written/attached code,
 * finds bugs, explains logic, and provides smart suggestions.
 */
function buildSystemPrompt(ctx: RagContext): string {
  const uniqueMembers = [...new Set((ctx.members || []).filter(Boolean))];
  const memberCount = uniqueMembers.length;
  const membersList = uniqueMembers.join(", ") || "Active Collaborators";
  const currentUser = ctx.currentUser || "User";
  const otherMembers = uniqueMembers.filter((m) => m !== currentUser);
  const otherMembersList =
    otherMembers.length > 0 ? otherMembers.join(", ") : "None (solo session)";

  const hasSelectedCode = Boolean(ctx.selectedText && ctx.selectedText.trim().length > 0);

  const targetCodeSection = hasSelectedCode
    ? `## User Attached / Highlighted Code (PRIMARY TARGET):
\`\`\`${ctx.language}
${ctx.selectedText}
\`\`\`
*The user specifically attached this snippet to ask about it.*`
    : `## Full Editor Code (PRIMARY TARGET):
\`\`\`${ctx.language}
${ctx.fullCode || "// Editor is currently empty"}
\`\`\`
*No specific snippet was attached, so evaluate the full editor code above.*`;

  const surroundingContextSection =
    hasSelectedCode && ctx.fullCode
      ? `## Full Editor File Context:
\`\`\`${ctx.language}
${ctx.fullCode}
\`\`\`\n`
      : "";

  return `You are Room AI, an intelligent coding pair-programmer and assistant embedded inside a live collaborative code editor (CodingCorner).

## Real-Time Room & Members Context
- Room ID: ${ctx.roomId}
- Programming Language: ${ctx.language}
- Current User: ${currentUser}
- Total Active Members (${memberCount}): ${membersList}
- Other Collaborators in Room: ${otherMembersList}

${targetCodeSection}

${surroundingContextSection}

## Your Role & Guidelines:
1. **Room & Member Awareness**:
   - You have full real-time awareness of everyone in this room: ${membersList}.
   - If asked who is in the room, who is coding, or about room participants, accurately list the members (${membersList}).
2. **Target Code Priority**:
   - If an attached/selected snippet is provided above, focus your explanation, bug-hunting, or suggestions directly on that snippet (using the surrounding full file for context if needed).
   - If no snippet is attached, evaluate the full editor code.
3. **Code Understanding & Suggestions**:
   - Provide clear, high-quality, practical coding assistance.
   - Detect syntax errors, runtime issues, edge cases, type issues, or unhandled conditions and show how to fix them with clean code examples.
   - When asked to explain, break down how the code works step-by-step.
   - When asked for improvements, offer readable, modern, idiomatic solutions tailored to ${ctx.language}.
4. **Tone & Formatting**:
   - Be helpful, direct, concise, and friendly.
   - Format responses in clean markdown with syntax-highlighted code blocks where helpful.
   - Focus on understanding the code, fixing issues, and collaborating effectively with the team in the room.
`;
}

// ── Model fallback chain (all confirmed on this API key via ListModels) ────────
// Ordered by preference: newest → oldest. On 503/429 we walk down the list.
const MODEL_CHAIN = [
  "gemini-3.7-flash",
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAY_MS  = 1000;

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Ask Gemini with automatic retry + model fallback.
 * On 503 / 429 the function:
 *   1. Retries the SAME model once after 1 s.
 *   2. Falls back to the next model in MODEL_CHAIN.
 * Returns the first successful response text.
 */
export async function askGemini(
  question: string,
  ctx: RagContext
): Promise<string> {
  const systemInstruction = buildSystemPrompt(ctx);
  let lastError: unknown;

  for (const modelName of MODEL_CHAIN) {
    // Try each model up to 2 attempts (1 retry) before moving on
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
        const result = await model.generateContent(question);
        // Success — log which model won so you can tune the chain
        if (modelName !== MODEL_CHAIN[0]) {
          console.info(`[gemini] Answered with fallback model: ${modelName}`);
        }
        return result.response.text();
      } catch (err: unknown) {
        lastError = err;

        // Parse HTTP status from the error message
        const msg   = err instanceof Error ? err.message : String(err);
        const match = msg.match(/\[(\d{3})\s/);
        const code  = match ? Number(match[1]) : 0;

        if (RETRYABLE_CODES.has(code)) {
          if (attempt === 1) {
            // First retry on the same model
            console.warn(`[gemini] ${code} on ${modelName}, retrying in ${RETRY_DELAY_MS}ms…`);
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          // Both attempts failed — try next model
          console.warn(`[gemini] ${code} again on ${modelName}, falling back…`);
          break;
        }

        // Non-retryable error (400, 404, auth, etc.) — rethrow immediately
        throw err;
      }
    }
  }

  // All models exhausted
  throw new Error(
    `All Gemini models are temporarily unavailable. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

/**
 * Streaming version of askGemini.
 * Yields text chunks as they arrive — first token in ~200-400ms.
 * Same retry + fallback chain as askGemini().
 */
export async function* askGeminiStream(
  question: string,
  ctx: RagContext
): AsyncGenerator<string> {
  const systemInstruction = buildSystemPrompt(ctx);
  let lastError: unknown;

  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
        const streamResult = await model.generateContentStream(question);

        if (modelName !== MODEL_CHAIN[0]) {
          console.info(`[gemini-stream] Streaming with fallback: ${modelName}`);
        }

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) yield text;
        }
        return; // done — exit generator
      } catch (err: unknown) {
        lastError = err;
        const msg   = err instanceof Error ? err.message : String(err);
        const match = msg.match(/\[(\d{3})\s/);
        const code  = match ? Number(match[1]) : 0;

        if (RETRYABLE_CODES.has(code)) {
          if (attempt === 1) {
            console.warn(`[gemini-stream] ${code} on ${modelName}, retrying…`);
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          console.warn(`[gemini-stream] ${code} again on ${modelName}, falling back…`);
          break;
        }
        throw err;
      }
    }
  }

  throw new Error(
    `All Gemini models unavailable. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
