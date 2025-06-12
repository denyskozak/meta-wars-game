// Chat.js
import { useState, useEffect } from "react";

import "./Chat.css";
import { useInterface } from "../../context/inteface";
import { useWS } from "../../hooks/useWS";

export const Chat = () => {
  const [input, setInput] = useState("");
  const {
    state: { chatMessages: messages },
    dispatch,
  } = useInterface();
  const { socket, sendToSocket } = useWS();
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "SEND_CHAT_MESSAGE":
          dispatch({
            type: "SEND_CHAT_MESSAGE",
            payload: `${message?.character?.name ?? "Anon"} say: ${message.payload}`,
          });
          break;
        case "CHAT_USER_COUNT":
          setUserCount(message.count);
          break;
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSend = () => {
    if (input.trim() !== "") {
      dispatch({ type: "SEND_CHAT_MESSAGE", payload: `Me: ${input}` });
      sendToSocket({ type: "SEND_CHAT_MESSAGE", payload: input });
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div id="chat-container">
      <div id="chat-header">{userCount} online</div>
      <div id="chat-messages">
        {messages.map(({ text, id }) => (
          <div key={id} className="chat-message">
            {text}
          </div>
        ))}
      </div>
      <div id="chat-input-container">
        <input
          id="chat-input"
          placeholder="Type a message..."
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button id="chat-submit" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};
