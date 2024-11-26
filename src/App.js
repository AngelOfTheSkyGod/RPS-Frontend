import React, { useRef, useState } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import GameEndScreen from "./components/GameEndScreen";
import GameScreen from "./components/GameScreen";
import LobbyScreen from "./components/LobbyScreen";
import WagerScreen from "./components/WagerScreen";
import WelcomeScreen from "./components/WelcomeScreen";
var stompClient = null;

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

  function playerHasLeft(payload) {
    let payloadData = JSON.parse(payload.body);
    if (
      payloadData.name === RPSDInfoRef.current.player1Info.name ||
      payloadData.name === RPSDInfoRef.current.player2Info.name ||
      payloadData.name === RPSDInfoRef.current.receiver ||
      payloadData.name === RPSDInfoRef.current.sender
    ) {
      let newRPSDInfo = {
        ...RPSDInfoRef.current,
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
      time.current = 10;
      setRPSDInfo({ ...newRPSDInfo });
      RPSDInfoRef.current = { ...newRPSDInfo };
      setState("lobbyscr");
    }

    if (playersStatus.has(payloadData.name)) {
      playersStatus.delete(payloadData.name);
    }
    setPlayersStatus(new Map());
    updatePlayers(payload);
  }

  function updatePlayers(payload) {
    let payloadData = JSON.parse(payload.body);
    let newPlayerList = payloadData.players;
    console.log("Received: " + newPlayerList);

    let newPlayersStatus = new Map();

    newPlayerList.forEach((item, index) => {
      newPlayersStatus.set(item, true);
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
    console.log(
      "joined! fetching players." +
        "obj: " +
        JSON.stringify(RPSDInfoRef.current)
    );
    updatePlayers(payload);
  }

  function handlePing(payload) {
    let payloadData = JSON.parse(payload.body);

    stompClient.send(
      "/app/pong",
      {},
      JSON.stringify({ ...RPSDInfoRef.current })
    );
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
        receivedMove: false,
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
        receivedMove: false,
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
        receivedMove: false,
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
        receivedMove: false,
      },
    };
  }

  function acceptedChallenge(payload) {
    let payloadData = JSON.parse(payload.body);
    let newRPSDInfo = {
      ...RPSDInfoRef.current,
      state: "wagerscr",
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

    let newRPSDInfo = {
      ...RPSDInfoRef.current,
      player1Info: {
        ...payloadData.player1Info,
      },
      player2Info: {
        ...payloadData.player2Info,
      },
      roundWinner: payloadData.roundWinner,
      winner: payloadData.winner,
      numTurns: payloadData.numTurns,
    };

    if (payloadData.winner !== "") {
      setState("endscr");
      newRPSDInfo.state = "endscr";
      console.log("winnter decided: " + payloadData.winner);
    }
    setRPSDInfo(newRPSDInfo);
    RPSDInfoRef.current = { ...newRPSDInfo };
  }

  const connect = () => {
    let Sock = new SockJS("http://76.141.228.122:1778/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    stompClient.subscribe("/requests/newPlayer", onGlobalRequestReceived);

    stompClient.send("/app/global", {}, JSON.stringify({ ...RPSDInfo }));
    stompClient.send("/app/private-updatePlayers", {}, JSON.stringify({}));
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
        acceptedChallenge={acceptedChallenge}
        RPSDInfoRef={RPSDInfoRef}
        receiveWager={receiveWager}
        startGame={startGame}
        receiveMove={receiveMove}
        playerHasLeft={playerHasLeft}
        handlePing={handlePing}
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
    )) ||
    (state === "endscr" && (
      <GameEndScreen
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
