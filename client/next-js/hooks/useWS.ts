import { useCurrentAccount } from "@mysten/dapp-kit";

import { useInterface } from "../context/inteface";

const socket = new WebSocket(`ws://${process.env.NEXT_PUBLIC_SOCKET_URL}`);

// const socket = new WebSocket('ws://localhost:8080');
export const useWS = (matchId: string | string[] | null = null) => {
  const account = useCurrentAccount();
  const address = account?.address;
  const {
    state: { character },
  } = useInterface();

  const sendToSocket = (data) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ address, matchId, character, ...data }));
  };

  return { socket, sendToSocket };
};
