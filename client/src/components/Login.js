import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { socket } from "../services";
import { handleChange } from "../lib/handleChange";

const Login = () => {
  const [inputData, setInputData] = useState({ email: "", password: "" });
  const { handleInitialConnection } = useContext(AppContext);

  const handleClick = (e) => {
    e.preventDefault();
    handleInitialConnection(inputData);
  };

  return (
    <div>
      <input
        onChange={(e) => handleChange(e, setInputData)}
        value={inputData.email}
        name="email"
        placeholder="your email"
        type="email"
      />
      <input
        onChange={(e) => handleChange(e, setInputData)}
        value={inputData.password}
        name="password"
        placeholder="password"
        type="text"
      />
      <button onClick={handleClick}>Login</button>
    </div>
  );
};

export default Login;
