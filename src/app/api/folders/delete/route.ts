import connectDB from "@/db/dbConfig";
import Folder from "@/models/folderModels";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  connectDB();
  try {
    const reqBody = await req.json();
    const { folderId } = reqBody;
    if (!folderId) {
      return NextResponse.json({ error: "No folder id" }, { status: 400 });
    }

    const folder = await Folder.findByIdAndDelete(folderId);

    if (!folder) {
      return NextResponse.json({ error: "No folder" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Folder deleted successfully!",
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
