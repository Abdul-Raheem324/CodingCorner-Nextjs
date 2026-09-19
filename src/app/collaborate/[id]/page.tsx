"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

const USER_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#a855f7", // Violet
  "#ef4444", // Red
  "#84cc16", // Lime
];

function getUserColor(username: string): string {
  if (!username) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function resolveCurrentUsername(contextUser?: { username: string } | null): string {
  if (contextUser?.username) return contextUser.username;

  if (typeof window !== "undefined") {
    // 1. Check logged-in user in localStorage
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username) return parsed.username;
      }
    } catch {}

    // 2. Check dedicated tab session storage
    const sessionName = sessionStorage.getItem("collab_username");
    if (sessionName && sessionName.trim()) return sessionName.trim();
  }

  return "";
}

interface RemoteCursor {
  widget: MonacoEditor.editor.IContentWidget;
  domNode: HTMLElement;
  tagNode: HTMLElement;
  caretNode: HTMLElement;
  position: { lineNumber: number; column: number };
  username: string;
  color: string;
  updatePosition: (pos: { lineNumber: number; column: number }) => void;
  destroy: () => void;
}

function createCursorWidget(
  monaco: Monaco,
  editor: MonacoEditor.editor.IStandaloneCodeEditor,
  socketId: string,
  username: string,
  color: string,
  initialPosition: { lineNumber: number; column: number }
): RemoteCursor {
  const domNode = document.createElement("div");
  domNode.className = `collab-remote-cursor collab-cursor-${socketId}`;
  domNode.style.pointerEvents = "none";
  domNode.style.position = "absolute";
  domNode.style.zIndex = "40";

  // Cursor Caret (vertical bar)
  const caretNode = document.createElement("div");
  caretNode.className = "collab-remote-cursor-caret";
  caretNode.style.width = "2px";
  caretNode.style.height = "19px";
  caretNode.style.backgroundColor = color;
  caretNode.style.borderRadius = "1px";
  caretNode.style.boxShadow = `0 0 6px ${color}b3`;
  caretNode.style.position = "absolute";
  caretNode.style.top = "0";
  caretNode.style.left = "0";
  caretNode.style.pointerEvents = "none";
  domNode.appendChild(caretNode);

  // Floating Name Tag (Google Sheets / Collab style)
  const tagNode = document.createElement("div");
  tagNode.className = "collab-remote-cursor-tag";
  tagNode.innerText = username;
  tagNode.style.position = "absolute";
  if (initialPosition.lineNumber <= 1) {
    tagNode.style.top = "19px";
    tagNode.style.borderRadius = "0px 4px 4px 4px";
  } else {
    tagNode.style.top = "-19px";
    tagNode.style.borderRadius = "4px 4px 4px 0px";
  }
  tagNode.style.left = "0";
  tagNode.style.backgroundColor = color;
  tagNode.style.color = "#ffffff";
  tagNode.style.fontSize = "10px";
  tagNode.style.fontWeight = "700";
  tagNode.style.padding = "1px 6px";
  tagNode.style.whiteSpace = "nowrap";
  tagNode.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
  tagNode.style.pointerEvents = "none";
  tagNode.style.userSelect = "none";
  tagNode.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  tagNode.style.letterSpacing = "0.025em";
  tagNode.style.lineHeight = "15px";

  domNode.appendChild(tagNode);

  let currentPos = initialPosition;

  const widget: MonacoEditor.editor.IContentWidget = {
    getId: () => `collab.cursor.${socketId}`,
    getDomNode: () => domNode,
    getPosition: () => ({
      position: currentPos,
      preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
    }),
  };

  editor.addContentWidget(widget);

  return {
    widget,
    domNode,
    tagNode,
    caretNode,
    position: currentPos,
    username,
    color,
    updatePosition: (pos: { lineNumber: number; column: number }) => {
      currentPos = pos;
      if (pos.lineNumber <= 1) {
        tagNode.style.top = "19px";
        tagNode.style.borderRadius = "0px 4px 4px 4px";
      } else {
        tagNode.style.top = "-19px";
        tagNode.style.borderRadius = "4px 4px 4px 0px";
      }
      editor.layoutContentWidget(widget);
    },
    destroy: () => {
      try {
        editor.removeContentWidget(widget);
      } catch {
        // already removed
      }
    },
  };
}

