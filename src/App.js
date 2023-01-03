import "./App.css";
import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
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
  });

  const [name, setName] = useState("");
  const [state, setState] = useState("startscr");

  useEffect(() => {
    if (RPSDInfo.connected) {
      connect();
    }
  }, [RPSDInfo.connected]);

  const onError = (err) => {
    console.log(err);
  };
  function userJoin() {
    stompClient.send("/app/global", {}, JSON.stringify(RPSDInfo));
  }
  function onRequestReceived(payload) {}

  function onPrivateRequestReceived(payload) {}

  const connect = () => {
    let Sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    stompClient.subscribe("/global", onRequestReceived);
    stompClient.subscribe(
      "/user/" + RPSDInfo.name + "/private",
      onPrivateRequestReceived
    );
    userJoin();
  };

  return (
    state === "startscr" && (
      <WelcomeScreen
        name={name}
        setName={setName}
        state={state}
        setState={setState}
        RPSDInfo={RPSDInfo}
        setRPSDInfo={setRPSDInfo}
        stompClient={stompClient}
      />
    )
    // ||
    // state === ""
  );
}

export default App;
