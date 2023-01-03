import React, { useEffect, useState } from "react";

export default function WelcomeScreen(props) {
  function handleName(event) {
    const { value } = event.target;
    props.setName(value);
  }
  function sendName() {
    if (props.stompClient) {
      props.RPSDInfo.name = props.name;
      props.RPSDInfo.state = "lobbyscr";
      props.SetRPSDInfo({ ...props.RPSDInfo });
    }
  }
  return (
    <div className="welcome-screen-background">
      <div className="welcome-screen-outer-background">
        <h1 className="rpsd-text">Rock-Paper-Scissors Decider!</h1>
        <h1 className="name-prompt-text">Enter Your Name</h1>
        <input
          type="text"
          className="input-name"
          placeholder="enter the name."
          value={props.name}
          onChange={handleName}
        />
        <button
          type="button"
          placeholder="hello"
          className="name-button"
          onClick={sendName}
        >
          {" "}
          Submit{" "}
        </button>
      </div>
    </div>
  );
}
