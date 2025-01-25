import connectDB from "@/db/dbConfig";
import Folder from "@/models/folderModels";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const reqBody = await req.json();
    const { owner } = reqBody;
    if (!owner) {
      return NextResponse.json({ error: "Owner not found" });
    }
    const folders = await Folder.find({ owner }).populate("files").exec();

    return NextResponse.json({
      folders,
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
