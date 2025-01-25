import connectDB from "@/db/dbConfig";
import File from "@/models/fileModel";
import Folder from "@/models/folderModels";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  connectDB();
  try {
    const reqBody = await req.json();
    const { filename, folderId, language, userId } = reqBody;
    if (!filename || !folderId || !language || !userId) {
      return NextResponse.json(
        { error: "Please fill all the details" },
        { status: 400 }
      );
    }
    const existingFile = await File.findOne({ filename, folder: folderId });
    if (existingFile) {
      return NextResponse.json(
        { error: "File with this name already exists in this folder." },
        { status: 400 }
      );
    }
    const createdFile = await File.create({
      filename,
      language,
      folder: folderId,
      owner: userId,
    });

    const newFile = await File.findById(createdFile._id)
      .populate("owner", "username email")
      .exec();
    await Folder.findByIdAndUpdate(folderId, { $push: { files: newFile } });
    return NextResponse.json({
      message: "File craeted successfully",
      status: 200,
      newFile,
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
