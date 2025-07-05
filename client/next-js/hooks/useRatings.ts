import { useEffect, useState } from "react";

import { useWS } from "./useWS";

export interface RatingItem {
  address: string;
  points: number;
}

export const useRatings = () => {
  const [ratings, setRatings] = useState<RatingItem[]>([]);

  const { socket, sendToSocket } = useWS();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let message: any = {};

      try {
        message = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (message.type === "RANKINGS" && Array.isArray(message.rankings)) {
        setRatings(
          message.rankings.map(([address, points]: [string, number]) => ({
            address,
            points,
          })),
        );
      }
    };

    const handleOpen = () => {
      sendToSocket({ type: "GET_RANKINGS" });
    };

    socket.addEventListener("message", handleMessage);
    if (socket.readyState === WebSocket.OPEN) {
      sendToSocket({ type: "GET_RANKINGS" });
    } else {
      socket.addEventListener("open", handleOpen);
    }

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("open", handleOpen);
    };
  }, []);

  return { ratings };
};
