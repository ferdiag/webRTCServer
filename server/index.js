const express = require('express');
const fs = require('fs')
const app = express()
const webrtc = require('wrtc');


const server = require('http').createServer(app)
const io = require('socket.io')(server, { cors: { origin: '*' }, });
const cors = require('cors');

const Users = [
  {
    email: "ferdiag@yahoo.de",
    nickName: "ferhat",
    password: "bla",
    isLoggedIn: false,
    sockets: "",
    dataChannel: {},
    peer: {},
    stream: {},
    createdRooms: [],
    rooms: []
  },
  {
    email: "malte@yahoo.de",
    nickName: "falti",
    password: "bla",
    dataChannel: null,
    isLoggedIn: false,
    socket: "",
    dataChannel: {},
    peer: {},
    createdRooms: [],
    stream: {},
    rooms: [],
  },
  {
    email: "musa@yahoo.de",
    nickName: "musa",
    password: "bla",
    dataChannel: null,
    isLoggedIn: false,
    socket: "",
    stream: {},
    peer: {},
    dataChannel: {},
    createdRooms: [],
    rooms: []
  },
]

let listOfPeers = []

app.use(cors())

app.use(express.urlencoded({ extended: true }));
app.use(express.json())

io.on('connection', (socket) => {
  socket.on('createInitialConnection', async (data, callback) => {
    console.log("channel start to create")
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun1.l.google.com:19302",
        }
      ]
    });
   
    peer.socketOfSender = data.socketOfSender   // to identify the broadcaster in the ontrack method
    
    peer.onconnectionstatechange = e=>{
      if(e.connectionState==="connected"){

      }
    }
    
    peer.ontrack = (e) => {

      // This function handles the incoming streams. 
      // The first step is to identify the creator of the stream, 
      // then you assign the stream to the stream key of the creator.
      // The next step is to identy the room of the video conference 
      // and send all Users of the room the order to create a new WebRtc Channel for consuming the mediaStream.
      
      console.log("track received")
      const socketString = peer.socketOfSender.toString()
      const indexOfCreator = Users.findIndex(user => user.socket === socketString)

      if (indexOfCreator >= 0) {
        Users[indexOfCreator].stream = e.streams[0]
      
        const targetRoom = Users[indexOfCreator].createdRooms.find(room => room.isVideoConference === true)
        const filteredTargetRoom = targetRoom.members.filter(member => member.email != Users[indexOfCreator].email && member.isLoggedIn === true)
       
        filteredTargetRoom.forEach(member => {
          console.log(filteredTargetRoom)
          io.to(`${member.socket}`).emit('invitationforReceivingAStream', {
            emailOfCreator: Users[indexOfCreator].email,
            IdOfTargetRoom: targetRoom.roomId
          })
        })
      }
    }

    peer.ondatachannel = (e) => {
      dataChannel = e.channel;
      dataChannel.onmessage = hendleReceiveData
    }

    const desc = new webrtc.RTCSessionDescription(data.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
      sdp: peer.localDescription,
    }
   
    listOfPeers = [
      ...listOfPeers,
      peer
    ]
    console.log(listOfPeers)
    callback(payload);
  })

  function hendleReceiveData(e) {

    //handles the incoming messages of a datachannel.
    
    // args:
    //@e(object): various keys but data.action is responsible what happend to the data send by the client.

    const data = JSON.parse(e.data)
   
    if (data.action === "updateChat") {

    //grap the membersarray from the creator and send the dataOfChat object to them. Then update den Chat on the server
      
      const IndexOfCreator = Users.findIndex(user => user.email === data.emailOfCreator)
      const indexOfTargetRoom = Users[IndexOfCreator].createdRooms.findIndex(room => room.roomId === data.target)
      const members = Users[IndexOfCreator].createdRooms[indexOfTargetRoom].members

      const dataOfChat = {
        nickName: data.nickName,
        emailOfCreator: data.emailOfCreator,
        message: data.message,
        roomId: data.target,
        action: "updateChat",
        timestamp: data.timestamp
      }

      members.forEach(member => {                   
        if (member.isLoggedIn && (member.email != data.email)) {
          member.dataChannel.send(JSON.stringify(dataOfChat))
        }
      })

      Users[IndexOfCreator].createdRooms[indexOfTargetRoom].chat = [
        ...Users[IndexOfCreator].createdRooms[indexOfTargetRoom].chat,
        dataOfChat
      ]
    }
  
      //add user to an existing chat//

    if (data.action === "addUserToExistingChat") {
      const target = Users.find(user => user.email === data.resultOfSearch)
      const indexOfSender = Users.findIndex(user => user.email === data.emailOfSender)
      const indexOfTarget = Users.findIndex(user => user.email === data.resultOfSearch)
      const indexOfCreator = Users.findIndex(user => user.email === data.emailOfCreator)
      const indexOfTargetRoom = Users[indexOfCreator].createdRooms.findIndex(room => room.roomId === data.roomId)

      if (!target) {
        Users[indexOfSender].dataChannel.send(
          JSON.stringify({
            action: "addUserToExistingChat",
            result: "error"
          })
        )
        return
      }

      //update the created Rooms of the creator

      Users[indexOfCreator].createdRooms[indexOfTargetRoom].members = [
        ...Users[indexOfCreator].createdRooms[indexOfTargetRoom].members, {    
          email: data.resultOfSearch,
          nickName: Users[indexOfTarget].nickName,
          dataChannel: Users[indexOfTarget].dataChannel != {} ? Users[indexOfTarget].dataChannel : {},
          isLoggedIn: Users[indexOfTarget].isLoggedIn === true ? true : false
        }]

      //update roomlist of searched user.

      Users[indexOfTarget].rooms = [          
        ...Users[indexOfTarget].rooms, {
          roomName: Users[indexOfTarget].nickName,
          roomId: data.roomId,
          emailOfCreator: Users[indexOfCreator].email,
        }]

      //send the data back to the user 

      Users[indexOfSender].dataChannel.send(JSON.stringify({
        nickName: Users[indexOfTarget].nickName,
        email: Users[indexOfTarget].email,
        isLoggedIn: Users[indexOfTarget].isLoggedIn,
        roomId: data.roomId,
        emailOfCreator: data.email,
        action: "addUserToExistingChat",
      }))
    }

    //start a videoConference //

    if (data.action === "startVideoConference") {
      const indexOfCreator = Users.findIndex(user => user.email === data.emailOfCreator)
      const targetRoom = Users[indexOfCreator].createdRooms.find(room => room.roomId === data.roomId)
      const indexOfTargetRoom = Users[indexOfCreator].createdRooms.findIndex(room => room.roomId === data.roomId)
      const membersOfRoomWithoutSender = targetRoom.members.filter(member => member.email != data.emailOfSender && member.isLoggedIn === true)
     
      if (Object.keys(Users[indexOfCreator].stream).length > 0) {    //wenn das Peer keine keys hat, dann sind die tracks noch nicht angekommen
        membersOfRoomWithoutSender.forEach(member => {
          if (Users[indexOfCreator].stream) {
            Users[indexOfCreator].stream.getTracks().forEach(track => {
              member.peer.addTrack(track, Users[indexOfCreator].stream)
            });
          }
        })
      } else {
        Users[indexOfCreator].createdRooms[indexOfTargetRoom].isVideoConference = true     
      }
    }

    //search a User//

    if (data.action === "searchUser") {
      const targetUser = Users.find(user => user.email === data.resultOfSearch)
      const indexOfTarget = Users.findIndex(user => user.email === data.resultOfSearch)
      const indexOfSender = Users.findIndex(user => user.email === data.email)

      //check if user exists

      if (!targetUser) {
        Users[indexOfSender].dataChannel.send(
          JSON.stringify({
            action: "searchUser",
            result: "error"
          })
        )
        return
      }

      //create a new room with the information of the sender and target

      Users[indexOfSender].createdRooms = [
        ...Users[indexOfSender].createdRooms, {
          roomId: data.roomId,
          streamId: 0,
          stream: {},
          peer: {},
          roomName: `${Users[indexOfSender].nickName}, ${Users[indexOfTarget].nickName}`,
          emailOfCreator: data.email,
          isVideoConference: false,
          members: [{
            email: data.email,
            nickName: Users[indexOfSender].nickName,
            dataChannel: Users[indexOfSender].dataChannel,
            isLoggedIn: true,
            peer: Users[indexOfSender].peer,
            socket: Users[indexOfSender].socket
          }, {
            email: data.resultOfSearch,
            nickName: Users[indexOfTarget].nickName,
            dataChannel: Users[indexOfTarget].dataChannel != {} ? Users[indexOfTarget].dataChannel : {},
            isLoggedIn: Users[indexOfTarget].isLoggedIn === true ? true : false,
            peer: Users[indexOfTarget].isLoggedIn === true ? Users[indexOfTarget].peer : {},
            socket: Users[indexOfTarget].isLoggedIn === true ? Users[indexOfTarget].socket : ""
          }],
          chat: []
        }
      ]

      //update the rooms of the sender

      const dataOfRoom = {
        roomId: data.roomId,
        emailOfCreator: data.email,
      }

      Users[indexOfSender].rooms = [
        ...Users[indexOfSender].rooms,
        dataOfRoom
      ]

      const IndexOfRoom = Users[indexOfSender].createdRooms.findIndex(user => user.roomId === data.roomId)
      
      //update the rooms of the target so that he gets the messages after his next login  

      if (Users[indexOfSender] != Users[indexOfTarget]) { 
        Users[indexOfTarget].rooms = [
          ...Users[indexOfTarget].rooms, {
            roomName: Users[indexOfSender].nickName,
            roomId: data.roomId,
            emailOfCreator: data.email
          }
        ]
      }

      Users[indexOfSender].dataChannel.send(
        JSON.stringify({
          action: "searchUser",
          members: Users[indexOfSender].createdRooms[IndexOfRoom].members,
          roomName: Users[indexOfTarget].nickName,
          roomId: data.roomId,
          emailOfCreator: data.email,
          chat: []
        })
      )
    }

    //login

    if (data.action === "login") {
     
      const srcUser = Users.find(user => user.email === data.email)
      const indexOfSender = Users.findIndex(user => user.email === data.email)
     
      Users[indexOfSender].dataChannel = dataChannel
     
      if (!srcUser || srcUser.password != data.password) {
       
        Users[indexOfSender].dataChannel.send(JSON.stringify({
          action: "login", res: "error", errorText: "login failed"
        }
        ))
        return
      }

      Users[indexOfSender].isLoggedIn = true
      Users[indexOfSender].socket = data.socketOfSender

      for (let i = 0; i < listOfPeers.length; i++) {   
        if (listOfPeers[i].socketOfSender === data.socketOfSender)
          Users[indexOfSender].peer = listOfPeers[i]
      }

      let updatedRooms = []  //this array contains the rooms which the user already joined

    // update the data in the createdRooms.members Array

      Users[indexOfSender].rooms.forEach(room => {
        const indexOfCreator = Users.findIndex(creator => creator.email == room.emailOfCreator) 

        Users[indexOfCreator].createdRooms.forEach(createdRoom => {  
          const index = createdRoom.members.findIndex(member => member.email === data.email)

          if (index >= 0) {
            createdRoom.members[index].dataChannel = Users[indexOfSender].dataChannel
            createdRoom.members[index].isLoggedIn = true
            createdRoom.members[index].peer = Users[indexOfSender].peer       
            createdRoom.members[index].socket = data.socketOfSender    
            updatedRooms = [...updatedRooms, createdRoom]
          }
        }
        )
      })

      srcUser.rooms = updatedRooms

      const updateListOfPeers = listOfPeers.filter(peer => peer.socketOfSender != data.socketOfSender)   
      listOfPeers = updateListOfPeers

      Users[indexOfSender].dataChannel.send(JSON.stringify(
        {
          action: "login",
          res: "success",
          srcUser
        }
      ))

    }
  }

//consumer//

  socket.on('createPeerForReceivingStreams', async (data) => {

    // creating the remote part of the webRtc connection for 
    // receiver of streams. Find the creator of the videconference 
    // and add the stream to the peer 

    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun1.l.google.com:19302",
        }
      ]
    })
    peer.connectionState;

    const desc = new webrtc.RTCSessionDescription(data.sdp);

    await peer.setRemoteDescription(desc);
    const indexOfCreator = Users.findIndex(user => user.email === data.targetData.emailOfCreator)
   
    Users[indexOfCreator].stream.getTracks().forEach(track => {     //adding the stream to the peer
      peer.addTrack(track, Users[indexOfCreator].stream)
    });

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    
    const payload = {
      sdp: peer.localDescription,
      broadcasterSocket: data.broadcasterSocket,
      targetData: data.targetData
    }
 
    io.to(data.socketOfSender).emit('answerCreatePeerForReceivingStreams', payload)
    dataChannel = peer.createDataChannel('groupchat')
  })
})

server.listen(4000, () => {
  console.log("listen to port 4000")
})