
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { usePlaygroundState } from "@/context/playgroundProvider";
import toast from "react-hot-toast";
import { getSocket } from "@/config/socket";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Client = {
  username: string;
  socketId: string;
};

const CollaborativePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [code, setCode] = useState<string>("//Write your code here");
  const [client, setClient] = useState<Client[]>([]);
  const editorRef = useRef<any>(null);
  const { user } = usePlaygroundState();
  const [language, setLanguage] = useState("javascript");
  const socketRef = useRef<any>(null); // Store socket instance in ref
  const params = useParams() as { id: string };
  const { id } = params;

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (user && id) {
      console.log("Connecting to socket...");
      socket.connect();
      socket.emit("join", { id, user });

      socket.on("joined", ({ clients, username, socketId }) => {
        console.log("Clients in room:", clients);
        if (username !== user?.username) {
          toast.success(`${username} joined!`);
        }
        setClient(clients);

        // Sync code with the new user
        if (clients.length > 1) {
          socket.emit("syncCode", { socketId, code });
        }
      });

      socket.on("disconnected", ({ socketId, username }) => {
        toast.error(`${username} left!`);
        setClient((prev) => prev.filter((c) => c.socketId !== socketId));
      });

      socket.on("codeChange", (newCode) => {
        console.log("Received code change:", newCode);
        setCode(newCode);
        if (editorRef.current) {
          editorRef.current.setValue(newCode);
        }
      });

      socket.on("changeLanguage", (newLanguage) => {
        setLanguage(newLanguage);
      });

      return () => {
        console.log("Cleaning up socket connection...");
        socket.disconnect();
        socket.off("joined");
        socket.off("disconnected");
        socket.off("codeChange");
        socket.off("changeLanguage");
        socket.off("syncCode");
      };
    }
  }, [user, id]);
 
  
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && socketRef.current) {
      console.log("Emitting code change:", { id, code: value });
      setCode(value);
      socketRef.current.emit("codeChange", { id, code: value });
    }
  };

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    console.log("Emitting language change:", { id, language: newLanguage });
    setLanguage(newLanguage);
    socketRef.current.emit("changeLanguage", { id, language: newLanguage });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-700">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} client={client} id={id} />
      <div className={`flex-grow flex flex-col ${sidebarOpen ? "ml-64" : "ml-16"} transition-margin duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
          <select className="bg-gray-200 text-black font-bold py-2 px-4 rounded" value={language} onChange={changeLanguage}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
        </div>
        <div className="flex-grow h-full w-full">
          <Editor
            value={code}
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              fontSize: 16,
              padding: { top: 5 },
              wordWrap: "on",
            }}
            theme={"my-dark-theme"}
            className="w-full h-full"
            beforeMount={(monaco: Monaco) => {
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
            language={language || "javascript"}
          />
        </div>
      </div>
    </div>
  );
};

export default CollaborativePage;
