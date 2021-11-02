const createVideoElement = (stream, videoContainerRef, event, arrayOfPeers = []) => {
    //this function creates html elements and handels the stop of an array
    console.log(arrayOfPeers)
    const videoContainer = document.getElementById('videoContainer')
    const newDiv = document.createElement('div')
    const videoelement = document.createElement('video')
    const numberOfChildren = videoContainer.childElementCount

    videoelement.style.width = '400px';
    videoelement.style.height = '400px';
    if (event) {
        newDiv.setAttribute('peerId', event.srcElement.id)
    } else {
        newDiv.setAttribute('peerId', "Iam the creator")
    }
    videoelement.style.border = '1px black solid'
    newDiv.setAttribute('id', 'video' + numberOfChildren)
    const button = document.createElement('button')
    button.style.width = '50px';
    button.style.height = '50px';
    button.innerHTML = "X"

    button.onclick = (e => {
        console.log(e)
        // extract the index from the event and stop the stream,
        // find the peer and close the connection

        //args:
        // e(object): html object

        const rawId = e.path[1].id
        const indexString = rawId.slice(5, rawId.length)
        const index = parseInt(indexString, 10)

        const targetstream = videoContainerRef.current.children[index].childNodes[1].srcObject


        const tracks = targetstream.getTracks();

        tracks.forEach((track) => {
            track.stop();
        });

        const targetPeerId = event.currentTarget.id
        const targetPeer = arrayOfPeers.find(peer => peer.id === targetPeerId)
        targetPeer.close()
    })
    newDiv.appendChild(button)
    newDiv.appendChild(videoelement)
    videoContainer.appendChild(newDiv)
    videoelement.srcObject = stream;

    videoelement.play()
}
export default createVideoElement