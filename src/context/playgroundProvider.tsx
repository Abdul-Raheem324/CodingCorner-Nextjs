"use client";

import React, {
  ReactNode,
  useContext,
  createContext,
  useState,
  useEffect,
} from "react";

interface User {
  username: string;
  email: string;
  _id : string
}

interface Folder {
  _id: string;
  foldername: string;
  owner: string;
  files: File[];
}

interface File {
  _id : string,
  filename: string,
  code : string,
  folder : string,
  language: string,
  owner : string,
}
interface PlaygroundContextType {
  user?: User | null;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  folders?: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  files?: File[];
  setFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  // getDefaultCode: (folderId: string, fileId: string) => string;
  // getLanguage: (folderId: string, fileId: string) => string;
  getFileExtension: (folderId: string, fileId: string) => string;
  selectedFile?:File | null;
  setSelectedFile:React.Dispatch<React.SetStateAction<File | null>>;
}

const playgroundContext = createContext<PlaygroundContextType | undefined>(
  undefined
);
interface PlaygroundProviderProps {
  children: ReactNode;
}



export const PlaygroundProvider: React.FC<PlaygroundProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // const getDefaultCode = (folderId:string, fileId:string) =>{
  //   for(let i = 0; i < folders.length; i++) {
  //     if(folders[i]._id === folderId) {
  //       for(let j = 0; j < folders[i].files.length; j++) {
  //         const currFile = folders[i].files[j];
  //         if(currFile._id === fileId) {
  //           return currFile.code
  //         }
  //       }
  //     }
  //   }
  //   return ''
  // }

  // const getLanguage = (folderId:string, fileId:string) =>{
    // for(let i = 0; i < folders.length; i++) {
    //   if(folders[i]._id === folderId) {
    //     for(let j = 0; j < folders[i].files.length; j++) {
    //       const currFile = folders[i].files[j];
    //       if(currFile._id === fileId) {
    //         return currFile.language
    //       }
    //     }
    //   }
    // }
    // return ''
  // }

  const getFileExtension = (folderId: string, fileId: string): string => {
    for (let i = 0; i < folders.length; i++) {
      if (folders[i]._id === folderId) {
        for (let j = 0; j < folders[i].files.length; j++) {
          const currFile = folders[i].files[j];
          if (currFile._id === fileId) {
            switch (currFile.language) {
              case 'javaScript':
                return '.js';
              case 'python':
                return '.py';
              case 'cpp':
                return '.cpp';
              case 'java':
                return '.java';
              case 'c':
                return '.c';
              default:
                return '.txt';
            }
          }
        }
      }
    }
    return '.txt'; 
  };
  

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.log("Failed to parse user from localStorage", error);
      }
    }
  }, []);
  return (
    <playgroundContext.Provider value={{ user, setUser, folders, setFolders,files, setFiles, getFileExtension,selectedFile , setSelectedFile }}>
      {children}
    </playgroundContext.Provider>
  );
};

export const usePlaygroundState = (): PlaygroundContextType => {
  const context = useContext(playgroundContext);
  if (!context) {
    throw new Error(
      "usePlaygroundState must be used within a PlaygroundProvider"
    );
  }
  return context;
};
