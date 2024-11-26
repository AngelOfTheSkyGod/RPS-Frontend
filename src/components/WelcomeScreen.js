import React, { useState } from "react";
var Filter = require("bad-words"),
  filter = new Filter();

export default function WelcomeScreen(props) {
  const [name, setName] = useState("");
  function handleName(event) {
    let { value } = event.target;
    console.log("Type of: " + value + typeof value);

    if (value.length > 20) {
      return;
    }
    setName(value);
  }
  function sendName() {
    if (filter.isProfane(name)) {
      setName("");
      return;
    }
    console.log("MAP ITEMS: " + [...props.playersStatus.entries()]);
    if (props.playersStatus.get(name) || name === "" || name === " ") {
      return;
    }
    console.log("pressed submit. name is: " + name);

    props.stompClient.subscribe(
      "/user/" + name + "/private",
      props.onPrivateRequestReceived
    );
    props.stompClient.subscribe(
      "/user/" + name + "/challenged",
      props.onChallengedPlayer
    );

    props.stompClient.subscribe(
      "/user/" + name + "/cancelledChallenge",
      props.cancelledChallenge
    );
    props.stompClient.subscribe(
      "/user/" + name + "/declinedChallenge",
      props.declinedChallenge
    );
    props.stompClient.subscribe(
      "/user/" + name + "/acceptedChallenge",
      props.acceptedChallenge
    );
    props.stompClient.subscribe(
      "/user/" + name + "/sendWager",
      props.receiveWager
    );
    props.stompClient.subscribe(
      "/user/" + name + "/startGame",
      props.startGame
    );
    props.stompClient.subscribe(
      "/user/" + name + "/sendMove",
      props.receiveMove
    );

    props.stompClient.subscribe("/user/" + name + "/ping", props.handlePing);
    props.stompClient.subscribe("/requests/leaver", props.playerHasLeft);

    let newRPSDInfo = {
      ...props.RPSDInfo,
      name: name,
      state: "lobbyscr",
      connected: true,
    };

    props.setName(name);
    props.setState("lobbyscr");
    props.stompClient.send(
      "/app/global",
      {},
      JSON.stringify({ ...newRPSDInfo })
    );

    props.stompClient.send(
      "/app/private-updatePlayers",
      {},
      JSON.stringify(newRPSDInfo)
    );
    props.setRPSDInfo(newRPSDInfo);
    props.RPSDInfoRef.current = newRPSDInfo;
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
          value={name}
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
