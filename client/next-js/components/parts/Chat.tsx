// Chat.js
import { useState } from 'react';
import './Chat.css';
import {useInterface} from "../../context/inteface";
import {useWS} from "../../hooks/useWS";

export const Chat = () => {
    const [input, setInput] = useState("");
    const { state: { chatMessages: messages }, dispatch}  = useInterface();
    const { sendToSocket}  = useWS();

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
