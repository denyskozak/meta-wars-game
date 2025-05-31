"use client";


import {useWS} from "@/hooks/useWS";
import {useEffect, useState} from "react";
import {Button} from "@heroui/react";
import {useParams, useRouter} from "next/navigation";


interface Match {
    id: string;
    name: string;
    players: string[];
    maxPlayers: number;
    isFull: boolean;
}

export default function MatchesPage() {
    const params = useParams();
    const {socket, sendToSocket} = useWS(params.id);
    const [match, setMatch] = useState<Match | null>(null);
    const router = useRouter();

    useEffect(() => {
        socket.onmessage = async (event) => {
            let message = JSON.parse(event.data);
            switch (message.type) {
                case "GET_MATCH":
                    setMatch(message.match);
                    break;
            }
        };

        sendToSocket({
            type: 'JOIN_MATCH',
        })

        sendToSocket({
            type: 'GET_MATCH',
        })
        console.log("111: ", 111);
    }, []);

    const goToGame = () => {
        router.push(`/matches/${params.id}/game`);
    };

    return (
        <>
            <span>Lobby: {params?.id}</span>
            <span>{JSON.stringify(match)}</span>
            <Button color="primary" onPress={() => goToGame()}>Join</Button>

        </>
    );
}
