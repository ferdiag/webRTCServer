module.exports = (data,Users,listOfPeers)=>{
    const srcUser = Users.find(user => user.email === data.email)
      const indexOfSender = Users.findIndex(user => user.email === data.email)
     
      return Users
}
      