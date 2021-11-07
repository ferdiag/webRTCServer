import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const VideoContainer = () => {
  // will only be shown if a videoconference has been started.
  // parent: App.js

  const {
    videoContainerRef,
    arrayOfStreams,
    setArrayOfStreams,
    isVideoConference,
    dataChannel
  } = useContext(AppContext);

  const handleDeleteStream = (e, index) => {
    e.preventDefault();

   dataChannel.current.send(JSON.stringify({
       action:"delete"
   }))
    const stream = arrayOfStreams[index].stream;
    const tracks = stream.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });
    const streamId = arrayOfStreams[index].id;
    const updateArray = arrayOfStreams.filter(
      (stream) => stream.id != streamId
    );
    if(arrayOfStreams[index].peer){ 
        arrayOfStreams[index].peer.close()
        console.log(arrayOfStreams[index].peer)
    }
    setArrayOfStreams(updateArray);
  };

  const showArrayOfStreams = arrayOfStreams.map((streamObject, index) => {
    return (
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
    );
  });

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
