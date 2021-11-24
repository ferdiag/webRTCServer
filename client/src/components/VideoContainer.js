import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";

const VideoContainer = () => {
  // This component will be shown if the isVideoConference is true.
  // It handles the rendering and deleting of mediastreams.
  // useMemo is required because otherwise the stream gets rerendered.
  // parent: App.js

  const {
    localPeerForBroadcast,
    forceUpdate,
    email,
    videoContainerRef,
    arrayOfStreams,
    setArrayOfStreams,
    isVideoConference,
    dataChannelForData,
    indexOfActiveRoom,
    roomsRef,
    setIsVideoConference,
  } = useContext(AppContext);

  const handleDeleteStream = (e, index) => {
    // First, get the stream and stop it.
    e.preventDefault();

    const stream = arrayOfStreams[index].stream;
    const tracks = stream.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    const streamId = arrayOfStreams[index].stream.id;
   
     arrayOfStreams.map(stream=>console.log(stream.stream,streamId))
    const updateArray = arrayOfStreams.filter(
      (streamObject) => streamObject.stream.id != streamId
    );
    

    if (arrayOfStreams[index].peer === "localStream") {
      dataChannelForData.current.send(
        JSON.stringify({
          action: "delete",
          roomId: roomsRef.current[indexOfActiveRoom].roomId,
          emailOfCreator: roomsRef.current[indexOfActiveRoom].emailOfCreator,
          streamId: arrayOfStreams[index].stream.id,
          email,
        })
      );
      localPeerForBroadcast.current.close();
      localPeerForBroadcast.current = {};
    }
    if (arrayOfStreams[index].peer === "externalStream") {
      arrayOfStreams[index].peer.close();
      arrayOfStreams[index].peer = null;
    }
    console.log(streamId, updateArray);
    setArrayOfStreams(updateArray);
  
    setIsVideoConference(false);
    forceUpdate()
  };

  const showArrayOfStreams = useMemo(
    () =>
      arrayOfStreams.map((streamObject, index) => {
        return streamObject.stream.id ? (
          <div
            style={{
              display: "flex",
              background: "green",
              flexDirection: "row",
              height: "400px",
              width: "350px",
              border: "1px solid black",
            }}
            key={index}
          >
            <video
              style={{
                height: "400px",
                width: "300px",
              }}
              autoPlay
              ref={(video) => {
                if (video) video.srcObject = streamObject.stream;
              }}
            ></video>
            <button
              style={{ height: "50px", width: "50px" }}
              onClick={(e) => handleDeleteStream(e, index)}
            >
              X
            </button>
          </div>
        ) : null;
      }),
    [arrayOfStreams, handleDeleteStream]
  );

  return (
    <div
      style={
        !isVideoConference || arrayOfStreams.length === 0
          ? { display: "none" }
          : {
              height: "300",
              width: "210px",
              display: "flex",
              flexDirection: "row",
            }
      }
      ref={videoContainerRef}
      id="videoContainer"
    >
      {showArrayOfStreams}
    </div>
  );
};

export default VideoContainer;
