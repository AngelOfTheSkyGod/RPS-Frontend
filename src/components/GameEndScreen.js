import React, { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";

export default function GameEndScreen(props) {
  let winningStr =
    props.RPSDInfoRef.current.winner ===
    props.RPSDInfoRef.current.player1Info.name
      ? props.RPSDInfoRef.current.player1Info.decision
      : props.RPSDInfoRef.current.player2Info.decision;

  if (props.RPSDInfoRef.current.winner === "no one") {
    winningStr = "No one won, choosing random choice: \n" + props.RPSDInfoRef.current.roundWinner;
  }
  function resetGame() {
    let newRPSDInfo = {
      ...props.RPSDInfoRef.current,
      state: "lobbyscr",
      receiver: "",
      sender: "",
      challenging: false,
      challenged: false,
      acceptChallenge: false,
      numTurns: 0,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: "",
        receivedMove: false,
      },
      player2Info: {
        decision: "",
        move: "",
        score: 0,
        name: "",
        receivedMove: false,
      },
      roundWinner: "",
      winner: "",
    };
    props.time.current = 10;
    props.setRPSDInfo({ ...newRPSDInfo });
    props.RPSDInfoRef.current = { ...newRPSDInfo };
    props.setState("lobbyscr");
  }
  return (
    <div className="lobby-background">
      <h1 className="name-prompt-text">
        The winner is {props.RPSDInfoRef.current.winner}!!!
      </h1>
      <h1 className="name-prompt-text">
        Therefore, the winning choice is {winningStr}.
      </h1>
      <button
        type="button"
        placeholder="hello"
        className="name-button"
        onClick={resetGame}
      >
        {" "}
        Lobby{" "}
      </button>
      
    </div>
  );
}
