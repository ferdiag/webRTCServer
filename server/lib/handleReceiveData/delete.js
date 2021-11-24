module.exports = (data, Users) => {
  //This function handles that all clients know that one client stopped his stream.
 
  console.log("delete");
  const indexOfCreator = Users.findIndex(
    (user) => user.email === data.emailOfCreator
  );

  const indexOfRoom = Users[indexOfCreator].createdRooms.findIndex(
    (room) => room.roomId === data.roomId
  );

  const dataOfMessage = {
    action: "delete",
    streamId: data.streamId,
  };

  const membersWithoutScrUser = Users[indexOfCreator].createdRooms[     
    indexOfRoom
  ].members.filter((member) => member.email != data.email);
  
  membersWithoutScrUser.forEach((member) => {
    if (member.isLoggedIn && member.email != data.email) {
      member.dataChannel.send(JSON.stringify(dataOfMessage));
    }
  });

  return Users;
};
