# MongoDB Atlas Vector Search Setup

This guide shows you how to create the vector search index needed for the AI RAG feature.

## Prerequisites
- MongoDB Atlas cluster (you already have one at `cluster0.olw8j.mongodb.net`)
- Atlas M0 (free tier) **supports** Atlas Vector Search ✅

---

## Step 1 — Get your Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Paste it into your `.env` file:
```
GEMINI_API_KEY=AIza...your_key_here
```

---

## Step 2 — Create the Vector Search Index in Atlas

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your cluster
2. Go to **Search** tab → **Create Search Index**
3. Choose **Atlas Vector Search** (NOT Atlas Search)
4. Select database: your DB name, Collection: `codechunks`
5. Use this JSON definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "roomId"
    }
  ]
}
```

6. Name the index: **`code_chunk_vector_index`**
7. Click **Create** — it takes ~2 minutes to build

---

## How it Works (Architecture)

```
User types code
      │
      ▼ (every 4 seconds, debounced)
POST /api/ai/index-code
      │
      ├─ Split code into author-attributed chunks
      │   (consecutive lines by same author = 1 chunk)
      │
      ├─ Embed each chunk via Gemini embedding-001
      │   → 768-dimensional vector
      │
      └─ Upsert into MongoDB CodeChunk collection

User asks AI a question
      │
      ▼
POST /api/ai/collab-chat
      │
      ├─ Embed the question (768-dim vector)
      │
      ├─ MongoDB $vectorSearch
      │   → top-6 most semantically similar code chunks
      │   → filtered by roomId
      │
      ├─ Build context:
      │   - Retrieved chunks + their authors
      │   - Current room members list
      │   - Full editor code (optional)
      │   - Selected text (if any)
      │
      └─ Gemini gemini-2.0-flash answers with full context
```

---

## Features

| Feature | How it works |
|---------|-------------|
| **"Who wrote this?"** | User selects code → AIChatPanel detects selection → sent as `selectedText` → Gemini cross-references with indexed chunks |
| **Room member awareness** | Active `client[]` array is passed as `members[]` to every AI query |
| **Code authorship tracking** | Every local edit updates `authorMapRef` (line → username) → indexed every 4s |
| **Vector Search fallback** | If Atlas Vector Search index isn't ready, falls back to `CodeChunk.find()` |

---

## Troubleshooting

- **`GEMINI_API_KEY is not set`** → Add it to `.env`
- **Vector search returns 0 results** → Make sure the index is named `code_chunk_vector_index` exactly
- **No authorship data** → Code must be typed locally (remote changes tracked on next local edit)
