// Chat.js
import React, { useState } from 'react';
import './Chat.css';
import {useInterface} from "../../context/inteface.jsx";

export const Chat = () => {
    const [input, setInput] = useState("");
    const { state: { chatMessages: messages }, dispatch}  = useInterface();

    const handleSend = () => {
        if (input.trim() !== "") {
            dispatch({ type: "SEND_CHAT_MESSAGE", payload: input });
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
            <div id="chat-messages">
                {messages.map((message) => (
                    <div key={message} className="chat-message">
                        {message}
                    </div>
                ))}
            </div>
            <div id="chat-input-container">
                <input
                    id="chat-input"
                    type="text"
                    placeholder="Type a message..."
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
