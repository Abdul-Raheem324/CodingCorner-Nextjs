import connectDB from "@/db/dbConfig";
import Folder from "@/models/folderModels";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  connectDB();
  try {
    const reqBody = await req.json();
    const { foldername, folderId } = reqBody;
    if (!foldername) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }
    const folder = await Folder.findByIdAndUpdate(
      folderId,
      { $set: { foldername } },
      { new: true }
    ).populate("owner", "username email");

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Folder name updated",
      status: 200,
      folder,
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
