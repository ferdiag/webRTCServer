import React, { useEffect, useState, useRef, useReducer } from "react";
import { socket } from "../services";
import { v4 as uuidv4 } from "uuid"; //i use this library for creating id´s

const AppContext = React.createContext();

function AppContextProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickName, setNickname] = useState("");
  const [rooms, setRooms] = useState([]);
  const [email, setEmail] = useState("");
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0); // forces to rerender the component.
  const [indexOfActiveRoom, setIndexOfActiveRoom] = useState(0); //the index of the room which is currently shown.
  const [arrayOfStreams, setArrayOfStreams] = useState([]);
  const [isVideoConference, setIsVideoConference] = useState(false); //toggles if there is a videoconference

  const roomsRef = useRef(); //roomsRef is an Array with all the Users rooms.
  const videoContainerRef = useRef();
  const localStreamRef = useRef();

  const localPeerForDataChannel = useRef(); // peer for  establishing the datachannel.
  const localPeerForBroadcast = useRef(); //peer for broadcasting a video

  const dataChannelForData = useRef();
  const dataChannelForVideostream = useRef();

  const handleInitialConnection = async (dataOfLogin) => {
    //This component creates the peer connection.
    // The Reference dataChannel.current is waiting until the readyState is open, then it will execute the socke.emit to send the data to the backend.

    // args:
    // @dataOfLogin:(object): This object has the two values from the login comnponent (email and password)
    // @action(string): The createPeer function will send the data to this endpoint at the backend.
    // @handleReceiveDataFromDatachannel(function): This function handles the receiving massages from the backend.
    // parent:Login.js

    const action = "createInitialConnection";
    const peer = await createPeer(action);

    dataChannelForData.current = peer.createDataChannel(`${socket.id}`);
    dataChannelForData.current.onopen = (e) => {
      dataChannelForData.current.send(
        JSON.stringify({
          socketOfSender: socket.id,
          email: dataOfLogin.email,
          password: dataOfLogin.password,
          action: "login",
        })
      );
    };
    handleReceiveDataFromDatachannel();

    localPeerForDataChannel.current = peer;
  };

  const handleInitialVideostream = async () => {
    const action = "createVideoConnection";
    const peer = await createPeer(action);
    console.log(socket.id)
    dataChannelForVideostream.current = peer.createDataChannel(`datastream`);

    const constraints = {
      audio: false,
      video: true,
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((localStream) => {
        
      if (!isVideoConference) {
        localStream
          .getTracks()
          .forEach((track) =>
            localPeerForBroadcast.current.addTrack(track, localStream)
          );
          console.log(localPeerForBroadcast)
        dataChannelForData.current.send(
          JSON.stringify({
            streamId: localStream.id,
            sender: socket.id,
            nickName: nickName,
            roomId: roomsRef.current[indexOfActiveRoom].roomId,
            emailOfCreator: roomsRef.current[indexOfActiveRoom].emailOfCreator,
            emailOfSender: email,
            action: "startVideoConference",
          })
        );
        setArrayOfStreams([...arrayOfStreams, { stream: localStream }]);
      }
      localStreamRef.current = localStream;
      localPeerForBroadcast.current = peer;
    });
  };

  const createPeer = async (target,targetData) => {
    // This function creates a new peer object, then the id is set to identify the peer.
    // This is just importend if the the target is "createReceivingStreams".

    // args:
    // @target(string): endpoint, where to send the data.
    console.log(target)
    let peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ], // the server used to find the other ice candidate
        },
      ],
    });

    peer.id = uuidv4(); //The id is appended to find the peer at the arrayOfStreams array.
    
    if (target === "createInitialConnection") {
      peer.role = "dataPeer";
      localPeerForDataChannel.current = peer;
    }
    if (target === "createVideoConnection") {
      peer.role = "videoPeer";
      localPeerForBroadcast.current = peer;
    }
    if(target==="createPeerForReceivingStreams"){
      setArrayOfStreams(currentArrayOfStreams=>{
        return [...currentArrayOfStreams,{
          stream:{},
          peer,
          role: "externalStream",
        }] 
      })
    }

    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, target,targetData);
    peer.onicecandidate = (e) => {};

    peer.onconnectionstatechange = (e) => {};

    peer.ontrack = (e) => {
      console.log("get a track");

      //receive a track from the WebRtc channel. you have to use the setArrayofStreams
      //  and execute all logic in it otherwise you dont get access to the current state!!!
      // args:
      //e (object): this is an event object, which transports the stream.

      setIsVideoConference(true);
      setArrayOfStreams((currrentArrayOfStreams) => {
        let copyOfCurrrentArrayOfStreams = [...currrentArrayOfStreams];

        const indexOfTargetStreamObject =
          copyOfCurrrentArrayOfStreams.findIndex(
            (streamObject) => streamObject.peer.id === e.currentTarget.id
          );

        copyOfCurrrentArrayOfStreams[indexOfTargetStreamObject] = {
          stream: e.streams[0],
          peer: e.currentTarget,
          role: "externalStream",
        };
        return copyOfCurrrentArrayOfStreams;
      });
    };
    return peer;
  };

  //handleNegotiation

  async function handleNegotiationNeededEvent(peer, target,targetData) {
    // This function sets the local description which is essential for establishing a connection via webrtc.
    console.log("handleNegotiation is working");
    // args:
    // @peer(object): the peer object needs a local- and a remote desctripton for a connection.
    // @target(string): the targeted endpoint on the server sidee.

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    peer.socketOfSender = socket.id;

    const payload = {
      sdp: peer.localDescription,
      socketOfSender: socket.id,
      email,
      action: target,
      peerID: peer.id,
      emailOfCreator:targetData && targetData.emailOfCreator
    };

    socket.emit(`${target}`, payload, (data) => {
      console.log("got data back");

      let targetPeer = {};

      if (data.action === "createInitialConnection")
        targetPeer = localPeerForDataChannel;
      if (data.action === "createVideoConnection")
        targetPeer = localPeerForBroadcast;
       

      const desc = new RTCSessionDescription(data.sdp);
      targetPeer.current
        .setRemoteDescription(desc)
        .catch((e) => console.log(e));
    });
  }

  useEffect(() => {
    //This useEffect is waiting for incoming data to create a peerconnection for receiving a stream.

    // args:
    //@addTransceiver(function): adds a tunnel for receiving and sending streams through the webrtc connection.
    //@data (object): just for transport and to identyfy the broadcaster on server side. This object contains the key value pair of emailOfCreator and IdOfTargetRoom.

    socket.on("invitationforReceivingAStream", async(data) => {
      console.log(data)
      const action = "createPeerForReceivingStreams";
      const peer = await createPeer(action, data);
    
      peer.addTransceiver("video", { direction: "recvonly" });

    });
  }, [setArrayOfStreams, arrayOfStreams]);

  useEffect(() => {
    // This socket gets the answer from the handlenegotionationneeded function (action=createReceivingStreams).
    // set the peer remoteDescription for establishing the webRtc connection.

    // args:
    // @data (object): Includes the peerID to identy the correct peer at the arrayOfStreams.

    socket.on("answerCreatePeerForReceivingStreams", (data) => {
      console.log("got answer",data)
      const indexOfTargetStream = arrayOfStreams.findIndex(
        (streamObject) => streamObject.peer.id === data.peerID
      );

      if (indexOfTargetStream >= 0) {
        const desc = new RTCSessionDescription(data.sdp);

        const copyOfArray = [...arrayOfStreams];
        copyOfArray[indexOfTargetStream].peer.setRemoteDescription(desc);

        setArrayOfStreams(copyOfArray);
      }
    });
  }, [videoContainerRef, arrayOfStreams, setArrayOfStreams]);

  const handleReceiveDataFromDatachannel = () => {
    //Handles the incoming Data from the webRtc datachannel.

    dataChannelForData.current.onmessage = (e) => {
      // args:
      //@e.data(object): The keys of this object can differ but the data.action gives the information which if-statement will be exectuted.
      const data = JSON.parse(e.data);

      if (data.action === "login") {
        setIsLoggedIn(true);
        setNickname(data.srcUser.nickName);
        setEmail(data.srcUser.email);
        setRooms(() => data.srcUser.rooms);
        roomsRef.current = data.srcUser.rooms;
        forceUpdate();
      }

      if (data.action === "updateChat") {
        const roomIndex = roomsRef.current.findIndex(
          (room) => room.roomId === data.roomId
        );

        if (roomIndex < 0) {
          //if there is no chat, this code creates a new one
          roomsRef.current = [
            ...roomsRef.current,
            {
              roomName: data.nickName,
              chat: [],
              roomId: data.roomId,
              emailOfCreator: data.emailOfCreator,
              isVideoConference: false,
              chat: [
                {
                  message: data.message,
                  nickName: data.nickName,
                  timestamp: data.timestamp,
                },
              ],
            },
          ];
          forceUpdate();
        }
        if (roomIndex >= 0) {
          //if the room exists, update the chat
          roomsRef.current[roomIndex].chat = [
            ...roomsRef.current[roomIndex].chat,
            {
              message: data.message,
              nickName: data.nickName,
              timestamp: data.timestamp,
            },
          ];
          forceUpdate();
        }
      }
      if (data.action === "searchUser") {
        if (data.result != "error") {
          let rawName = "";
          for (let i = 0; i < data.members.length; i++) {
            //creating the name of the room.
            const memberNickName = data.members[i].nickName.toString();

            if (nickName != memberNickName) {
              rawName = rawName.concat(" ", memberNickName);
            }
          }

          roomsRef.current = [
            ...roomsRef.current,
            {
              roomName: rawName,
              members: data.members,
              chat: [],
              roomId: data.roomId,
              emailOfCreator: data.emailOfCreator,
              isVideoConference: false,
            },
          ];
          forceUpdate();
        }
      }

      if (data.action === "addUserToExistingChat") {
        const indexOfTargetRoom = roomsRef.current.findIndex(
          (room) => room.roomId === data.roomId
        );

        roomsRef.current[indexOfTargetRoom].roomName = roomsRef.current[
          indexOfTargetRoom
        ].roomName.concat(data.nickName);

        roomsRef.current[indexOfTargetRoom].members = [
          ...roomsRef.current[indexOfTargetRoom].members,
          {
            email: data.email,
            nickName: data.nickName,
            isLoggedIn: true,
          },
        ];
        forceUpdate();
      }
    };
  };

  return (
    <AppContext.Provider
      value={{
        arrayOfStreams,
        setArrayOfStreams,
        isVideoConference,
        setIsVideoConference,
        indexOfActiveRoom,
        setIndexOfActiveRoom,
        isLoggedIn,
        setIsLoggedIn,
        nickName,
        setNickname,
        dataChannelForData,
        dataChannelForVideostream,
        roomsRef,
        localPeerForDataChannel,
        localPeerForBroadcast,
        handleInitialVideostream,
        rooms,
        setRooms,
        email,
        setEmail,
        forceUpdate,
        handleInitialConnection,
        localStreamRef,
        videoContainerRef,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export { AppContextProvider, AppContext };
