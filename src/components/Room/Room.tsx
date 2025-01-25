import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import Tooltip from '@mui/material/Tooltip';
import KeepMountedModal from '../modal/RoomModal';
import { v4 as uuidv4 } from 'uuid';
import {useRouter} from 'next/navigation';

function Room() {
    const router = useRouter();

    const createRoom = () => {
      const id = uuidv4();
      router.push(`/collaborate/${id}`)
    } 
  return (
    <div>
       <div className='flex gap-5 mt-5 items-center'>
              <div 
                onClick={createRoom}
              className='text-gray-200 hover:cursor-pointer px-3 py-2 bg-blue-600 rounded-md hover:bg-blue-700'
              >Create Room</div>
              <KeepMountedModal />

                <Tooltip title= "Work with your team in real time—everyone’s edits are synced instantly.">
              <FontAwesomeIcon className='text-gray-600 cursor-pointer flex hover:text-gray-500' width={16} icon={faCircleQuestion} />
                </Tooltip>
            </div>
            
    </div>
  )
}

export default Room
