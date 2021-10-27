import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const VideoContainer = () => {

    //This component is a container for the streams received at the
    // app context and will only be shown if a videoconference has been started.
    // parent: App.js
    
    const { videoContainerRef,isVideoConference } = useContext(AppContext)
    return (
        <div style={!isVideoConference ? {display:"none"} :{
            height: "500px",
            width: "500px",
        }}
            ref={videoContainerRef}
            id="videoContainer">
        </div>
    )
}

export default VideoContainer
