import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export default function LobbyScreen(props) {
  const [boxState, setBoxState] = useState("player-list");
  const [challengedPlayer, setChallengedPlayer] = useState("");
  const [sentChallenge, setSentChallenge] = useState(false);

  console.log(
    "challenging: " +
      props.RPSDInfoRef.current.challenging +
      "challenged: " +
      props.RPSDInfoRef.current.challenged +
      " player1Name: " +
      props.RPSDInfoRef.current.player1Info.name +
      " boxState: " +
      boxState +
      " name: "
  );
  function loadLobbyStates() {
    if (props.RPSDInfoRef.current.challenged && boxState === "player-list") {
      setBoxState("challenged-screen");
      console.log("challenged.");
    } else if (
      !props.RPSDInfoRef.current.challenged &&
      props.RPSDInfoRef.current.player1Info.name !== "" &&
      boxState !== "player-list" &&
      props.name !== props.RPSDInfoRef.current.player1Info.name
    ) {
      console.log("CANCELLED REQUEST!");
      setBoxState("player-list");
      props.setRPSDInfo({
        ...props.RPSDInfoRef.current,
        player1Info: {
          decision: "",
          move: "",
          score: 0,
          name: "",
        },
      });
      props.RPSDInfoRef.current = {
        ...props.RPSDInfoRef.current,
        player1Info: {
          decision: "",
          move: "",
          score: 0,
          name: "",
        },
      };
    } else if (
      !props.RPSDInfoRef.current.challenged &&
      !props.RPSDInfoRef.current.challenging &&
      props.RPSDInfoRef.current.player1Info.name === "" &&
      boxState !== "player-list"
    ) {
      cancelRequest();
    }
  }

  loadLobbyStates();
  function challengePlayer(player) {
    if (player !== props.name && props.playersStatus.get(player)) {
      setBoxState("challenging-screen");
      setChallengedPlayer(player);
      props.setRPSDInfo({ ...props.RPSDInfoRef.current, challenging: true });
      props.RPSDInfoRef.current = {
        ...props.RPSDInfoRef.current,
        challenging: true,
      };
      console.log(
        "challenging: " +
          player +
          "variable: " +
          props.RPSDInfoRef.current.challenging
      );
    }
  }

  function sendChallengeRequest() {
    let newInfo = {
      ...props.RPSDInfoRef.current,
      sender: props.name,
      challenging: true,
      receiver: challengedPlayer,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: props.name,
      },
    };
    setSentChallenge(true);

    props.stompClient.send("/app/challengePlayer", {}, JSON.stringify(newInfo));
    props.setRPSDInfo({
      ...props.RPSDInfoRef.current,
      sender: props.name,
      challenging: true,
      receiver: challengedPlayer,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: props.name,
      },
    });
    props.RPSDInfoRef.current = {
      ...props.RPSDInfoRef.current,
      sender: props.name,
      challenging: true,
      receiver: challengedPlayer,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: props.name,
      },
    };
  }

  function cancelRequest() {
    setChallengedPlayer("");
    setBoxState("player-list");
    props.setRPSDInfo({ ...props.RPSDInfoRef.current, challenging: false });
    setSentChallenge(false);
    props.RPSDInfoRef.current = {
      ...props.RPSDInfoRef.current,
      challenging: false,
    };
    console.log("cancelled request.");
  }

  function cancelSentRequest() {
    setChallengedPlayer("");
    setBoxState("player-list");
    props.setRPSDInfo({ ...props.RPSDInfoRef.current, challenging: false });
    setSentChallenge(false);
    props.RPSDInfoRef.current = {
      ...props.RPSDInfoRef.current,
      challenging: false,
    };
    props.stompClient.send(
      "/app/cancelChallengePlayer",
      {},
      JSON.stringify({ ...props.RPSDInfoRef.current })
    );
  }

  function declineRequest() {
    let newRPSDInfo = {
      ...props.RPSDInfoRef.current,
      challenged: false,
      challenging: false,
      sender: props.name,
      receiver: props.RPSDInfoRef.current.player1Info.name,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: "",
      },
    };
    props.setRPSDInfo({ ...newRPSDInfo });
    props.RPSDInfoRef.current = { ...newRPSDInfo };
    props.stompClient.send(
      "/app/declineChallenge",
      {},
      JSON.stringify({ ...newRPSDInfo })
    );
  }

  function acceptRequest() {
    let newRPSDInfo = {
      ...props.RPSDInfoRef.current,
      sender: props.name,
      receiver: props.RPSDInfoRef.current.player1Info.name,
      receivedMove: true,
      state: "wagerscr",
      player2Info: {
        decision: "",
        move: "",
        score: 0,
        name: props.name,
      },
    };
    props.setRPSDInfo({ ...newRPSDInfo });
    props.RPSDInfoRef.current = { ...newRPSDInfo };
    props.stompClient.send(
      "/app/acceptChallenge",
      {},
      JSON.stringify({ ...newRPSDInfo })
    );
    props.setState("wagerscr");
  }

  let cards = props.playerList.map((name) => {
    console.log(
      "item: " + name + "exists in map: " + props.playersStatus.get(name)
    );
    return (
      <li className="player-list-item">
        <button
          className="player-list-bar"
          onClick={() => challengePlayer(name)}
        >
          {/* {(props.playersStatus.get(name) && (
            <Icon
              className="player-list-status"
              icon="carbon:checkmark-filled"
              color="#2dc937"
              width="2rem"
            />
          )) ||
            (!props.playersStatus.get(name) && (
              <Icon
                className="player-list-status"
                icon="fa6-solid:circle-xmark"
                color="#cc3232"
                width="2rem"
              />
            ))} */}
          <h1 className="player-list-text">{name}</h1>
        </button>
      </li>
    );
  });

  let challengeDisplayString = !sentChallenge
    ? `Challenge ${challengedPlayer}?`
    : `Waiting on ${challengedPlayer} to respond.`;
  return (
    <div className="lobby-background">
      <h1 className="rpsd-text">Rock-Paper-Scissors Decider!</h1>

      <h1 className="name-prompt-text">{` ${props.name}'s `} Lobby </h1>
      {(boxState === "player-list" && (
        <div className="player-list-background">
          <ul className="tags-background">{cards}</ul>
        </div>
      )) ||
        (boxState === "challenged-screen" && (
          <div className="challenge-background">
            <h1 className="name-prompt-text">
              {" "}
              Accept challenge from {props.RPSDInfoRef.current.player1Info.name}
              ?
            </h1>
            <div className="challenge-decision-holder">
              <button
                className="challenge-button-accept"
                onClick={acceptRequest}
              >
                <Icon
                  icon="carbon:checkmark-filled"
                  color="green"
                  width="5rem"
                />
              </button>
              <button
                className="challenge-button-decline"
                onClick={declineRequest}
              >
                <Icon icon="mdi:alpha-x-circle" color="red" width="5rem" />
              </button>
            </div>
          </div>
        )) ||
        (boxState === "challenging-screen" && (
          <div className="challenge-background">
            <h1 className="name-prompt-text">{challengeDisplayString}</h1>
            {!sentChallenge ? (
              <div className="challenge-decision-holder">
                <button
                  className="challenge-button-accept"
                  onClick={sendChallengeRequest}
                >
                  <Icon
                    icon="carbon:checkmark-filled"
                    color="green"
                    width="5rem"
                  />
                </button>
                <button
                  className="challenge-button-decline"
                  onClick={cancelRequest}
                >
                  <Icon icon="mdi:alpha-x-circle" color="red" width="5rem" />
                </button>
              </div>
            ) : (
              <div className="challenge-decision-holder">
                <button
                  className="challenge-button-decline"
                  onClick={cancelSentRequest}
                >
                  <Icon icon="mdi:alpha-x-circle" color="red" width="5rem" />
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
