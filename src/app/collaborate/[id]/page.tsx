"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { usePlaygroundState } from "@/context/playgroundProvider";
import toast from "react-hot-toast";
import { getSocket } from "@/config/socket";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type * as MonacoEditor from "monaco-editor";
import type { Socket } from "socket.io-client";

type Client = {
  username: string;
  socketId: string;
};

const CollaborativePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [code, setCode] = useState<string>("// Write or paste your code here to collaborate in real-time\n");
  const [client, setClient] = useState<Client[]>([]);
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const { user } = usePlaygroundState();
  const [language, setLanguage] = useState("javascript");
  const socketRef = useRef<Socket | null>(null);
  const params = useParams() as { id: string };
  const { id } = params;

  // Guest / Unauthenticated user state
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>("");

  useEffect(() => {
    // 1. Check logged in user first
    if (user?.username) {
      setCurrentUsername(user.username);
      return;
    }

    // 2. Check localStorage for previously saved guest username
    const savedName = localStorage.getItem("collab_username");
    if (savedName && savedName.trim()) {
      setCurrentUsername(savedName.trim());
    } else {
      setShowNameModal(true);
    }
  }, [user]);

  const handleJoinWithUsername = (nameToUse?: string) => {
    const finalName = (nameToUse || inputName).trim() || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem("collab_username", finalName);
    setCurrentUsername(finalName);
    setShowNameModal(false);
  };

  useEffect(() => {
    if (!currentUsername || !id) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.connect();
    socket.emit("join", {
      id,
      user: { username: currentUsername },
    });

    socket.on("joined", ({ clients, username, socketId }) => {
      if (username !== currentUsername) {
        toast.success(`${username} joined!`);
      }
      setClient(clients);

      // Sync code with the newly joined user
      if (clients.length > 1) {
        socket.emit("syncCode", { socketId, code });
      }
    });

    socket.on("disconnected", ({ socketId, username }) => {
      toast.error(`${username} left!`);
      setClient((prev) => prev.filter((c) => c.socketId !== socketId));
    });

    socket.on("codeChange", (newCode: string) => {
      setCode(newCode);
      if (editorRef.current && editorRef.current.getValue() !== newCode) {
        editorRef.current.setValue(newCode);
      }
    });

    socket.on("changeLanguage", (newLanguage: string) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.disconnect();
      socket.off("joined");
      socket.off("disconnected");
      socket.off("codeChange");
      socket.off("changeLanguage");
      socket.off("syncCode");
    };
  }, [currentUsername, id]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && socketRef.current) {
      setCode(value);
      socketRef.current.emit("codeChange", { id, code: value });
    }
  };

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socketRef.current?.emit("changeLanguage", { id, language: newLanguage });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-white relative">
      {/* Name Prompt Modal for Guests */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Join Collaboration Room</h2>
            <p className="text-gray-400 text-sm mb-5">
              Enter your name or nickname to collaborate in real-time with your team.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinWithUsername();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex, Sarah, Dev123"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-md"
                >
                  Join Room
                </button>
                <button
                  type="button"
                  onClick={() => handleJoinWithUsername(`Guest-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2.5 px-4 rounded-lg transition"
                >
                  Random Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Collaboration Screen */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} client={client} id={id} />
      <div className={`flex-grow flex flex-col ${sidebarOpen ? "ml-64" : "ml-16"} transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-400">Language:</span>
            <select
              className="bg-gray-800 text-white border border-gray-700 text-sm font-semibold py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={language}
              onChange={changeLanguage}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
          </div>
          {currentUsername && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Coding as:</span>
              <span className="text-xs font-bold bg-blue-600/30 text-blue-400 border border-blue-500/40 px-2.5 py-1 rounded-full">
                {currentUsername}
              </span>
            </div>
          )}
        </div>

        <div className="flex-grow h-full w-full">
          <Editor
            value={code}
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              fontSize: 16,
              padding: { top: 12 },
              wordWrap: "on",
            }}
            theme="my-dark-theme"
            className="w-full h-full"
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            beforeMount={(monaco: Monaco) => {
              monaco.editor.defineTheme("my-dark-theme", {
                base: "vs-dark",
                inherit: true,
                rules: [],
                colors: {
                  "editor.background": "#0f172a",
                },
              });
            }}
            onChange={handleEditorChange}
            language={language || "javascript"}
          />
        </div>
      </div>
    </div>
  );
};

export default CollaborativePage;
