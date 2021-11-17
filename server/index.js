const express = require("express");
const fs = require("fs");
const app = express();
const webrtc = require("wrtc");
const login = require("./lib/handleReceiveData/login");
const deleteStream = require("./lib/handleReceiveData/delete");
const updateChat = require("./lib/handleReceiveData/updateChat");
const searchUser = require("./lib/handleReceiveData/searchUser");
const addUserToExistingChat = require("./lib/handleReceiveData/addUserToExistingChat");
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
const cors = require("cors");

let Users = require("./FakeUsers"); //list of dummies

app.use(cors());

const createPeer = (data) => {
  const peer = new webrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
  });
  peer.socketOfSender = data.socketOfSender; // to identify the broadcaster in the ontrack method

  return peer;
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

io.on("connection", (socket) => {
  socket.on("createVideoConnection", async (data, callback) => {
    const peer = createPeer(data);

    peer.ontrack = (e) => {
      
      // This function handles the incoming streams.
      // The first step is to identify the creator of the stream,
      // then you assign the stream to the stream key of the creator.
      // The next step is to identy the room of the video conference
      // and send all Users of the room the order to create a new WebRtc Channel for consuming mediaStreams.

      console.log("track received");
      const socketString = peer.socketOfSender.toString();
      const indexOfCreator = Users.findIndex(
        (user) => user.socket === socketString
      );

      if (indexOfCreator >= 0) {
        Users[indexOfCreator].stream = e.streams[0];

        const targetRoom = Users[indexOfCreator].createdRooms.find(
          (room) => room.isVideoConference === true
        );

        if (targetRoom) {
          const filteredTargetRoom = targetRoom.members.filter(
            (member) =>
              member.email != Users[indexOfCreator].email &&
              member.isLoggedIn === true
          );

          filteredTargetRoom.forEach((member) => {
            io.to(`${member.socket}`).emit("invitationforReceivingAStream", {
              emailOfCreator: Users[indexOfCreator].email,
              IdOfTargetRoom: targetRoom.roomId,
              peerID: data.peerID,
            });
          });
        } else {
          console.log("es gibt keine Videokonferenz");
        }
      }
    };

    const desc = new webrtc.RTCSessionDescription(data.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
      sdp: peer.localDescription,
      action: data.action,
    };
    callback(payload);
    const index = Users.findIndex((user) => user.email === data.email);
    Users[index].peer = peer;
  });

  socket.on("createInitialConnection", async (data, callback) => {
    const peer = createPeer(data);

    peer.ondatachannel = (e) => {
      dataChannel = e.channel;
      dataChannel.onmessage = hendleReceiveData;
    };

    const desc = new webrtc.RTCSessionDescription(data.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
      sdp: peer.localDescription,
      action: data.action,
    };
    callback(payload);
  });

  function hendleReceiveData(e) {
    // handles the incoming messages of a datachannel.
    // functions at: //./lib/hendleReceiveData
    // args:
    // @e(object): This object can have various keys but data.action is responsible what happend to the data.

    const data = JSON.parse(e.data);

    if (data.action === "updateChat") {
      const returnOfUpdateChat = updateChat(data, Users);
      Users = returnOfUpdateChat;
    }

    //add user to an existing chat//

    if (data.action === "addUserToExistingChat") {
      const returnAddUserToExistingChat = addUserToExistingChat(data, Users);
      Users = returnAddUserToExistingChat;
    }

    //search a User//

    if (data.action === "searchUser") {
      const returnOfSearchUser = searchUser(data, Users);
      Users = returnOfSearchUser;
    }

    //login

    if (data.action === "login") {
      const returnOfLogin = login(data, Users);
      Users = returnOfLogin;
    }
    if (data.action === "delete") {
      const returnOfDelete = deleteStream(data, Users);
     
    }
    //start videoconference
    if (data.action === "startVideoConference") {
      console.log("started Videoconference");
      const indexOfCreator = Users.findIndex(
        (user) => user.email === data.emailOfCreator
      );
      const indexOfTargetRoom = Users[indexOfCreator].createdRooms.findIndex(
        (room) => room.roomId === data.roomId
      );
      Users[indexOfCreator].createdRooms[
        indexOfTargetRoom
      ].isVideoConference = true;
    }
  }

  //consumer//

  socket.on("createPeerForReceivingStreams", async (data) => {
    // creating the remote part of the webRtc connection for receiver of streams.
    //  Find the creator of the videconference
    // and add the stream to the peer
   
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    });
    peer.connectionState;
    const desc = new webrtc.RTCSessionDescription(data.sdp);

    await peer.setRemoteDescription(desc);
    const indexOfCreator = Users.findIndex(
      (user) => user.email === data.emailOfCreator
    ); 
     
    Users[indexOfCreator].stream.getTracks().forEach((track) => {
      //adding the stream to the peer
      peer.addTrack(track, Users[indexOfCreator].stream);
    });

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    console.log(data.socketOfSender)
    const payload = {
      sdp: peer.localDescription,
      emailOfCreator:data.emailOfCreator,
      peerID:data.peerID
    };
   
    io.to(data.socketOfSender).emit(
      "answerCreatePeerForReceivingStreams",
      payload
    );
    peer.createDataChannel("groupchat");
  });
});

server.listen(4000, () => {
  console.log("listen to port 4000");
});
