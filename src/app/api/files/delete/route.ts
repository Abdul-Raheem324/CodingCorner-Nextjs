import connectDB from "@/db/dbConfig";
import File from "@/models/fileModel";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  connectDB();
  try {
    const reqBody = await req.json();
    const { fileId } = reqBody;
    if (!fileId) {
      return NextResponse.json(
        { error: "File id is required" },
        { status: 400 }
      );
    }

    await File.findByIdAndDelete(fileId);

    return NextResponse.json({
      message: "File deleted successfully",
      status: 200,
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
