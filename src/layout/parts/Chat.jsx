// Chat.js
import React, { useState } from 'react';
import './Chat.css';

export const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (input.trim() !== "") {
            setMessages([...messages, input]);
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
                {messages.map((message, index) => (
                    <div key={index} className="chat-message">
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
