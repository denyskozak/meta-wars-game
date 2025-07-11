import { useCurrentAccount } from "@mysten/dapp-kit";
import { useEffect, useState, useCallback } from "react";

import { useWS } from "./useWS";

export const useProfile = () => {
  const account = useCurrentAccount();
  const address = account?.address;
  const { socket, sendToSocket } = useWS();

  const [profile, setProfile] = useState<any | null>(null);

  const refetch = useCallback(() => {
    if (!address) return;
    sendToSocket({ type: "GET_PROFILE", address });
  }, [address, sendToSocket]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let message: any = {};
      try {
        message = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (message.type === "PROFILE" && message.address === address) {
        setProfile(message.profile || null);
      }
    };

    const handleOpen = () => {
      refetch();
    };

    socket.addEventListener("message", handleMessage);
    if (socket.readyState === WebSocket.OPEN) {
      refetch();
    } else {
      socket.addEventListener("open", handleOpen);
    }

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("open", handleOpen);
    };
  }, [address, socket, refetch]);

  const nickname = profile?.nickname || null;

  return { profile, nickname, refetch };
};
