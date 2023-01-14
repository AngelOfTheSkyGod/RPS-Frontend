import React, { useEffect, useState, useRef } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import WelcomeScreen from "./components/WelcomeScreen";
import LobbyScreen from "./components/LobbyScreen";
import WagerScreen from "./components/WagerScreen";
import GameScreen from "./components/GameScreen";
import GameEndScreen from "./components/GameEndScreen";
var stompClient = null;
let connected = false;

function App() {
  const [RPSDInfo, setRPSDInfo] = useState({
    name: "",
    state: "",
    connected: false,
    receiver: "",
    sender: "",
    challenging: false,
    challenged: false,
    players: [],
    acceptChallenge: false,
    numTurns: 0,
    player1Info: {
      decision: "",
      move: "",
      score: 0,
      name: "",
    },
    player2Info: {
      decision: "",
      move: "",
      score: 0,
      name: "",
    },
    roundWinner: "",
    winner: "",
  });
  const time = useRef(10);

  const RPSDInfoRef = useRef(RPSDInfo);

  const [name, setName] = useState("");
  const [state, setState] = useState("connectingscr");
  let [playerList, setPlayerList] = useState([]);
  let [playersStatus, setPlayersStatus] = useState(new Map());
  const onError = (err) => {
    console.log(err);
  };

  function updatePlayers(payload) {
    let payloadData = JSON.parse(payload.body);
    let playersString = JSON.stringify(payloadData.players);
    // let plyrs = playersString.split(",");
    let newPlayerList = payloadData.players;
    let newPlayersStatus = new Map(playersStatus);

    newPlayerList.forEach((item, index) => {
      if (!newPlayersStatus.has(item)) {
        newPlayersStatus.set(item, true);
      }
    });
    playersStatus = newPlayersStatus;
    setRPSDInfo({ ...RPSDInfoRef.current, players: [...newPlayerList] });
    RPSDInfoRef.current = {
      ...RPSDInfoRef.current,
      players: [...newPlayerList],
    };
    console.log("updating playerlist: " + newPlayerList);
    setPlayerList([...newPlayerList]);
    setPlayersStatus(newPlayersStatus);
  }

  function onGlobalRequestReceived(payload) {
    let payloadData = JSON.parse(payload.body);
    console.log(
      "joined! fetching players." +
        "obj: " +
        JSON.stringify(RPSDInfoRef.current)
    );
    if (!RPSDInfoRef.current.connected) {
      updatePlayers(payload);
      console.log("fetching lobby on join.");
      return;
    }
    if (!playersStatus.has(payloadData.name) && payloadData.connected) {
      updatePlayers(payload);
    } else if (playersStatus.has(payloadData.name) && !payloadData.connected) {
      playerList.splice(playerList.indexOf(payloadData.name), 1);
      playersStatus.delete(payloadData.name);
      setPlayerList(...playerList);
      setPlayersStatus(new Map(playersStatus));
      console.log("removed player: " + payloadData.name);
    } else if (
      (playersStatus.has(payloadData.name) &&
        payloadData.challenged &&
        payloadData.connected) ||
      payloadData.challenging
    ) {
      console.log("this player has been challenged: " + payloadData.name);
      playersStatus.set(payloadData.name, false);
      setPlayersStatus(new Map(playersStatus));
    }
  }

  function cancelledChallenge(payload) {
    let payloadData = JSON.parse(payload.body);
    console.log("cancelled challenge request.");
    setRPSDInfo({
      ...RPSDInfoRef.current,
      challenged: false,
      challenging: false,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: payloadData.sender,
      },
    });
    RPSDInfoRef.current = {
      ...RPSDInfoRef.current,
      challenged: false,
      challenging: false,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: payloadData.sender,
      },
    };
  }

  function declinedChallenge(payload) {
    console.log("Declined challenge.");
    setRPSDInfo({
      ...RPSDInfoRef.current,
      challenged: false,
      challenging: false,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: "",
      },
    });
    RPSDInfoRef.current = {
      ...RPSDInfoRef.current,
      challenged: false,
      challenging: false,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: "",
      },
    };
  }

  function acceptedChallenge(payload) {
    let payloadData = JSON.parse(payload.body);
    let newRPSDInfo = {
      ...RPSDInfoRef.current,
      state: "wagerscr",
      receivedMove: payloadData.receivedMove,
      player2Info: {
        ...payloadData.player2Info,
      },
    };
    setRPSDInfo(newRPSDInfo);
    RPSDInfoRef.current = newRPSDInfo;
    setState("wagerscr");
  }

  function receiveWager(payload) {
    let payloadData = JSON.parse(payload.body);
    console.log(
      "is player1? " + payloadData.player1Info.name !== name,
      "player2Info: " + JSON.stringify(payloadData.player2Info),
      "payload player1 name: " + payloadData.player1Info.name,
      "name: " + RPSDInfoRef.current.name
    );
    let opponent =
      payloadData.player1Info.name !== RPSDInfoRef.current.name
        ? payloadData.player1Info.name
        : payloadData.player2Info.name;
    let newRPSDInfo =
      payloadData.player1Info.name !== RPSDInfoRef.current.name
        ? {
            ...RPSDInfoRef.current,
            player1Info: {
              ...payloadData.player1Info,
            },
          }
        : {
            ...RPSDInfoRef.current,
            player2Info: {
              ...payloadData.player2Info,
            },
          };
    setRPSDInfo(newRPSDInfo);
    RPSDInfoRef.current = { ...newRPSDInfo };
    stompClient.send(
      "/app/startGame",
      {},
      JSON.stringify({
        ...newRPSDInfo,
        sender: RPSDInfoRef.name,
        receiver: opponent,
      })
    );
  }

  function startGame(payload) {
    let newRPSDInfo = {
      ...RPSDInfoRef.current,
      state: "gamescr",
    };
    RPSDInfoRef.current = newRPSDInfo;
    setRPSDInfo(newRPSDInfo);
    setState("gamescr");
  }

  function onChallengedPlayer(payload) {
    let payloadData = JSON.parse(payload.body);
    console.log(
      "challenged: " +
        RPSDInfoRef.current.challenged +
        " challenging: " +
        RPSDInfoRef.current.challenging
    );
    if (
      RPSDInfoRef.current.challenged ||
      RPSDInfoRef.current.challenging ||
      RPSDInfoRef.current.acceptChallenge
    ) {
      console.log(
        "player was already in a challenge: " +
          name +
          " sending back to: " +
          payloadData.sender
      );
      let newRPSDInfo = {
        ...RPSDInfoRef.current,
        sender: name,
        receiver: payloadData.sender,
      };
      stompClient.send(
        "/app/declineChallenge",
        {},
        JSON.stringify({ ...newRPSDInfo })
      );
      return;
    }
    console.log("received challenge from: " + payloadData.sender);
    setRPSDInfo({
      ...RPSDInfoRef.current,
      challenged: true,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: payloadData.sender,
      },
    });
    RPSDInfoRef.current = {
      ...RPSDInfoRef.current,
      challenged: true,
      player1Info: {
        decision: "",
        move: "",
        score: 0,
        name: payloadData.sender,
      },
    };
    console.log(
      "received challenge from: " +
        RPSDInfoRef.current.player1Info.name +
        "challenged: " +
        name
    );
  }
  function onPrivateRequestReceived(payload) {}

  function receiveMove(payload) {
    let payloadData = JSON.parse(payload.body);

    let newRPSDInfo =
      payloadData.player1Info.name !== RPSDInfoRef.current.name
        ? {
            ...RPSDInfoRef.current,
            roundWinner: payloadData.roundWinner,
            winner: payloadData.winner,
            numTurns: payloadData.numTurns,
            player1Info: {
              ...payloadData.player1Info,
            },
            player2Info: {
              ...RPSDInfoRef.current.player2Info,
              score: payloadData.player2Info.score,
            },
          }
        : {
            ...RPSDInfoRef.current,
            roundWinner: payloadData.roundWinner,
            winner: payloadData.winner,
            numTurns: payloadData.numTurns,
            player1Info: {
              ...RPSDInfoRef.current.player1Info,
              score: payloadData.player1Info.score,
            },
            player2Info: {
              ...payloadData.player2Info,
            },
          };
    if (payloadData.sender != RPSDInfoRef.current.name) {
      newRPSDInfo.receivedMove = true;
    }
    setRPSDInfo(newRPSDInfo);
    RPSDInfoRef.current = { ...newRPSDInfo };

    if (payloadData.winner != "") {
      setState("endscr");
    }
  }
  const connect = () => {
    let Sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    stompClient.subscribe("/requests/newPlayer", onGlobalRequestReceived);

    stompClient.send("/app/global", {}, JSON.stringify({ ...RPSDInfo }));
    setState("startscr");
  };

  if (state === "connectingscr") {
    connect();
    console.log("CONNECTION STARTED!");
  }

  console.log("reloaded challenging: " + JSON.stringify(RPSDInfoRef.current));
  return (
    (state === "startscr" && (
      <WelcomeScreen
        name={name}
        setName={setName}
        state={state}
        setState={setState}
        RPSDInfo={RPSDInfo}
        setRPSDInfo={setRPSDInfo}
        stompClient={stompClient}
        playerList={playerList}
        setPlayerList={setPlayerList}
        playersStatus={playersStatus}
        setPlayersStatus={setPlayersStatus}
        onPrivateRequestReceived={onPrivateRequestReceived}
        updatePlayers={updatePlayers}
        onChallengedPlayer={onChallengedPlayer}
        cancelledChallenge={cancelledChallenge}
        declinedChallenge={declinedChallenge}
        onGlobalRequestReceived={onGlobalRequestReceived}
        receivedMove={receivedMove}
        RPSDInfoRef={RPSDInfoRef}
        receiveWager={receiveWager}
        startGame={startGame}
        receiveMove={receiveMove}
      />
    )) ||
    (state === "lobbyscr" && (
      <LobbyScreen
        name={name}
        setName={setName}
        state={state}
        setState={setState}
        RPSDInfo={RPSDInfo}
        setRPSDInfo={setRPSDInfo}
        stompClient={stompClient}
        playerList={playerList}
        setPlayerList={setPlayerList}
        playersStatus={playersStatus}
        setPlayersStatus={setPlayersStatus}
        RPSDInfoRef={RPSDInfoRef}
      />
    )) ||
    (state === "wagerscr" && (
      <WagerScreen
        name={name}
        setName={setName}
        state={state}
        setState={setState}
        RPSDInfo={RPSDInfo}
        setRPSDInfo={setRPSDInfo}
        stompClient={stompClient}
        playerList={playerList}
        setPlayerList={setPlayerList}
        playersStatus={playersStatus}
        setPlayersStatus={setPlayersStatus}
        RPSDInfoRef={RPSDInfoRef}
      />
    )) ||
    (state === "gamescr" && (
      <GameScreen
        name={name}
        setName={setName}
        state={state}
        setState={setState}
        RPSDInfo={RPSDInfo}
        setRPSDInfo={setRPSDInfo}
        stompClient={stompClient}
        playerList={playerList}
        setPlayerList={setPlayerList}
        playersStatus={playersStatus}
        setPlayersStatus={setPlayersStatus}
        RPSDInfoRef={RPSDInfoRef}
        time={time}
        receiveMove={receiveMove}
      />
    ))
  );
}

export default App;
