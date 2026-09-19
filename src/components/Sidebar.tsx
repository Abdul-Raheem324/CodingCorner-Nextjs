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
    <div>
      <div
        className={`fixed inset-y-0 left-0 bg-gray-900 text-white ${
          sidebarOpen ? "w-64" : "w-16"
        } transition-width duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex items-center justify-center p-4 bg-gray-900">
          <Image
            src="/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
          {sidebarOpen && (
            <h1 className=" text-3xl font-bebas">CodingCorner</h1>
          )}
          <button onClick={toggleSidebar} className="ml-auto">
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>

        {/* Active Users Section */}
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

        {sidebarOpen && (
          <div className="p-4">
            <button
              className="w-full bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded mb-2 flex items-center justify-center"
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
              className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faCopy} width={16} className="mr-2" /> Copy
              Room ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
