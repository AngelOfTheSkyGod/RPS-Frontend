import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
let images = {
  rock: <Icon icon="fa-regular:hand-rock" width="70%" />,
  paper: <Icon icon="fa-regular:hand-paper" width="70%" />,
  scissors: <Icon icon="fa6-regular:hand-scissors" width="70%" />,
  "": <Icon icon="ic:round-hourglass-empty" width="70%" />,
};
export default function GameScreen(props) {
  const [madeChoice, setMadeChoice] = useState(false);
  const [state, setState] = useState(false);
  let stateRef = useRef(state);
  let choiceRef = useRef(madeChoice);
  useEffect(() => {
    countdown();
  }, []);
  function countdown() {
    console.log(
      "name: ",
      props.name,
      "player 1 move: ",
      props.RPSDInfoRef.current.player1Info.move,
      "player 2 move:",
      props.RPSDInfoRef.current.player2Info.move
    );
    if (
      props.time.current <= 0 ||
      (((props.RPSDInfoRef.current.player1Info.name === props.name &&
        props.RPSDInfoRef.current.player1Info.move !== "") ||
        (props.RPSDInfoRef.current.player2Info.name === props.name &&
          props.RPSDInfoRef.current.player2Info.move !== "")) &&
        !choiceRef.current)
    ) {
      console.log("sending player move: ", props.name);
      setMadeChoice(true);
      choiceRef.current = true;
      props.stompClient.send(
        "/app/private-move",
        {},
        JSON.stringify(props.RPSDInfoRef.current)
      );
    }
    setTimeout(() => {
      if (props.RPSDInfoRef.current.roundWinner !== "") {
        console.log("counting down!", props.time.current);
        stateRef = !stateRef;
        setState(!stateRef);
        setMadeChoice(false);
        choiceRef.current = false;
        props.time.current -= 1;
        countdown();
      }
    }, 1000);
  }
  function makeChoice(choosing) {
    props.RPSDInfoRef.current =
      props.RPSDInfoRef.current.player1Info.name === props.name
        ? {
            ...props.RPSDInfoRef.current,
            player1Info: {
              ...props.RPSDInfoRef.current.player1Info,
              move: choosing,
            },
          }
        : {
            ...props.RPSDInfoRef.current,
            player2Info: {
              ...props.RPSDInfoRef.current.player2Info,
              move: choosing,
            },
          };
    props.setRPSDInfo(props.RPSDInfoRef.current);
  }
  let self =
    props.RPSDInfoRef.current.player1Info.name === props.name
      ? props.RPSDInfoRef.current.player1Info
      : props.RPSDInfoRef.current.player2Info;
  if (props.RPSDInfoRef.current.roundWinner !== "") {
    setTimeout(() => {
      props.RPSDInfoRef.current = {
        ...props.RPSDInfoRef.current,
        player1Info: {
          ...props.RPSDInfoRef.current.player1Info,
          move: "",
          receivedMove: false,
        },
        player2Info: {
          ...props.RPSDInfoRef.current.player2Info,
          move: "",
          receivedMove: false,
        },
        roundWinner: "",
      };
      props.setRPSDInfo(props.RPSDInfoRef.current);
      stateRef = !stateRef;
      props.time.current = 10;
      setState(stateRef);
      countdown();
    }, 3000);
  }
  return (
    <div className="lobby-background">
      {props.RPSDInfoRef.current.roundWinner !== "" ? (
        <div>
          <h1 className="name-prompt-text">
            The round winner is : {props.RPSDInfoRef.current.roundWinner} !
          </h1>
        </div>
      ) : (
        <div className="display-background">
          <h1 className="timer-text">
            {props.time.current > 0
              ? `Time remaining: ${props.time.current} seconds`
              : `Waiting for timers to sync up.`}
          </h1>
          <div className="player-display">
            <div className="player-window">
              <h1 className="player-score-text">
                Score: {props.RPSDInfoRef.current.player1Info.score}
              </h1>
              <div className="player-choice-window">
                {images[props.RPSDInfoRef.current.player1Info.move]}
              </div>
              <h1 className="player-name-text">
                {props.RPSDInfoRef.current.player1Info.name} chose{" "}
              </h1>
            </div>
            <div className="player-window">
              <h1 className="player-score-text">
                {" "}
                Score: {props.RPSDInfoRef.current.player2Info.score}
              </h1>
              <div className="player-choice-window">
                {images[props.RPSDInfoRef.current.player2Info.move]}
              </div>
              <h1 className="player-name-text">
                {props.RPSDInfoRef.current.player2Info.name} chose{" "}
              </h1>
            </div>
          </div>
          {/* <h1 className="turn-text">
            Turn {props.RPSDInfoRef.current.numTurns + 1}
          </h1> */}

          <div className="choice-window">
            <button className="choice-button">
              <Icon
                icon="fa-regular:hand-rock"
                onClick={() => makeChoice("rock")}
                width="80%"
                style={self.move === "rock" ? { color: "black" } : {}}
              />
            </button>
            <button className="choice-button">
              <Icon
                icon="fa-regular:hand-paper"
                onClick={() => makeChoice("paper")}
                width="80%"
                style={self.move === "paper" ? { color: "black" } : {}}
              />
            </button>
            <button className="choice-button">
              <Icon
                icon="fa6-regular:hand-scissors"
                onClick={() => makeChoice("scissors")}
                width="80%"
                style={self.move === "scissors" ? { color: "black" } : {}}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
