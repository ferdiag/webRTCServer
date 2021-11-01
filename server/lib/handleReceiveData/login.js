module.exports = (data,Users,listOfPeers)=>{
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

    // update the data in the createdRooms.members array

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
      return Users
}
      