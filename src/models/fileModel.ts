import mongoose from "mongoose";
import User from "./userModel";

interface IFile extends Document {
  filename: string;
  code: string;
  folder: mongoose.Schema.Types.ObjectId; // Folder ID
  language: string;
  owner: mongoose.Schema.Types.ObjectId; // User ID
}

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    code: {
      type: String,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },
    language: {
      type: String,
      required :true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
    },
  },
  { timestamps: true }
);


const defaultCodeSnippets:{ [key: string]: string } = {
  cpp: `#include <iostream>
  
  int main() {
      std::cout << "Hello, World!" << std::endl;
      return 0;
  }`,
  c: `#include <stdio.h>
  
  int main() {
      printf("Hello, World!\\n");
      return 0;
  }`,
  javascript: `console.log("Hello, World!");`,
  python: `print("Hello, World!")`,
  java: `public class Main {
      public static void main(String[] args) {
          System.out.println("Hello, World!");
      }
  }`,
};

fileSchema.pre("save", function (next) {
  if (!this.code) {
    this.code = defaultCodeSnippets[this.language] || "";
  }
  next();
});

fileSchema.index({ filename: 1, folder: 1 }, { unique: true });

const File =
  (mongoose.models.File as mongoose.Model<IFile>) ||
  mongoose.model("File", fileSchema);

export default File
