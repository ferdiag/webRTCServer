module.exports=(data,Users)=>{
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

    //creates a new room with the information of the sender and target

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

    //updates the rooms of the sender

    const dataOfRoom = {
      roomId: data.roomId,
      emailOfCreator: data.email,
    }

    Users[indexOfSender].rooms = [
      ...Users[indexOfSender].rooms,
      dataOfRoom
    ]

    const IndexOfRoom = Users[indexOfSender].createdRooms.findIndex(user => user.roomId === data.roomId)
    
    //updates the rooms of the target so that he gets the messages after his next login  

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
    return Users
}