import React, { useState } from "react";
import { Modal, ModalBody, ModalTrigger, ModalContent } from "@/components/ui/animated-modal"; 
import { useModal } from "../ui/animated-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";

interface EditFileProps {
  onEdit: (fileName: string, fileId: string) => void;
  fileId: string;
  editLoading: boolean;
}

export const EditFile: React.FC<EditFileProps> = ({ onEdit, fileId, editLoading }) => {
  const { setOpen } = useModal();
  const [fileName, setFileName] = useState("");

  const handleEditFile = () => {
    if (fileName.trim() !== "") {
      onEdit(fileName, fileId);
      setOpen(false);
      setFileName("");
    } else {
      toast.error("File name must be provided!");
    }
  };
  
  const handleInputEnter = (e:React.KeyboardEvent) =>{
    if (e.code === "Enter") {
      handleEditFile();
    }
  }

  return (
    <Modal>
      <ModalTrigger>
        {/* <div className="flex">
        <div className="flex items-center w-full p-2 bg-white rounded-full shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer">
          <FontAwesomeIcon icon={faPencil} className="text-blue-600" width={16} />
        </div>
        </div> */}
        <FontAwesomeIcon
                  icon={faPencilAlt}
                  className="text-gray-500 ml-4 cursor-pointer hover:text-gray-200"
                  width={16}
                />
      </ModalTrigger>
      <ModalBody className=" nset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <ModalContent className="w-full p-4 bg-white rounded-lg">
          <h2 className="text-2xl font-Roboto text-center mb-4">Update File Name</h2>
          <input
            type="text"
            placeholder="Update File name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            onKeyUp={handleInputEnter}
          />
          <div className="flex justify-center">
            <button
              onClick={handleEditFile}
              className="ml-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
              disabled={editLoading}
            >
              {editLoading ? <ClipLoader size={16} /> : "Update"}
            </button>
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
};
