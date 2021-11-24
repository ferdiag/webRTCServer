import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

function InvitationAlarm() {
//This conponent just get shown if another client want to show you his videostream.
//handles what happend if the user accept of decline the offer.

  const {
    handleConfirmVideoConference,
    setIsInvitationForReceivingAStream,
    isInvitationForReceivingAStream,
  } = useContext(AppContext);

  const handleClickYes = (e) => {
    e.preventDefault();
    handleConfirmVideoConference()
    setIsInvitationForReceivingAStream(false);
  };
  const handleClickNo =e=>{
    e.preventDefault()
    setIsInvitationForReceivingAStream(false)
  }
  return (
    <div
      style={
        isInvitationForReceivingAStream === false
          ? { display: "none" }
          : { border: "black 1px solid" }
      }
    >
      <p style={{fontSize:"10px"}}>Möchten Sie einer Videokonferenz beitreten</p>
      <button onClick={handleClickYes}>ja</button>
      <button onClick={handleClickNo}>nein</button>
    </div>
  );
}

export default InvitationAlarm;
