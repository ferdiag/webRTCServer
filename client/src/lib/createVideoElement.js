const createVideoElement =(stream)=>{
    const videoContainer = document.getElementById('videoContainer')
    const newDiv = document.createElement('div')
    const videoelement = document.createElement('video')
    const numberOfChildren = videoContainer.childElementCount

    videoelement.style.width = '400px';
    videoelement.style.height = '400px';

    videoelement.style.border = '1px black solid'
    newDiv.setAttribute('id', 'video' + numberOfChildren)
    const button = document.createElement('button')
    button.style.width = '50px';
    button.style.height = '50px';
    button.innerHTML="X"
    
    button.onclick=(()=>{
     
    })
    newDiv.appendChild(button)
    newDiv.appendChild(videoelement)
    videoContainer.appendChild(newDiv)
    videoelement.srcObject = stream;
    
    videoelement.play()
}
export default createVideoElement