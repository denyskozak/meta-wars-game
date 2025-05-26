"use client";


import {useWS} from "@/hooks/useWS";
import {useEffect, useState} from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, useDisclosure} from "@heroui/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/modal";
import {Input} from "@heroui/input";
import {useParams} from "next/navigation";


interface Match {
    id: string;
    name: string;
    players: string[];
    maxPlayers: number;
    isFull: boolean;
}

export default function MatchesPage() {
    const {socket, sendToSocket} = useWS();
    const params = useParams();
    const [match, setMatch] = useState<Match | null>(null);

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
            type: 'GET_MATCH',
            id: params?.id
        })
    }, []);

    return (
        <>
           <span>Lobby: {params?.id}</span>
           <span>{JSON.stringify(match)}</span>
        </>
    );
}
