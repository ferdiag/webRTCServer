import react, { useContext } from "react";
import "./App.css";

import Main from "./components/Main";
import NavbarTop from "./components/NavbarTop";
import Sidebar from "./components/Sidebar";
import VideoContainer from "./components/VideoContainer";
import { AppContext } from "./context/AppContext";

function App() {
  const { isVideoConference } = useContext(AppContext);

  return (
    <div className="App">
      <NavbarTop />
      <VideoContainer />
      <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
        <Sidebar />
        <Main />
      </div>
    </div>
  );
}

export default App;
