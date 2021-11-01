module.exports = (data, Users) => {
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

    //update members of the room rooms at the creator

    Users[indexOfCreator].createdRooms[indexOfTargetRoom].members = [
        ...Users[indexOfCreator].createdRooms[indexOfTargetRoom].members, {
            email: data.resultOfSearch,
            nickName: Users[indexOfTarget].nickName,
            dataChannel: Users[indexOfTarget].dataChannel != {} ? Users[indexOfTarget].dataChannel : {},
            isLoggedIn: Users[indexOfTarget].isLoggedIn === true ? true : false,
            socket: Users[indexOfTarget].socket,
            peer:Users[indexOfTarget].peer
        }]

    //update roomlist of searched user.

    Users[indexOfTarget].rooms = [
        ...Users[indexOfTarget].rooms, {
            roomName: Users[indexOfTarget].nickName,
            roomId: data.roomId,
            emailOfCreator: Users[indexOfCreator].email,
        }]

    //send the data back to the user 

    Users[indexOfSender].dataChannel.send(
        JSON.stringify({
            nickName: Users[indexOfTarget].nickName,
            email: Users[indexOfTarget].email,
            isLoggedIn: Users[indexOfTarget].isLoggedIn,
            roomId: data.roomId,
            emailOfCreator: data.email,
            action: "addUserToExistingChat",
        })
    )
    return Users
}