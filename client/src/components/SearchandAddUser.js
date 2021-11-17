import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

import { handleChange } from "../lib/handleChange";
import { socket } from "../services";

const SearchAndAddUserToAnExistingRoom = () => {
  //parent:Room.js

  const { indexOfActiveRoom, roomsRef, dataChannelForData, nickName, email } =
    useContext(AppContext);
  const initValAddUser = { searchInput: "" };
  const [inputDataAdduser, setInputDataAddUser] = useState(initValAddUser);

  function handleAddUser(e) {
    e.preventDefault();

    if (inputDataAdduser.searchInput.length > 0) {
      if (dataChannelForData.current.readyState === "open") {
        dataChannelForData.current.send(
          JSON.stringify({
            resultOfSearch: inputDataAdduser.searchInput,
            sender: socket.id,
            nickName: nickName,
            roomId: roomsRef.current[indexOfActiveRoom].roomId,
            emailOfCreator: roomsRef.current[indexOfActiveRoom].emailOfCreator,
            roomName: inputDataAdduser.searchInput,
            emailOfSender: email,
            action: "addUserToExistingChat",
          })
        );
      }
    } else {
      console.log("machen Sie eine Eingabe");
    }
  }

  return (
    <div>
      <input
        value={inputDataAdduser.searchInput}
        name="searchInput"
        onChange={(e) => handleChange(e, setInputDataAddUser)}
      ></input>
      <button onClick={handleAddUser}>User hinzufügen</button>
    </div>
  );
};

export default SearchAndAddUserToAnExistingRoom;
