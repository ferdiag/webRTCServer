import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext';
import { handleChange } from '../lib/handleChange';
import { socket } from '../services';
import { v4 as uuidv4 } from 'uuid';

export const Searchbar = () => {

    //handles the searchinput to find an existing user with its email.
    //parent:NavbarTop.js
    
    const { dataChannelForData, nickName, email } = useContext(AppContext)
    const [inputData, setInputData] = useState({ searchInput: "" })

    const handleSearch = e => {
        e.preventDefault();
    
        if (inputData.searchInput.length > 0) {
            if (dataChannelForData.current.readyState === 'open') {
                dataChannelForData.current.send(JSON.stringify({
                    resultOfSearch: inputData.searchInput,
                    sender: socket.id,
                    nickName: nickName,
                    roomId: uuidv4(),
                    roomName: inputData.searchInput,
                    email,
                    action: 'searchUser'
                })
                )
            }
        } else {
            console.log("machen Sie eine Eingabe")
        }
    }

    return (
        <div style={{ width: "100%", height: "50px", backgroundColor: "blue", display: "flex" }}>
            <input
                onChange={e => handleChange(e, setInputData)}
                type="email"
                value={inputData.searchInput}
                name="searchInput"
                style={{
                    width: '40%',
                    height: "28px",
                    margin: "5px"
                }}
            />
            <button onClick={handleSearch}>Suche Starten</button>
        </div>
    )
}
