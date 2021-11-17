import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { handleChange } from '../lib/handleChange'
import Main from './Main'

import NavbarRoom from './NavbarRoom'
import SearchAndAddUserToAnExistingRoom from './SearchandAddUser'

const Room = () => {

    //This componenet handles the chatinput and renders the components NavbarRoom.js, SearchandAddUserToAnExistingRoom.
    // parent:Main.js

    const { indexOfActiveRoom, roomsRef, forceUpdate, dataChannelForData, nickName, email } = useContext(AppContext)
    const initValChatInput = { textinput: "" }

    const [inputData, setInputData] = useState(initValChatInput)

    const handleClick = e => {
        e.preventDefault();
        // console.log(dataChannel.current.readyState)
       if (inputData.textinput.length===0){
           console.log("bitte machen sie eine Eingae")
           return
       }
        const copyOfRooms = [...roomsRef.current]
        const date = new Date()
        const timestamp = {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            hours: date.getHours(),
            minute: date.getMinutes(),
            seconds: date.getSeconds()
        }
        
        copyOfRooms[indexOfActiveRoom].chat = [ //update the local chat
            ...copyOfRooms[indexOfActiveRoom].chat, {
                message: inputData.textinput,
                timestamp,
                 nickName
            }
        ]

        roomsRef.current = copyOfRooms

        if (dataChannelForData.current.readyState === 'open') {
            dataChannelForData.current.send(JSON.stringify({
                message: inputData.textinput,
                nickName,
                email,
                target: roomsRef.current[indexOfActiveRoom].roomId,
                emailOfCreator: roomsRef.current[indexOfActiveRoom].emailOfCreator,
                timestamp,
                action: 'updateChat'
            })
            )
        }
        //um den Chat an die erste Stelle zu bringen splice und unshift
        forceUpdate()
        console.log(roomsRef.current[0].chat)
        setInputData(initValChatInput)
    }
    const showArray = !roomsRef.current || roomsRef.current.length === 0 ? console.log("now array there") : roomsRef.current[indexOfActiveRoom].chat.map((chatInfo, index) =>
        <li key={index} style={{ display: 'flex', width: "95%", paddingTop: "10px", paddingBottom: "10px" }}>
            <div style={chatInfo.nickName === nickName ? { width: "20%", marginLeft: "70%", backgroundColor: "teal", borderRadius: "5px", paddingTop: "2.5px", paddingBottom: "2.5px", paddingLeft: "10px", paddingRight: "10px" } : { width: "20%", marginLeft: "auto", backgroundColor: "AppWorkspace", borderRadius: "5px", paddingTop: "2.5px", paddingBottom: "2.5px", paddingLeft: "10px", paddingRight: "10px" }}>
                <div style={{ marginLeft: "5px", fontSize: "10px" }} >{chatInfo.nickName} sagte:</div>
                <div>{chatInfo.message}</div>
                <div style={{ fontSize: "9px" }}> um {chatInfo.timestamp.hours}:{chatInfo.timestamp.minute}</div>
                <div style={{ fontSize: "9px" }}> am{chatInfo.timestamp.day}:{chatInfo.timestamp.month}:{chatInfo.timestamp.year}</div>
            </div>
        </li>)

    return (
        <div style={roomsRef.current.length > 0 ? { display: "block" } : { display: "none" }}>
            <NavbarRoom />
            <SearchAndAddUserToAnExistingRoom />
            <div style={roomsRef.current ? { display: "block", width: "100%", height: "50px", backgroundColor: "burlywood", display: "flex", justifyContent: "center" } : { display: 'none' }}></div>
            <ul style={{ backgroundColor: "Background" }}>{showArray}</ul>
            <input onChange={e => handleChange(e, setInputData)} value={inputData.textinput} name="textinput" style={{ width: '40%', height: "28px", margin: "5px" }} />
            <button onClick={handleClick}>Senden</button>
        </div>
    )
}

export default Room
