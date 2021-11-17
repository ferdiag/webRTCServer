import React, { useContext,useMemo } from "react";
import { AppContext } from "../context/AppContext";

const VideoContainer = () => {
  // This component will be shown if the isVideoConference is true.
  // It handles the rendering and deleting of mediastreams.
  //you have to use useMemo otherwise the stream gets rerendered.
  // parent: App.js

  const {
    videoContainerRef,
    arrayOfStreams,
    setArrayOfStreams,
    isVideoConference,
    dataChannelForData,
    indexOfActiveRoom,
    roomsRef
  } = useContext(AppContext);

  const handleDeleteStream = (e, index) => {
    // First, get the stream and stop it.

    e.preventDefault();
   console.log(roomsRef[indexOfActiveRoom])
   dataChannelForData.current.send(
      JSON.stringify({
        action: "delete",

      })
    );

    const stream = arrayOfStreams[index].stream;
    const tracks = stream.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    const streamId = arrayOfStreams[index].id;
    const updateArray = arrayOfStreams.filter(
      (stream) => stream.id != streamId
    );
    if (arrayOfStreams[index].peer === "externalStream") {
      console.log(arrayOfStreams[index].peer);
      //If there is a peer, the peer conenction will be closed.
      // This is important, because you dont want to close the local peer connection.
      arrayOfStreams[index].peer.close();
    }
    setArrayOfStreams(updateArray);
  };

  const showArrayOfStreams = useMemo(       //useMemo handles the rerendering of the component. Rerender occurs just after a change of arrayOfStreams.
    () =>
      arrayOfStreams.map((streamObject, index) => {
        return streamObject.stream.id ? (
          <div key={index}>
            <video
              autoPlay
              ref={(video) => {
                if (video) video.srcObject = streamObject.stream;
              }}
              style={{
                height: "400px",
                width: "400px",
                border: "1px solid black",
              }}
            ></video>
            <button onClick={(e) => handleDeleteStream(e, index)}>X</button>
          </div>
        ) : null;
      }),
    [arrayOfStreams]
  );

  return (
    <div
      style={
        !isVideoConference || arrayOfStreams.length === 0
          ? { display: "none" }
          : {
              height: "500px",
              width: "500px",
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
