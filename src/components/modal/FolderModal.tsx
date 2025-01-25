import React, { useState } from "react";
import { Modal, ModalBody, ModalTrigger, ModalContent } from "@/components/ui/animated-modal"; 
import { useModal } from "../ui/animated-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";

interface FolderModalProps {
  onCreate: (folderName: string) => void;
  floading: boolean; 
  
}

export const FolderModal = ({ onCreate , floading}: FolderModalProps) => {
  const [folderName, setFolderName] = useState("");
  const { setOpen } = useModal();

  const handleCreateFolder = () => { 
    if (folderName.trim() !== "") { 
      onCreate(folderName);
         console.log(`Folder created with name: ${folderName}`);
          setOpen(false);
          setFolderName("")
           }
           else { 
            toast.error("Folder name cannot be empty."); 
          }
        }

  const handleInputEnter = (e: React.KeyboardEvent) => {
        if (e.code === "Enter") {
          handleCreateFolder();
        }
      };

  return (
    <Modal>
      <ModalTrigger>
        <div className="flex items-center gap-2 p-2 bg-blue-100 hover:bg-blue-200 rounded-md cursor-pointer ml-4 transition duration-300">
          <FontAwesomeIcon icon={faPlus} className="text-blue-600" width={16} />
          <span className="text-blue-600 font-semibold">New Folder</span>
        </div>
      </ModalTrigger>
      <ModalBody className="flex justify-center items-center">
        <ModalContent className="w-full max-w-md p-4 rounded-lg flex justify-center">
          <h2 className="text-2xl font-Roboto  text-center mb-4">Create a New Folder</h2>
          <input
            type="text"
            placeholder="Enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            onKeyUp={handleInputEnter}
          />
          <div className="flex justify-center">
            <button
              onClick={handleCreateFolder}
              className="ml-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
              disabled={floading}
            >
              {
                floading ? 
                <ClipLoader />:
                "Create"
              }
            </button>
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
};
