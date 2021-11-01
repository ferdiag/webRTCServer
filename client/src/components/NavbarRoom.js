import React, { useState, useContext } from 'react'
import { AppContext } from '../context/AppContext';
import createVideoElement from '../lib/createVideoElement';
import { socket } from '../socket';

const NavbarRoom = () => {

  //This component handles the behaviour of the videostream. 
  // Here the user can start and stop and change the stream to show his screen. 
  // parent: Chat.js.  

  const { localPeerRef, dataChannel, email, nickName, indexOfActiveRoom, localStreamRef, roomsRef, isVideoConference, setIsVideoConference, } = useContext(AppContext)

  const constraints = {
    audio: false,
    video: true
  };

  function handleShowScreen(e) {

    //this function grabs the navigator object and allows the user to share the screen with other users
    //@e(object): The preventDefault() method of the Event interface tells
    //  the user agent that if the event does not get explicitly handled,
    //  its default action should not be taken as it normally would be. 

    e.preventDefault()
    const constraints = {
      audio: false,
      video: true
    }
    navigator.mediaDevices.getDisplayMedia(constraints)
      .then(stream => {
        return Promise.all(localPeerRef.current.getSenders().map(sender =>
          sender.replaceTrack(stream.getTracks().find(t => t.kind == sender.track.kind), stream)
        ))
      })
  }

  const handleShowVideoConference = async e => {

    // This function takes the getUserMedia method from the navigator.mediaDevices object to get access
    //  to the camera and adds the result to the Peer connection. To inform the members of the room that a 
    // video conference started, you send an object to the backend.   

    e.preventDefault();
    setIsVideoConference(!isVideoConference)
    
    const localStream = await navigator.mediaDevices.getUserMedia(constraints)
    console.log(isVideoConference)
    if (dataChannel.current.readyState === 'open') {
      if (!isVideoConference) {
        
        localPeerRef.current.roomId = roomsRef.current[indexOfActiveRoom].roomId
    localStream.getTracks().forEach(track => localPeerRef.current.addTrack(track, localStream));
        dataChannel.current.send(JSON.stringify({
          streamId: localStream.id,
          sender: socket.id,
          nickName: nickName,
          roomId: roomsRef.current[indexOfActiveRoom].roomId,
          emailOfCreator: roomsRef.current[indexOfActiveRoom].emailOfCreator,
          emailOfSender: email,
          action: 'startVideoConference'
        })
        )
      }
      createVideoElement(localStream)
    }
localStreamRef.current = localStream
if (isVideoConference) {
  const stream = localStreamRef.current;
  const tracks = stream.getTracks();

  tracks.forEach((track) => {
    track.stop();
  });
  setIsVideoConference(false)
}
  }

return (
  <div>
    <div>{nickName}</div>
    <button onClick={handleShowVideoConference}>{
      !isVideoConference ?
        "Videokonferenz starten"
        :
        "Videokonferenz beenden"
    }</button>
    <button
      onClick={handleShowScreen}>
      Bildschirm teilen
    </button>
    <button>Aufnahme starten</button>
  </div>
)
}

export default NavbarRoom