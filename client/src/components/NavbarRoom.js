import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import InvitationAlarm from "./InvitationAlarm";

const NavbarRoom = () => {
  //This component handles the behaviour of the videostream.
  // Here, the user can startm and stop the stream.
  // Furthermore this component handles whether you stream the input of the camera or share the screen with other users.
  // parent: Chat.js.

  const {
    isInvitationForReceivingAStream,
    localPeerForBroadcast,
    handleInitialVideostream,
    localPeerForDataChannel,
    nickName,
    roomsRef,
    arrayOfStreams,
    localStreamRef,
    isVideoConference,
    setIsVideoConference,
  } = useContext(AppContext);

  function handleShowScreen(e) {
    //this function grabs the navigator object and allows the user to share the screen with other users
    //@e(object): The preventDefault() method of the Event interface tells
    //  the user agent that if the event does not get explicitly handled,
    //  its default action should not be taken as it normally would be.

    e.preventDefault();

    const constraints = {
      audio: false,
      video: true,
    };
    if (isVideoConference) {
      navigator.mediaDevices.getDisplayMedia(constraints).then((stream) => {
        return Promise.all(
          localPeerForBroadcast.current.getSenders().map((sender) =>
            sender.replaceTrack(
              stream.getTracks().find((t) => t.kind == sender.track.kind),
              stream
            )
          )
        );
      });
    } else {
      console.log("leider gibt es keine Videoconference");
    }
  }

  const handleShowVideoConference = (e) => {
    // This function takes the getUserMedia method from the navigator.mediaDevices object to get access
    //  to the camera and adds the result to the Peer connection. To inform the members of the room that a
    // video conference started, you send an object to the backend.

    e.preventDefault();
    setIsVideoConference(true);

    handleInitialVideostream();
  };

  return (
    <div>
      <InvitationAlarm />
      <div>{nickName}</div>
      <button onClick={(e) => handleShowVideoConference(e)}>
        {!isVideoConference
          ? "Videokonferenz starten"
          : "Videokonferenz beitreten"}
      </button>
      <button onClick={handleShowScreen}>Bildschirm teilen</button>
      <button onClick={() => console.log(arrayOfStreams)}>
        Aufnahme starten
      </button>
    </div>
  );
};

export default NavbarRoom;