const ensureSelectionStyle = (socketId: string, color: string) => {
  const cssId = `sel-style-${socketId}`;
  if (!document.getElementById(cssId)) {
    const style = document.createElement("style");
    style.id = cssId;
    style.innerHTML = `
      .remote-selection-${socketId} {
        background-color: ${color}35 !important;
        border-bottom: 2px solid ${color};
      }
    `;
    document.head.appendChild(style);
  }
};

const removeSelectionStyle = (socketId: string) => {
  const el = document.getElementById(`sel-style-${socketId}`);
  if (el) el.remove();
};

function applyTextDiff(
  editor: MonacoEditor.editor.IStandaloneCodeEditor,
  monaco: Monaco,
  newCode: string
) {
  const model = editor.getModel();
  if (!model) return;
  const oldCode = model.getValue();
  if (oldCode === newCode) return;

  // Find common prefix length
  let prefix = 0;
  const minLen = Math.min(oldCode.length, newCode.length);
  while (prefix < minLen && oldCode.charCodeAt(prefix) === newCode.charCodeAt(prefix)) {
    prefix++;
  }

  // Find common suffix length
  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    oldCode.charCodeAt(oldCode.length - 1 - suffix) === newCode.charCodeAt(newCode.length - 1 - suffix)
  ) {
    suffix++;
  }

  const startOffset = prefix;
  const endOffset = oldCode.length - suffix;
  const replacement = newCode.slice(prefix, newCode.length - suffix);

  const startPos = model.getPositionAt(startOffset);
  const endPos = model.getPositionAt(endOffset);

  editor.executeEdits("remote-sync", [
    {
      range: new monaco.Range(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      ),
      text: replacement,
      forceMoveMarkers: true,
    },
  ]);
}

