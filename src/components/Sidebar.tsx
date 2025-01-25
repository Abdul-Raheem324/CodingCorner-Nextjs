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

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  client: { socketId: string; username: string }[];
  id: string;
}

function Sidebar({ sidebarOpen, toggleSidebar, client, id }: SidebarProps) {
  const router = useRouter();

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
    router.push("/home");
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
            <h3 className="text-lg font-medium text-green-500 mb-4">
              Active Users
            </h3>
            <ul className="space-y-2 ">
              {client.map(({ socketId, username }) => (
                <div key={socketId || ""}>
                  <li className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg shadow-md">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-500 text-white text-lg font-bold">
                      <h1>{username.slice(0, 2).toUpperCase()}</h1>
                    </div>
                    <p className="text-white text-lg font-medium">{username}</p>
                  </li>
                </div>
              ))}
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
