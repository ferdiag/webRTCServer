import React, { useEffect, useState, useRef, useReducer } from "react"
import { socket } from "../socket/"
import { v4 as uuidv4 } from 'uuid';  //i use this library for creating id´s

const AppContext = React.createContext()

function AppContextProvider({ children }) {
  const [arrayOfReceivingPeers, setArrayOfReceivingPeers] = useState([])    //a list of created peers for receiving videostreams of broadcasters
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nickName, setNickname] = useState("")
  const [rooms, setRooms] = useState([])    
  const [email, setEmail] = useState("")
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0); // forces to rerender the component.
  const [indexOfActiveRoom, setIndexOfActiveRoom] = useState(0)   //the index of the room which is currently shown.
  
  const dataChannel = useRef();
  const roomsRef = useRef();  //roomsRef is an Array with all the Users rooms.
  const videoContainerRef = useRef(); 
  const localPeerRef = useRef(); //the peer for broadcasting a video and establishing the datachannel.
  const [isVideoConference, setIsVideoConference] = useState(false)   //toggles if there is a videoconference


  const handleInitialConnection = dataOfLogin => {

    //This component creates the peer connection.
    // The Reference dataChannel.current is waiting until the readyState is open, then it will execute the socke.emit to send the data to the backend.
    
    // args:
    // @dataOfLogin:(object): This object has the two values from the login comnponent (email and password)
    // @action(string): The createPeer function will send the data to this endpoint at the backend. 
    // @handleReceiveDataFromDatachannel(function): This function handles the receiving massages from the backend.
    // parent:Login.js

    const action = 'createInitialConnection'
    const peer = createPeer(action);
    console.log(socket.id)
    dataChannel.current = peer.createDataChannel(`${socket.id}`)
    dataChannel.current.onopen = e => {
      dataChannel.current.send(JSON.stringify({
        socketOfSender: socket.id,
        email: dataOfLogin.email,
        password: dataOfLogin.password,
        action: "login"
      })
      )
    }
    handleReceiveDataFromDatachannel()

    localPeerRef.current = peer
  }
 
  const createPeer = (target, targetData = {}) => {

    // This function creates a new peer object, then the id is set to identify the peer.
    // This is just importend if the the target is "createReceivingStreams".    
    
    // args:
    // @target(string): endpoint where to send the data.
    // @targetData (object): this object is not empty if the value of the targetstring is createReceivingStreams. 
     
    let peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun1.l.google.com:19302", // the server used to find the other ice candidate
        }
      ]
    })
    peer.id = uuidv4(); //The id is appended to find the peer at the arrayOfReceivingPeers array.
    targetData = {
      ...targetData,
      peerID: peer.id
    }

    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, target, targetData)

    peer.ontrack = e => {
      setIsVideoConference(true)
      //Receiving an object from the server wich includes the stream.  
      //Creating a video element and append this to the videoContainerRef.
      //The id is set for identifying and destroying the videoelement.    

      // args:
      //e (object): this is an event object, which transports the stream. 
      
      const videoContainer = document.getElementById('videoContainer')
      const newElement = document.createElement('video')
      const numberOfChildren = videoContainer.childElementCount

      newElement.style.width = '400px';
      newElement.style.height = '400px';

      newElement.style.border = '1px black solid'
      newElement.setAttribute('id', 'video' + numberOfChildren)

      videoContainer.appendChild(newElement)
      newElement.srcObject = e.streams[0];
      newElement.play()
      console.log(videoContainerRef)
      forceUpdate()
    }
    return peer
  }

  //handleNegotiation

  async function handleNegotiationNeededEvent(peer, target, targetData) {
    
    // This function sets the local description which is essential for establishing a connection via webrtc.
    
    // args:
    // @peer(object): the peer object needs a local- and a remote desctripton for a connection. In this function you set the local.
    // @target(string): the targeted endpoint on the server sidee.
    // @targetData (object): this object is not empty if the target is "createReceivingStreams". In this case the keys are emailOfCreator and IdOfTargetRoom.

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer)
    peer.socketOfSender = socket.id

    if (target === "createInitialConnection") localPeerRef.current = peer
    const payload = {
      sdp: peer.localDescription,
      socketOfSender: socket.id,
      targetData
    } 
   
    const updatedArray =[
      ...arrayOfReceivingPeers, peer
    ]
    target === "createPeerForReceivingStreams" && setArrayOfReceivingPeers(updatedArray)
   
    socket.emit(`${target}`, payload, data => {
      console.log('got data back')
      const desc = new RTCSessionDescription(data.sdp);
      localPeerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    })
  }

  useEffect(() => {

  //This useEffect is waiting for incoming data to create a peerconnection for receiving a stream. 
  
  // args:
  //@createPeer (function): creating a new Peer connection
  //@addTransceiver(function): adds a tunnel for receiving and sending streams through the webrtc connection
  //@data (object): just for transport and to identyfy the broadcaster on server side. This object contains the key value pair of emailOfCreator and IdOfTargetRoom.

    socket.on('invitationforReceivingAStream', data => {
      const action = 'createPeerForReceivingStreams'
      const peer = createPeer(action, data);
      peer.addTransceiver("video", { direction: "recvonly" })
    })
  }, [])



  useEffect(() => {
  // This socket gets the answer from the handlenegotionationneeded function (action=createReceivingStreams). 
  // First it finds the correct peer at the arrayOfReceiving array and then update the remoteDescription for establishing the webRtc connection.
  
  // args:
  // @data (object): Includes the peerID to identry the correct peer at the arrayOfReceivingPeers array.
  
    socket.on('answerCreatePeerForReceivingStreams', data => {
      const targetPeer = arrayOfReceivingPeers.find(peer => peer.id === data.targetData.peerID)
      
      if (targetPeer) {
        const desc = new RTCSessionDescription(data.sdp);
        targetPeer.setRemoteDescription(desc)
      } 
    })
  }, [arrayOfReceivingPeers,setIsVideoConference])

  const handleReceiveDataFromDatachannel = () => {

    //This function handles the incoming Data from the webRtc datachannel.
    
    // args:
    //@data(object): The keys of this object can differ but the data.action gives the information which if-statement will be exectuted.

    dataChannel.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      console.log(data)
      if (data.action === "login") {
        setIsLoggedIn(true)
        setNickname(data.srcUser.nickName)
        setEmail(data.srcUser.email)
        roomsRef.current = data.srcUser.rooms
        forceUpdate()
      }
      if (data.action === "updateChat") {               
        const roomIndex = roomsRef.current.findIndex(room => room.roomId === data.roomId)

        if (roomIndex < 0) { //if there is no chat, this code creates a new one
          roomsRef.current = [
            ...roomsRef.current, {
              roomName: data.nickName,
              chat: [],
              roomId: data.roomId,
              emailOfCreator: data.emailOfCreator,
              isVideoConference: false,
              chat: [{
                message: data.message,
                nickName: data.nickName,
                timestamp: data.timestamp,
              }
              ],
            }]
          forceUpdate()
        }
        if (roomIndex >= 0) { //if the room exists, update the chat
          roomsRef.current[roomIndex].chat = [
            ...roomsRef.current[roomIndex].chat, {
              message: data.message,
              nickName: data.nickName,
              timestamp: data.timestamp,
            }]
          forceUpdate()
        }
      }
      if (data.action === "searchUser") {
        if (data.result != "error") {
          let rawName = ""
          for (let i = 0; i < data.members.length; i++) {       //creating the name of the room.
            const memberNickName = data.members[i].nickName.toString()

            if (nickName != memberNickName) {
              rawName = rawName.concat(' ', memberNickName)
            }
          }

          roomsRef.current = [...roomsRef.current, {
            roomName: rawName,
            members: data.members,
            chat: [],
            roomId: data.roomId,
            emailOfCreator: data.emailOfCreator,
            isVideoConference: false
          }]
          forceUpdate()
        }
      }

      if (data.action === "addUserToExistingChat") {
        const indexOfTargetRoom = roomsRef.current.findIndex(room => room.roomId === data.roomId)

        roomsRef.current[indexOfTargetRoom].roomName = roomsRef.current[indexOfTargetRoom].roomName.concat(data.nickName)

        roomsRef.current[indexOfTargetRoom].members = [
          ...roomsRef.current[indexOfTargetRoom].members, {
            email: data.email,
            nickName: data.nickName,
            isLoggedIn: true
          }]
        forceUpdate()
      }
    }
  }

  return (
    <AppContext.Provider value={{
      isVideoConference, setIsVideoConference,
      indexOfActiveRoom, setIndexOfActiveRoom,
      isLoggedIn, setIsLoggedIn,
      nickName, setNickname,
      dataChannel,
      roomsRef,
      localPeerRef,
      rooms, setRooms,
      email, setEmail,
      forceUpdate,
      handleInitialConnection,
      videoContainerRef
    }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContextProvider, AppContext }