import connectDB from "@/db/dbConfig";
import File from "@/models/fileModel";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  connectDB();
  try {
    const reqBody = await req.json();
    const { filename, fileId } = reqBody;
    if (!filename || !fileId) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }
    const file = await File.findByIdAndUpdate(
      fileId,
      { $set: { filename } },
      { new: true }
    )
      .populate("owner", "username email")
      .exec();

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "File name updated",
      status: 200,
      file,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}
