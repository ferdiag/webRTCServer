function handleChange(event,setState) {

    // This function handles the onChange methods of inputs.
    // You can even use it on multiple inputs, it takes the names and values and creates an object.
    // This object will be the new state which will be changed by the setState function.
    // args:
    //  @event(object): getting the key and values for creating the object
    //  @setState(function): This function will change a state     
    
    const { name, value } = event.target;
    
    setState(prevVal => ({
        ...prevVal, [name]: value
    }
    ))
}

export {handleChange}