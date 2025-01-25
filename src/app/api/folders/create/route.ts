import connectDB from "@/db/dbConfig";
import Folder from "@/models/folderModels";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  connectDB();
  try {
    const reqBody = await req.json();
    const { foldername, userId } = reqBody;
    if (!foldername) {
      return NextResponse.json({ error: "Please give folder name" });
    }
    const folder = await Folder.create({
      foldername,
      owner: userId,
    });
    const newFolder = await Folder.findById(folder._id)
      .populate("owner", "username email")
      .exec();

    return NextResponse.json({
      message: "Folder created Successfully!",
      status: 200,
      newFolder,
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
