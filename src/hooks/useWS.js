import {useZKLogin} from "react-sui-zk-login-kit";
import {useInterface} from "../context/inteface.jsx";

// const socket = new WebSocket('ws://35.160.49.180:8080');
const socket = new WebSocket('ws://localhost:8080');
export const useWS = () => {
    const {address} = useZKLogin();
    const {state: {character}} = useInterface();

    const sendToSocket = (data) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
         socket.send(JSON.stringify({id: address, character, ...data}));
    };

    return {socket, sendToSocket}
}