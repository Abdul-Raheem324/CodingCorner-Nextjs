import * as React from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function KeepMountedModal() {
  const [open, setOpen] = React.useState(false);
  const [roomId, setRoomId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const router = useRouter();
  // const socket = getSocket();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleJoin = () => {
    setLoading(true);
    if (roomId.trim()) {
    //   socket.emit("verifyRoom", { roomId }, (response: { valid: false; }) => {
    //     setLoading(false);
    //     if (response.valid) {
          router.push(`collaborate/${roomId}`);
        // } else {
        //   toast.error("Invalid room ID.");
        
      // });
    } else {
      toast.error("Please enter a valid room ID.");
      setLoading(false);
    }
  };

  const handleInputEnter = (e: React.KeyboardEvent) => {
    if (e.code === "Enter") {
      handleJoin();
    }
  };

  return (
    <div>
      <button
        className="text-gray-200 font-roboto px-3 py-2 bg-green-600 rounded-md hover:bg-green-700"
        onClick={handleOpen}
        disabled={loading}
      >
        Join Room
      </button>
      <Modal
        keepMounted
        open={open}
        onClose={handleClose}
        aria-labelledby="keep-mounted-modal-title"
        aria-describedby="keep-mounted-modal-description"
      >
        <Box sx={style} className="rounded-md  w-1/3 shadow-lg ">
          <div className="p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Join a Room</h2>
            <p className="mb-4 text-gray-600">
              Enter the Room ID to join an existing room.
            </p>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyUp={handleInputEnter}
              placeholder="Room ID"
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleJoin}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {loading ? <ClipLoader size={25} /> : "Join"}
              </button>
              <button
                onClick={handleClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