const CollaborativePage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [client, setClient] = useState<Client[]>([]);
  const [language, setLanguage] = useState("javascript");

  const initialCode = "// Write or paste your code here to collaborate in real-time\n";
  const codeRef = useRef<string>(initialCode);
  const isRemoteChangeRef = useRef<boolean>(false);

  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const remoteCursorsRef = useRef<Map<string, RemoteCursor>>(new Map());
  const remoteSelectionsRef = useRef<Map<string, string[]>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const pendingDisconnectsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const knownUsernamesRef = useRef<Set<string>>(new Set());

  const { user } = usePlaygroundState();
  const params = useParams() as { id: string };
  const { id } = params;

  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>("");

  const currentUsernameRef = useRef<string>(currentUsername);
  currentUsernameRef.current = currentUsername;

  useEffect(() => {
    setMounted(true);
    const globalStyleId = "collab-editor-cursor-styles";
    if (!document.getElementById(globalStyleId)) {
      const style = document.createElement("style");
      style.id = globalStyleId;
      style.innerHTML = `
        @keyframes collabCaretPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .collab-remote-cursor-caret {
          animation: collabCaretPulse 1.2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolved = resolveCurrentUsername(user);
    if (resolved) {
      setCurrentUsername(resolved);
      setShowNameModal(false);
    } else {
      setShowNameModal(true);
    }
  }, [user, mounted]);

  const handleJoinWithUsername = (nameToUse?: string) => {
    const finalName = (nameToUse || inputName).trim() || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("collab_username", finalName);
    setCurrentUsername(finalName);
    setShowNameModal(false);
  };

  const broadcastMyCursor = useCallback((explicitPosition?: { lineNumber: number; column: number }) => {
    const editor = editorRef.current;
    const socket = socketRef.current;
    const uname = currentUsernameRef.current;
    if (socket && uname && id && editor) {
      const pos = explicitPosition || editor.getPosition();
      const sel = editor.getSelection();
      if (pos) {
        socket.emit("cursorMove", {
          id,
          cursor: {
            position: { lineNumber: pos.lineNumber, column: pos.column },
            selection: sel
              ? {
                  startLineNumber: sel.startLineNumber,
                  startColumn: sel.startColumn,
                  endLineNumber: sel.endLineNumber,
                  endColumn: sel.endColumn,
                }
              : null,
            username: uname,
          },
        });
      }
    }
  }, [id]);

  useEffect(() => {
    if (!mounted || !currentUsername || !id) return;

    const socket = getSocket();
    socketRef.current = socket;

    // Trigger cold-start notice if socket connection takes > 3.0s (Render free instance boot)
    const coldStartTimer = setTimeout(() => {
      if (!socket.connected) {
        setIsWakingUp(true);
      }
    }, 3000);

    socket.connect();
    socket.emit("join", {
      id,
      user: { username: currentUsername },
    });

    socket.on("connect", () => {
      clearTimeout(coldStartTimer);
      setIsWakingUp(false);
    });

    socket.on("joined", ({ clients, username, socketId: joinedSocketId }) => {
      // 1. Cancel pending disconnect timer if the user just reloaded / reconnected
      if (pendingDisconnectsRef.current.has(username)) {
        clearTimeout(pendingDisconnectsRef.current.get(username));
        pendingDisconnectsRef.current.delete(username);
      } else if (
        username &&
        username !== currentUsernameRef.current &&
        !knownUsernamesRef.current.has(username)
      ) {
        // Only toast if it's a truly new visitor entering the room
        toast.success(`${username} joined!`, { id: `toast-joined-${username}` });
      }

      // Populate known usernames in this room
      clients.forEach((c: Client) => {
        if (c.username) knownUsernamesRef.current.add(c.username);
      });

      setClient(clients);

      // Clean up stale cursors
      const clientSocketIds = new Set(clients.map((c: Client) => c.socketId));
      remoteCursorsRef.current.forEach((cursorObj, sockId) => {
        if (!clientSocketIds.has(sockId)) {
          cursorObj.destroy();
          remoteCursorsRef.current.delete(sockId);
          if (editorRef.current && remoteSelectionsRef.current.has(sockId)) {
            editorRef.current.deltaDecorations(remoteSelectionsRef.current.get(sockId) || [], []);
            remoteSelectionsRef.current.delete(sockId);
          }
          removeSelectionStyle(sockId);
        }
      });

      // Sync code with the newly joined user
      if (clients.length > 1 && joinedSocketId !== socket.id) {
        socket.emit("syncCode", { socketId: joinedSocketId, code: codeRef.current });
      }

      // Broadcast own cursor position
      setTimeout(() => {
        broadcastMyCursor();
      }, 300);
    });

    socket.on("disconnected", ({ socketId, username }) => {
      const cursorObj = remoteCursorsRef.current.get(socketId);
      if (cursorObj) {
        cursorObj.destroy();
        remoteCursorsRef.current.delete(socketId);
      }
      const decos = remoteSelectionsRef.current.get(socketId);
      if (decos && editorRef.current) {
        editorRef.current.deltaDecorations(decos, []);
        remoteSelectionsRef.current.delete(socketId);
      }
      removeSelectionStyle(socketId);

      setClient((prev) => prev.filter((c) => c.socketId !== socketId));

      // Debounce leave toast (2.5s) to avoid toast spam on reload
      if (username) {
        const timer = setTimeout(() => {
          knownUsernamesRef.current.delete(username);
          toast.error(`${username} left!`, { id: `toast-left-${username}` });
          pendingDisconnectsRef.current.delete(username);
        }, 2500);
        pendingDisconnectsRef.current.set(username, timer);
      }
    });

    socket.on("codeChange", (newCode: string) => {
      if (!editorRef.current || !monacoRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;

      if (model.getValue() === newCode) return;

      isRemoteChangeRef.current = true;
      codeRef.current = newCode;

      // Apply granular diff so unchanged lines never re-render or blink
      applyTextDiff(editorRef.current, monacoRef.current, newCode);

      // Re-layout all remote cursor widgets
      remoteCursorsRef.current.forEach((c) => {
        editorRef.current?.layoutContentWidget(c.widget);
      });

      isRemoteChangeRef.current = false;
    });

    socket.on("cursorMove", ({ socketId, username, position, selection }) => {
      if (!socketId || socketId === socket.id) return;
      if (!editorRef.current || !monacoRef.current) return;

      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const color = getUserColor(username);

      // 1. Update or create cursor widget
      if (position && typeof position.lineNumber === "number" && typeof position.column === "number") {
        let cursorObj = remoteCursorsRef.current.get(socketId);
        if (!cursorObj) {
          cursorObj = createCursorWidget(monaco, editor, socketId, username, color, position);
          remoteCursorsRef.current.set(socketId, cursorObj);
        } else {
          cursorObj.updatePosition(position);
        }
      }

      // 2. Update selection decorations
      const prevDecos = remoteSelectionsRef.current.get(socketId) || [];
      if (
        selection &&
        (selection.startLineNumber !== selection.endLineNumber ||
          selection.startColumn !== selection.endColumn)
      ) {
        ensureSelectionStyle(socketId, color);
        const newDecos = editor.deltaDecorations(prevDecos, [
          {
            range: new monaco.Range(
              selection.startLineNumber,
              selection.startColumn,
              selection.endLineNumber,
              selection.endColumn
            ),
            options: {
              className: `remote-selection-${socketId}`,
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          },
        ]);
        remoteSelectionsRef.current.set(socketId, newDecos);
      } else if (prevDecos.length > 0) {
        editor.deltaDecorations(prevDecos, []);
        remoteSelectionsRef.current.delete(socketId);
      }
    });

    socket.on("changeLanguage", (newLanguage: string) => {
      setLanguage(newLanguage);
    });

    const cursors = remoteCursorsRef.current;
    const selections = remoteSelectionsRef.current;
    const pendingDisconnects = pendingDisconnectsRef.current;

    return () => {
      socket.disconnect();
      socket.off("joined");
      socket.off("disconnected");
      socket.off("codeChange");
      socket.off("changeLanguage");
      socket.off("syncCode");
      socket.off("cursorMove");

      cursors.forEach((c) => c.destroy());
      cursors.clear();
      selections.clear();

      pendingDisconnects.forEach((t) => clearTimeout(t));
      pendingDisconnects.clear();
    };
  }, [currentUsername, id, mounted, broadcastMyCursor]);

  const handleEditorChange = (value: string | undefined) => {
    if (isRemoteChangeRef.current) return;
    if (value !== undefined && socketRef.current) {
      codeRef.current = value;
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
      {mounted && showNameModal && (
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
          {mounted && currentUsername && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Coding as:</span>
              <span
                className="text-xs font-bold text-white px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: getUserColor(currentUsername) }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {currentUsername}
              </span>
            </div>
          )}
        </div>

        {/* Cold Start Notice Banner */}
        {isWakingUp && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-300 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>
                ☕ <strong>Waking up free server (Render.com)...</strong> Initial startup takes ~30s after inactivity.
              </span>
            </div>
            <span className="text-[10px] text-amber-400/70 font-mono hidden sm:inline">Connecting...</span>
          </div>
        )}

        <div className="flex-grow h-full w-full">
          <Editor
            defaultValue={initialCode}
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              fontSize: 16,
              padding: { top: 12 },
              wordWrap: "on",
            }}
            theme="my-dark-theme"
            className="w-full h-full"
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;

              editor.onDidChangeCursorPosition((e) => {
                if (!isRemoteChangeRef.current) {
                  broadcastMyCursor(e.position);
                }
              });

              editor.onDidChangeCursorSelection(() => {
                if (!isRemoteChangeRef.current) {
                  broadcastMyCursor();
                }
              });

              broadcastMyCursor();
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
