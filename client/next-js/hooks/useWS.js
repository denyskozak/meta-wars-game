import {useInterface} from "../context/inteface";
import {useCurrentAccount} from "@mysten/dapp-kit";

const socket = new WebSocket(`ws://${process.env.NEXT_PUBLIC_SOCKET_URL}`);
// const socket = new WebSocket('ws://localhost:8080');
export const useWS = () => {
    const account = useCurrentAccount();
    const {state: {character}} = useInterface();

    const sendToSocket = (data) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
         socket.send(JSON.stringify({id: account?.address, character, ...data}));
    };

    return {socket, sendToSocket}
}