import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const Sidebar = () => {
    
    //This compoent shows the array of rooms. Furthermore it handles which room will be rendered from the Main.js component.
    //parent:App.js

    const { setIndexOfActiveRoom,roomsRef } = useContext(AppContext)

    const handleClick =(event,index)=>{
        event.preventDefault();

        setIndexOfActiveRoom(index)
    }
    return (

        <div style={{ width: "10%", height: "800px", backgroundColor: "green",display:"flex",flexDirection:"column" }} className="sidebar">
            {
                (roomsRef.current||[]).map((room, index) =>
                    <button onClick={e=>handleClick(e,index)} key={index}>{room.roomName}</button>
                )
            }
        </div>
    )
}

export default Sidebar
