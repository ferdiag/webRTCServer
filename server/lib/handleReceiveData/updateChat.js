module.exports = (data, Users) => {
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
    return Users
}