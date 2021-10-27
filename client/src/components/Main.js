import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import Room from './Room'


const Main = () => {

    //This is the main area, currently it renders just the chat componenend but in the future it will render the dashboard too. 
    //parent: App.js
    
    const { roomsRef } = useContext(AppContext)

    return (
        <div className="main" style={{ width: "90%", height: "800px", backgroundColor: "yellow" }}>
            {
            roomsRef.current && roomsRef.current.length >= 0 && <Room />
            }
        </div>
    )
}

export default Main



