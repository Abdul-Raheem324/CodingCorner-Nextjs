import React, { useState } from "react";
import { Modal, ModalBody, ModalTrigger, ModalContent } from "@/components/ui/animated-modal";
import { useModal } from "../ui/animated-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";

interface NewFileModalProps {
  onCreate: (fileName: string,folderId: string ,language: string) => void;
  floading: boolean;
  folderId: string,
}

export const NewFileModal: React.FC<NewFileModalProps> = ({ onCreate,folderId ,floading  }) => {
  const { setOpen } = useModal(); 
  const [fileName, setFileName] = useState("");
  const [language, setLanguage] = useState("javascript");

  const handleCreateFile = () => {
    if (fileName.trim() !== "" && language) {
      onCreate(fileName, folderId,language);
      console.log(`File created with name: ${fileName} , language:${language}`);
      setOpen(false);
      setFileName("")
      setLanguage("javascript")
    } else {
      toast.error("File name and language must be selected.");
    }
  };
  const handleInputEnter = (e: React.KeyboardEvent) => {
        if (e.code === "Enter") {
          handleCreateFile();
        }
      };

  return (
    <Modal>
      <ModalTrigger>
        <div className="flex items-center gap-2 p-2 bg-blue-100 hover:bg-blue-200 rounded-md cursor-pointer transition duration-300">
          <FontAwesomeIcon icon={faPlus} className="text-blue-600" width={16} />
          <span className="text-blue-600 font-semibold">New File</span>
        </div>
      </ModalTrigger>
      <ModalBody className="flex justify-center items-center ">
        <ModalContent className="w-full max-w-md p-4 bg-white rounded-lg flex justify-center">
          <h2 className="text-2xl mb-4">Create a New File</h2>
          <input
            type="text"
            placeholder="Enter file name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            onKeyUp={handleInputEnter}
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
          >
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
          <div className="flex justify-end">
            <button
              onClick={handleCreateFile}
              className="ml-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
              disabled={floading}
            >
              {floading ? <ClipLoader size={16} /> : "Create File"}
            </button>
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
};
