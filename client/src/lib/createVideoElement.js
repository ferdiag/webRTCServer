// const createVideoElement = (stream, videoContainerRef, setIsVideoConference, e, arrayOfPeers = [], onDelete) => {
//     //This function creates html elements for the streams and handels the delete button for streams.
//     //componennts:
//     //args:
//     //@stream(object): stream gets injected to the videoElemnt.
//     //@videoContainerRef(object): all the created elemnts will be children of this object. 
//     // event(obj): if the stream is received from a braodcaster, 
//     // its the event of the ontrack event otherwise its an empty object. 
//     //onDelete(obj):The peer of the broadcaster, you will need it because its not in the arrayOfPeers

//     const videoContainer = document.getElementById('videoContainer')
//     const newDiv = document.createElement('div')
//     const videoelement = document.createElement('video')
//     const numberOfChildren = videoContainer.childElementCount

//     newDiv.style.width = '400px';
//     newDiv.style.height = '400px';
//     newDiv.style.border = '1px black solid'

//     videoelement.style.width = '100%';
//     videoelement.style.height = '100%';

//     newDiv.setAttribute('id', 'video' + numberOfChildren)

//     const button = document.createElement('button')
//     button.style.width = '50px';
//     button.style.height = '50px';
//     button.style.offset = '-1';
//     button.innerHTML = "X"

//     button.onclick = (e) => {
//         console.log(arrayOfPeers)
//         // extracts the index from the event and stops the stream,
//         // finds the peer and close the connection
//         // takes the index and removes the element from the dom. 
//         // checks if the videocontainerRef has children, if not,
//         //  setIsVideoConference will change the state of the 
//         // isVideoConference state and the videocontainerRef gets hidden.

//         //args:
//         // e(obj): get the id of the sought element from the pointerevent. 

//         const id = e.path[1].id
//         const indexString = id.slice(5, id.length)
//         const index = parseInt(indexString, 10)

//         const targetstream = videoContainerRef.current.children[index].childNodes[1].srcObject

//         const tracks = targetstream.getTracks();

//         tracks.forEach((track) => {
//             track.stop();
//         });

//         if (e != "localstream") {
//             const targetPeerId = e.currentTarget.id
//             const filteredArray  = arrayOfPeers.filter(peer => peer.id != targetPeerId)
         
//         }
//         const targetEl = document.getElementById(`${id}`)

//         targetEl.remove()

//         videoContainerRef.current.children.length === 0 && setIsVideoConference(false)
       
//     }
//     newDiv.appendChild(button)
//     newDiv.appendChild(videoelement)
//     videoContainer.appendChild(newDiv)
//     videoelement.srcObject = stream;

//     videoelement.play()
  
// }

// export default createVideoElement