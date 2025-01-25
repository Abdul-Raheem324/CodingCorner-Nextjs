"use client";

import { usePlaygroundState } from "@/context/playgroundProvider";
import {
  faChevronDown,
  faChevronUp,
  faFolder,
  faFolderOpen,
  faPowerOff,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";
import { FolderModal } from "../modal/FolderModal";
import { ModalProvider } from "../ui/animated-modal";
import { EditFolder } from "../modal/EditFolder";
import { NewFileModal } from "../modal/NewFileModal";
import Image from "next/image";

function FolderSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    user,
    setUser,
    folders = [],
    setFolders,
    setFiles,
    setSelectedFile
  } = usePlaygroundState();
  const [floading, setFloading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolderId((prev) => (prev === folderId ? null : folderId));
  };

  const logout = async () => {
    try {
      setLoading(true);
      await axios.get("/api/users/logout");
      toast.success("Logged out successfully!");
      localStorage.removeItem("user");
      setUser?.(null);
      router.push("/login");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    
      toast.error("Error while logging out!");
    }
     finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      setFloading(true);
      const response = await axios.post("/api/folders/create", {
        foldername: folderName,
        userId: user?._id,
      });
      const data = response.data.newFolder;


      setFolders((prevFolders) => [data, ...prevFolders]);

      toast.success(`Folder "${folderName}" created successfully!`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    
      toast.error("Error creating folder!");
    }
    finally {
      setFloading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await axios.post("/api/folders/", {
        owner: user?._id,
      });
      setFolders(response.data.folders);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Error in fetching folders!");
        console.log(error);
      }
    }
    
  };

  useEffect(() => {
    if (user?._id) {
      fetchFolders();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const deleteFolder = async (folderId: string) => {
    try {
      await axios.delete("/api/folders/delete", {
        data: { folderId },
      });
      toast.success("Folder deleted");

      setFolders((prevFolders) =>
        prevFolders.filter((folder) => folder._id !== folderId)
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    
      toast.error("Error while deleting folder!");
    }
  };

  const handleEditFolder = async (folderName: string, folderId: string) => {
    try {
      setEditLoading(true);
      await axios.put("/api/folders/update", {
        foldername: folderName,
        folderId: folderId,
      });
      fetchFolders();
      toast.success("Folder name updated!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    
      toast.error("Error in updating folder name!");
    }finally {
      setEditLoading(false);
    }
  };

  const handleFileCreate = async (
    fileName: string,
    folderId: string,
    language: string
  ) => {
    try {
      setFloading(true);
      console.log(
        `Creating file with name: ${fileName}, folderId: ${folderId}, language: ${language}`
      );
      const response = await axios.post("/api/files/create", {
        filename: fileName,
        folderId: folderId,
        language: language,
        userId: user?._id,
      });
      console.log(language);
      const newFile = response.data.newFile;

      setFolders((prevFolders) =>
        prevFolders.map((folder) =>
          folder._id === folderId
            ? { ...folder, files: [newFile, ...folder.files] }
            : folder
        )
      );
      if (setFiles) {
        setFiles((prevFiles) => [newFile, ...prevFiles]);
      }
      toast.success("File created successfully!");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response && error.response.data && error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Error in creating file!");
      }
      console.log(error);
    }
     finally {
      setFloading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await axios.delete("/api/files/delete", {
        data: { fileId },
      });
      toast.success("File deleted successfully!");
      fetchFolders();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    
      toast.error("Error in deleting file!");
    }
    
  };

const navigateToIde = (fileId: string, folderId: string) => {
      router.push(`/ide/${fileId}/${folderId}`);
};


  return (
    <ModalProvider>
      <div className="w-full bg-[#d6e4f8] p-10 font-Roboto">
        <div>
          <button
            className="px-3 py-2 items-center flex bg-red-500 text-white rounded-md float-right hover:bg-red-700"
            onClick={logout}
          >
            {loading ? (
              <ClipLoader size={24} />
            ) : (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPowerOff} width={16} />
                Logout
              </div>
            )}
          </button>
        </div>
        <div className="flex w-full justify-between border border-b-black mb-6 p-1">
          <h1 className="text-3xl font-bold">My Folders</h1>
          <FolderModal onCreate={handleCreateFolder} floading={floading} />
        </div>
        {folders.length > 0 ? (
          [...folders].reverse().map((folder) => (
            <div
              key={folder._id || `folder-${folder.foldername}`}
              className="folder flex flex-col w-full justify-between border border-b-black mb-3"
            >
              <div className="flex justify-between items-center ">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={
                      expandedFolderId === folder._id
                        ? faChevronUp
                        : faChevronDown
                    }
                    className={`text-gray-500 transition-transform duration-300 ${
                      expandedFolderId === folder._id ? "rotate-180" : ""
                    }`}
                    onClick={() => toggleFolder(folder._id)}
                    style={{ cursor: "pointer" }}
                  />
                  <FontAwesomeIcon
                    icon={
                      expandedFolderId === folder._id ? faFolderOpen : faFolder
                    }
                    width={20}
                    size="xl"
                    className={`${ expandedFolderId === folder._id ? "text-yellow-500" : "text-yellow-500" }`}
                    onClick={() => toggleFolder(folder._id)}
                  />
                  <h1 className="text-xl font-semibold">{folder.foldername}</h1>
                </div>


                <div className="flex items-center">
                  <EditFolder
                    onEdit={handleEditFolder}
                    editLoading={editLoading}
                    folderId={folder._id}
                  />
                  <div
                    className="flex items-center justify-center w-9 h-9 bg-white rounded-full shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer"
                    onClick={() => deleteFolder(folder._id)}
                  >
                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="text-red-600"
                      width={16}
                    />
                  </div>

                  <NewFileModal
                    onCreate={(fileName, folderId, language) =>
                      handleFileCreate(fileName, folderId, language)
                    }
                    floading={floading}
                    folderId={folder._id}
                  />
                </div>
              </div>

              {expandedFolderId === folder._id &&
                folder.files &&
                folder.files.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-2">
                    {folder.files.map((file) => (
                      <div
                        key={file._id}
                        className="flex w-full cursor-pointer items-center transform transition-transform duration-300 hover:scale-105 hover:shadow-lg p-1 px-2 rounded-lg bg-[#b4cade] space-x-4"
                        onClick={() =>{
                          setSelectedFile(file)
                          navigateToIde(file?._id, folder?._id)}
                        }
                      >
                        <div>
                          <Image src="/logo.png" alt="logo" className="w-24" width={48} height={48} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-semibold text-gray-700">
                            {file.filename}
                          </p>
                          <p className="text-lg text-gray-500">
                            <span className="text-sm font-semibold text-gray-600">
                              Language:
                            </span>{" "}
                            {file.language}
                          </p>
                        </div>
                        <div className="flex items-center">
                          
                          <div
                            className="p-2 w-9 h-9 justify-center bg-gray-100 rounded-full shadow hover:bg-gray-200 cursor-pointer flex items-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFile(file?._id)
                            }
                            }
                          >
                            <FontAwesomeIcon
                              icon={faTrashCan}
                              width={16}
                              className="text-red-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {expandedFolderId === folder._id && folder.files.length === 0 && (
                <p className="mt-4 text-center text-gray-500">No files</p>
              )}
            </div>
          ))
        ) : (
          <p>No folders</p>
        )}
      </div>
    </ModalProvider>
  );
}

export default FolderSection;
