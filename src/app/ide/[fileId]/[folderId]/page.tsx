"use client";

interface folder {
  _id: string;
  name: string;
  files: file[];
}

interface file {
  _id: string;
  filename: string;
  code: string;
  language: string;
}

import { useParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "react-resizable/css/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faDownload,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { usePlaygroundState } from "@/context/playgroundProvider";
import axios, { isAxiosError } from "axios";
import { ModalProvider } from "@/components/ui/animated-modal";
import { EditFile } from "@/components/modal/EditFile";
import LoadingOverlay from "@/components/LoadingOverlay";
import * as MonacoEditor from "monaco-editor";

const Ide: React.FC = () => {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(
    null
  );
  const params = useParams();
  const { getFileExtension, selectedFile, setSelectedFile, setFolders, user } =
    usePlaygroundState();
  const { fileId, folderId } = params ?? {};

  const validFolderId = Array.isArray(folderId) ? folderId[0] : folderId;
  const validFileId = Array.isArray(fileId) ? fileId[0] : fileId;

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [code, setCode] = useState("");
  const [theme, setTheme] = useState("dark");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [language, setLanguage] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const fileExtension = useMemo(() => {
    return getFileExtension(validFolderId ?? "", validFileId ?? ""); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validFolderId, validFileId]);
  const [loading, setLoading] = useState(false);

  const handleImportCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.includes("text")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCode(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportCode = () => {
    const currCode = code.trim();
    if (!currCode) {
      toast.error("Please type some code to export");
      return;
    }
    const blob = new Blob([currCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInput(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportOutput = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const fetchFolders = useCallback(async () => {
    try {
      const response = await axios.post("/api/folders/", { owner: user?._id });
      setFolders(response.data.folders);

      if (validFolderId && validFileId) {
        const selectedFolder = response.data.folders.find(
          (folder: folder) => folder._id === validFolderId
        );
        if (selectedFolder) {
          const file = selectedFolder.files.find(
            (file: file) => file._id === validFileId
          );
          if (file) {
            setSelectedFile(file);
            setCode(file.code);
            setLanguage(file.language);
          } else {
            toast.error("File not found");
          }
        } else {
          toast.error("Folder not found");
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Unknown error");
        console.error("Error details:", error);
      } else {
        toast.error("Unknown error occurred!");
        console.error("Unexpected error:", error);
      }
    }
  }, [
    user?._id,
    validFolderId,
    validFileId,
    setFolders,
    setSelectedFile,
    setCode,
    setLanguage,
  ]);

  useEffect(() => {
    if (user?._id) {
      fetchFolders();
    }
  }, [user?._id, validFolderId, validFileId, fetchFolders]);

  const editFile = async (fileName: string, fileId: string) => {
    try {
      setEditLoading(true);
      await axios.put("/api/files/update", {
        filename: fileName,
        fileId: fileId,
      });
      fetchFolders();
      toast.success("File name updated!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Error in editing file: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while editing the file");
      }
      console.log(error);
    } finally {
      setEditLoading(false);
    }
  };

  const saveCode = async () => {
    toast.success("Code Saved!");
    try {
      await axios.put("/api/files/savecode", {
        code: code,
        fileId: selectedFile?._id,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Error in saving code: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while saving the code.");
      }
      console.log(error);
    }
  };

  const languageMap = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
    c: 50,
  };

  const getResult = async (token: string) => {
    const options = {
      method: "GET",
      url: `https://judge029.p.rapidapi.com/submissions/${token}`,
      params: {
        base64_encoded: "true",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": "b340d9e618msha8c9ad9b7fbc078p13698cjsn282808eb5893",
        "x-rapidapi-host": "judge029.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.request(options);
      const result = response.data;

      if (result.status.id === 1 || result.status.id === 2) {
        setTimeout(() => getResult(token), 2000);
      } else if (result.status.id === 3) {
        const output = atob(result.stdout);
        setOutput(
          `<span class="text-green-500">Accepted:</span><br> ${output}`
        );
        setLoading(false);
      } else {
        let errorMessage = `<span class="text-red-500">Error: ${result.status.description}</span>`;
        if (result.stderr) {
          const errors = atob(result.stderr);
          const formattedError = parseErrorMessage(errors);
          errorMessage = `<span class="text-red-500">${formattedError}</span>`;
        } else if (result.compile_output) {
          const compileErrors = atob(result.compile_output);
          const formattedCompileError = parseErrorMessage(compileErrors);
          errorMessage = `<span class="text-red-500">Compilation Error: ${formattedCompileError}</span>`;
        }

        setOutput(errorMessage);
        setLoading(false);
      }
    } catch (error: unknown) {
      setLoading(false);
      if (error instanceof Error) {
        setOutput(`<span class="text-red-500">Error: ${error.message}</span>`);
      } else {
        setOutput("<span class='text-red-500'>Unknown error occurred.</span>");
      }

      console.error(error);
    }
  };

  const parseErrorMessage = (errorMessage: string) => {
    const errorRegex = /(\S+):(\d+)\s*(.*)/;

    const match = errorMessage.match(errorRegex);

    if (match) {
      const file = match[1];
      const lineNumber = match[2];
      const errorDescription = match[3];

      return `Error in file ${file} at line ${lineNumber}: ${errorDescription}`;
    } else {
      return `Error: ${errorMessage}`;
    }
  };

  const runCode = async () => {
    setLoading(true);
    const language_id =
      languageMap[
        (selectedFile?.language as keyof typeof languageMap) || "javascript"
      ];
    const options = {
      method: "POST",
      url: "https://judge029.p.rapidapi.com/submissions",
      params: {
        base64_encoded: "true",
        wait: "false",
        fields: "*",
      },
      headers: {
        "x-rapidapi-key": "b340d9e618msha8c9ad9b7fbc078p13698cjsn282808eb5893",
        "x-rapidapi-host": "judge029.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        source_code: btoa(code),
        language_id,
        stdin: btoa(input),
      }),
    };

    try {
      const response = await axios.request(options);
      const token = response.data.token;
      if (token) {
        getResult(token);
      } else {
        console.log("No token.");
        setLoading(false);
      }
    } catch (error: unknown) {
      setLoading(false);

      if (error instanceof Error) {
        console.error("Error during submission:", error);
      } else if (isAxiosError(error) && error.response?.status === 429) {
        console.error("Rate limit exceeded. Retrying...");
      } else {
        console.error("An unknown error occurred:", error);
      }
    }
  };

  const handleResize = () => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  };
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <ModalProvider>
      <div
        className={`flex flex-col w-full h-screen bg-${
          theme === "dark" ? "gray-900" : "#e7f0fd"
        } fixed inset-0 z-50 overflow-auto`}
      >
        {/* Navbar */}
        <div className="Navbar w-full h-16 flex items-center justify-between px-4 bg-gray-800 text-white">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="CodingCorner Logo"
              width={64}
              height={64}
              className="w-auto md:w-16"
              priority
            />
            <h1 className="font-bebas text-xl md:text-2xl tracking-wide font-header">
              CodingCorner
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={saveCode}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </button>
            <button
              onClick={runCode}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Run
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="body flex flex-col xl:flex-row w-full h-full flex-grow">
          {/* Editor Section */}
          <div
            className={`flex-grow flex flex-col p-4 border-r border-gray-700 w-full h-full`}
          >
            <div className="flex flex-wrap items-center mb-4 justify-between">
              <div className="flex items-center mb-2 sm:mb-0">
                <FontAwesomeIcon
                  icon={faFile}
                  className="text-gray-500 mr-2"
                  width={16}
                />
                <span
                  className={`text-lg ${
                    theme === "dark" ? "text-gray-200" : ""
                  } font-semibold`}
                >
                  {selectedFile?.filename}
                </span>
                <EditFile
                  onEdit={editFile}
                  editLoading={editLoading}
                  fileId={selectedFile?._id ?? ""}
                />
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <label className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded sm:mr-4 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} width={16} /> Import Code
                  <input
                    type="file"
                    accept=".html,.js,.json,.txt,.cpp,.c,.py"
                    onChange={handleImportCode}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportCode}
                  className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded sm:mr-4"
                >
                  <FontAwesomeIcon icon={faDownload} width={16} /> Export Code
                </button>
                <select
                  value={theme}
                  onChange={handleThemeChange}
                  className="bg-gray-200 text-black font-bold py-2 px-4 rounded ml-4"
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                </select>
              </div>
            </div>
            <div className="flex-grow h-auto">
              <Editor
                value={code}
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                  fontSize: 20,
                  padding: { top: 5 },
                  wordWrap: "on",
                }}
                height="100%"
                width="100%"
                theme={theme === "dark" ? "my-dark-theme" : "vs-light"}
                className={`w-full h-full border-gray-300 rounded`}
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme("my-dark-theme", {
                    base: "vs-dark",
                    inherit: true,
                    rules: [],
                    colors: {
                      "editor.background": "#1f2937",
                    },
                  });
                }}
                onChange={handleEditorChange}
                defaultLanguage={selectedFile?.language}
                onMount={(editor) => (editorRef.current = editor)}
              />
            </div>
          </div>

          {/* Input/Output Area */}
          <div
            className={`io flex flex-col p-4 w-full md:flex-col xl:w-full h-full`}
          >
            {/* Input Section */}
            <div className="flex flex-col w-full h-full md:w-full p-2">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={`text-lg ${
                    theme === "dark" ? "text-gray-200" : ""
                  } font-semibold`}
                >
                  Input
                </h2>
                <label className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} width={16} /> Import Input
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleImportInput}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                className="w-full h-full p-2 border border-gray-300 rounded resize-none bg-gray-100"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input here..."
              />
            </div>

            {/* Output Section */}
            <div className="flex flex-col w-full h-full md:w-full mt-4 md:mt-0 p-2">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className={`text-lg ${
                    theme === "dark" ? "text-gray-200" : ""
                  } font-semibold`}
                >
                  Output
                </h2>
                <button
                  onClick={handleExportOutput}
                  className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                >
                  <FontAwesomeIcon icon={faDownload} width={16} /> Export Output
                </button>
              </div>
              <div
                className={`w-full h-full p-2 border border-gray-300 rounded resize-none mt-2 ${
                  theme === "dark"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-900 text-white"
                }`}
                dangerouslySetInnerHTML={{ __html: output }}
              />
            </div>
          </div>
        </div>
      </div>
      <LoadingOverlay loading={loading} />
    </ModalProvider>
  );
};

export default Ide;
