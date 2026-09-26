import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faSignOutAlt,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { usePlaygroundState } from "@/context/playgroundProvider";

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  client: { socketId: string; username: string }[];
  id: string;
}

function Sidebar({ sidebarOpen, toggleSidebar, client, id }: SidebarProps) {
  const router = useRouter();
  const { user } = usePlaygroundState();

  const handleCopyRoomId = () => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = id;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy Room ID.");
    }
  };

  const leaveRoom = () => {
    if (user) {
      router.push("/home");
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className={`h-full bg-gray-900 text-white shrink-0 ${
        sidebarOpen ? "w-72" : "w-16"
      } transition-all duration-300 ease-in-out flex flex-col z-20 overflow-hidden select-none border-r border-gray-800`}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      {sidebarOpen ? (
        <div className="flex items-center justify-between p-4 bg-gray-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={36}
              height={36}
              className="w-9 h-9 shrink-0 object-contain"
            />
            <h1 className="text-2xl font-bebas whitespace-nowrap tracking-wider">
              CodingCorner
            </h1>
          </div>
          <button
            onClick={toggleSidebar}
            title="Collapse sidebar"
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors ml-auto shrink-0"
          >
            <FontAwesomeIcon icon={faBars} className="w-4 h-4 shrink-0" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-4 pb-2 px-1 gap-2.5 bg-gray-900 shrink-0 w-full">
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <FontAwesomeIcon icon={faBars} className="w-4 h-4 shrink-0" />
          </button>
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-80 transition-opacity shrink-0"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 shrink-0 object-contain"
            />
          </button>
        </div>
      )}

      {/* ── Active Users Section (Expanded) ───────────────────────────────── */}
      {sidebarOpen && (
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Active Users ({client.length})
            </h3>
          </div>
          <ul className="space-y-2">
            {client.map(({ socketId, username }) => {
              const userColors = [
                "#3b82f6", "#10b981", "#f59e0b", "#ec4899",
                "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6",
                "#a855f7", "#ef4444", "#84cc16"
              ];
              let hash = 0;
              for (let i = 0; i < (username || "").length; i++) {
                hash = username.charCodeAt(i) + ((hash << 5) - hash);
              }
              const color = userColors[Math.abs(hash) % userColors.length];

              return (
                <li
                  key={socketId || username}
                  className="flex items-center space-x-3 p-2.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/50 rounded-lg shadow-sm transition"
                >
                  <div
                    className="relative flex items-center justify-center h-9 w-9 rounded-full text-white text-xs font-bold shadow-sm shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {username ? username.slice(0, 2).toUpperCase() : "??"}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-gray-800 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{username}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                      Active
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Active Users Section (Collapsed) ──────────────────────────────── */}
      {!sidebarOpen && (
        <div className="flex-grow py-2 flex flex-col items-center gap-2 overflow-y-auto custom-scrollbar">
          {client.map(({ socketId, username }) => {
            const userColors = [
              "#3b82f6", "#10b981", "#f59e0b", "#ec4899",
              "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6",
              "#a855f7", "#ef4444", "#84cc16"
            ];
            let hash = 0;
            for (let i = 0; i < (username || "").length; i++) {
              hash = username.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = userColors[Math.abs(hash) % userColors.length];

            return (
              <div
                key={socketId || username}
                title={`${username} (Active)`}
                className="relative flex items-center justify-center h-8 w-8 rounded-full text-white text-[11px] font-bold shadow-sm shrink-0 cursor-default"
                style={{ backgroundColor: color }}
              >
                {username ? username.slice(0, 2).toUpperCase() : "??"}
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-gray-900 rounded-full" />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer Actions (Expanded) ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="p-4 shrink-0">
          <button
            className="w-full bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded mb-2 flex items-center justify-center transition shadow-sm"
            onClick={leaveRoom}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              width={18}
              className="mr-2"
            />
            Leave Room
          </button>
          <button
            onClick={handleCopyRoomId}
            className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition shadow-sm"
          >
            <FontAwesomeIcon icon={faCopy} width={16} className="mr-2" /> Copy
            Room ID
          </button>
        </div>
      )}

      {/* ── Footer Actions (Collapsed) ────────────────────────────────────── */}
      {!sidebarOpen && (
        <div className="p-2 pb-4 flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={leaveRoom}
            title="Leave Room"
            className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition shadow-sm"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyRoomId}
            title="Copy Room ID"
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition shadow-sm"
          >
            <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
