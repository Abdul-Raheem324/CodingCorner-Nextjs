import mongoose, { Schema, Document, Model } from "mongoose";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ICodeChunk extends Document {
  roomId: string;
  author: string;        // username of who wrote it
  content: string;       // the actual code / text chunk
  lineStart: number;
  lineEnd: number;
  language: string;
  timestamp: Date;
  embedding: number[];   // Gemini text-embedding-004 → 768 dims
}

// ── Schema ──────────────────────────────────────────────────────────────────

const CodeChunkSchema = new Schema<ICodeChunk>(
  {
    roomId:    { type: String, required: true, index: true },
    author:    { type: String, required: true },
    content:   { type: String, required: true },
    lineStart: { type: Number, required: true },
    lineEnd:   { type: Number, required: true },
    language:  { type: String, default: "javascript" },
    timestamp: { type: Date,   default: Date.now },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

// MongoDB Atlas Vector Search index must be created manually on `embedding`
// (see MONGODB_VECTOR_SEARCH_SETUP.md for instructions)

export const CodeChunk: Model<ICodeChunk> =
  mongoose.models.CodeChunk as Model<ICodeChunk> ||
  mongoose.model<ICodeChunk>("CodeChunk", CodeChunkSchema);


// ── Room Session (lightweight) ───────────────────────────────────────────────

export interface IRoomSession extends Document {
  roomId: string;
  members: { username: string; joinedAt: Date; leftAt?: Date }[];
  createdAt: Date;
}

const RoomSessionSchema = new Schema<IRoomSession>(
  {
    roomId:  { type: String, required: true, unique: true },
    members: [
      {
        username: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        leftAt:   { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export const RoomSession: Model<IRoomSession> =
  mongoose.models.RoomSession as Model<IRoomSession> ||
  mongoose.model<IRoomSession>("RoomSession", RoomSessionSchema);
