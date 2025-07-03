import { useEffect, useState } from "react";
import { useWS } from "./useWS";

export interface RankEntry {
  position: number;
  points: number;
}

export const useRankTable = () => {
  const [table, setTable] = useState<RankEntry[]>([]);
  const { socket, sendToSocket } = useWS();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let message: any = {};
      try {
        message = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (message.type === "RANK_POINTS" && Array.isArray(message.table)) {
        setTable(
          message.table.map(([pos, pts]: [number, number]) => ({
            position: pos,
            points: pts,
          }))
        );
      }
    };

    const handleOpen = () => {
      sendToSocket({ type: "GET_RANK_POINTS" });
    };

    socket.addEventListener("message", handleMessage);
    if (socket.readyState === WebSocket.OPEN) {
      sendToSocket({ type: "GET_RANK_POINTS" });
    } else {
      socket.addEventListener("open", handleOpen);
    }

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("open", handleOpen);
    };
  }, []);

  return { table };
};
