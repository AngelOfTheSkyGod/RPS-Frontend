import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
var Filter = require("bad-words"),
  filter = new Filter();

export default function WagerScreen(props) {
  const [choice, setChoice] = useState("");
  const [wager, setWager] = useState(false);
  function handleChoice(event) {
    let { value } = event.target;
    console.log("Type of: " + value + typeof value);
    if (filter.isProfane(value)) {
      value = "";
    }
    if (value.length > 60) {
      return;
    }
    setChoice(value);
  }

  function sendChoice() {
    if (choice.length <= 1) {
      return;
    }
    let newRPSDInfo =
      props.RPSDInfoRef.current.player1Info.name === props.name
        ? {
            ...props.RPSDInfoRef.current,
            player1Info: {
              ...props.RPSDInfoRef.current.player1Info,
              decision: choice,
            },
          }
        : {
            ...props.RPSDInfoRef.current,
            player2Info: {
              ...props.RPSDInfoRef.current.player2Info,
              decision: choice,
            },
          };
    setWager(true);
    props.setRPSDInfo(newRPSDInfo);
    props.RPSDInfoRef.current = { ...newRPSDInfo };
    props.stompClient.send("/app/sendWager", {}, JSON.stringify(newRPSDInfo));
  }
  let opponent =
    props.RPSDInfoRef.current.player1Info.name === props.name
      ? props.RPSDInfoRef.current.player2Info.name
      : props.RPSDInfoRef.current.player1Info.name;
  return (
    <div>
      {!wager ? (
        <div className="lobby-background">
          <h1 className="rpsd-text">Rock-Paper-Scissors Decider!</h1>
          <h1 className="name-prompt-text">
            {" "}
            Please enter your choice below.{" "}
          </h1>{" "}
          <input
            type="text"
            className="input-choice"
            placeholder="enter your choice."
            value={choice}
            onChange={handleChoice}
          />
          <button
            type="button"
            placeholder="hello"
            className="name-button"
            onClick={sendChoice}
          >
            {" "}
            Submit{" "}
          </button>
        </div>
      ) : (
        <div className="lobby-background">
          <h1 className="name-prompt-text">
            {" "}
            Waiting on {opponent} to choose a decision.{" "}
          </h1>
        </div>
      )}
    </div>
  );
}
