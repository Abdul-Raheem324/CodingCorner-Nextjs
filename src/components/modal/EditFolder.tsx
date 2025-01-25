import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalTrigger,
  ModalContent,
} from "@/components/ui/animated-modal";
import { useModal } from "../ui/animated-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import ClipLoader from "react-spinners/ClipLoader";

interface EditFolderProps {
  onEdit : (folderName: string , folderId : string) => void,
  folderId : string,
  editLoading : boolean

}
export const EditFolder = ({onEdit,folderId, editLoading} : EditFolderProps) => {
  const [folderName, setFolderName] = useState("");
  const { setOpen } = useModal();

  const handleEditFolder = () => {
    if (folderName.trim() !== "") {
      onEdit(folderName,folderId)
      setOpen(false);
      setFolderName("");
    } else {
      toast.error("Folder name cannot be empty.");
    }
  };
  const handleInputEnter = (e: React.KeyboardEvent) => {
      if (e.code === "Enter") {
        handleEditFolder();
      }
    };
  

  return (
    <Modal>
      <ModalTrigger>
        <div className="flex">
        <div className="flex items-center w-full p-2 bg-white rounded-full shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer">
          <FontAwesomeIcon
            icon={faPencil}
            className="text-blue-600"
            width={16}
          />
        </div>
        </div>
      </ModalTrigger>
      <ModalBody className="flex justify-center items-center h-1/3 w-full">
        <ModalContent className="w-full max-w-md p-4 rounded-lg  flex  justify-center">
          <h2 className="text-2xl font-Roboto  text-center mb-4">
            Update Folder Name
          </h2>
          <input
            type="text"
            placeholder="Update folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            onKeyUp={handleInputEnter}
          />
          <div className="flex justify-center">
            <button
              onClick={handleEditFolder}
              className="ml-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
            >
               {editLoading ? <ClipLoader /> : "Update"} 
            </button>
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
};
