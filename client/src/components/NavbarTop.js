import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import Login from "./Login";
import { Searchbar } from "./Searchbar";

const NavbarTop = () => {
  //parent:App.js
  const { isLoggedIn } = useContext(AppContext);

  return (
    <div>
      <Searchbar />
      {!isLoggedIn && <Login />}
    </div>
  );
};

export default NavbarTop;
