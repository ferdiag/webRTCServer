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
  } = useContext(AppContext);

  const handleDeleteStream = (e, index) => {
    e.preventDefault();

    const stream = arrayOfStreams[index];
    const tracks = stream.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });
    const streamId = arrayOfStreams[0].id;
    const updateArray = arrayOfStreams.filter(
      (stream) => stream.id != streamId
    );

    setArrayOfStreams(updateArray);
  };

  const showArrayOfStreams = arrayOfStreams.map((stream, index) => {
    return (
      <div key={index}>
        <video
          autoPlay
          ref={(video) => {
            if (video) video.srcObject = stream;
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
