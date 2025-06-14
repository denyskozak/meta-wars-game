"use client";
import {useWS} from "@/hooks/useWS";
import React, {useEffect, useState} from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, useDisclosure} from "@heroui/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/modal";
import {Input} from "@heroui/input";
import {useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";

interface Match {
    id: string;
    name: string;
    players: string[];
    maxPlayers: number;
    isFull: boolean;
}

export default function MatchesPage() {
    const {socket, sendToSocket} = useWS();
    const router = useRouter();

    const [matches, setMatches] = useState<Match[]>([]);
    const [name, setName] = useState("Teee");
    const [maxPlayers, setMaxPlayers] = useState("1");
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            let message = JSON.parse(event.data);
            console.log("message: ", message);
            switch (message.type) {
                case "MATCH_LIST":
                    setMatches(message.matches);
                    break;

            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };


    }, []);

    const handleAddMatch = () => {
        sendToSocket({
            type: 'CREATE_MATCH',
            name,
            maxPlayers
        })

        setName('');
        setMaxPlayers('0');
        sendToSocket({
            type: 'GET_MATCHES',
        });
    };

    const fetchMatches = () => {
        sendToSocket({
            type: 'GET_MATCHES',
        });
    };

    const goToLobby = (id) => {
        router.push(`/matches/${id}`);
    };

    return (
        <div className="h-full">
            <Navbar/>

            <div className="flex justify-center items-center">
               <div className="max-w-[640px] min-w-[480px] flex gap-8 flex-col">
                   <Button size='lg' onPress={onOpen}>Create Match</Button>
                   <Button size='lg' color="primary" onPress={fetchMatches}>Fetch Matches</Button>
                   <Table aria-label="Example static collection table">
                       <TableHeader>
                           <TableColumn>ID</TableColumn>
                           <TableColumn>NAME</TableColumn>
                           <TableColumn>PLAYERS</TableColumn>
                           <TableColumn>ACTION</TableColumn>
                       </TableHeader>
                       <TableBody>
                           {matches.map(matche => (
                               <TableRow key={matche.id}>
                                   <TableCell>{matche.id}</TableCell>
                                   <TableCell>{matche.name}</TableCell>
                                   <TableCell>{matche.players.length} / {matche.maxPlayers}</TableCell>
                                   <TableCell>
                                       <><Button color="primary" onPress={() => goToLobby(matche.id)}>Join</Button></>
                                   </TableCell>
                               </TableRow>
                           ))}
                       </TableBody>
                   </Table>
                   {/*Create Match*/}
                   <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                       <ModalContent>
                           {(onClose) => (
                               <>
                                   <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
                                   <ModalBody>
                                       <Input label="Name" type="text" value={name} onValueChange={setName}/>
                                       <Input label="Max players" type="number" value={maxPlayers}
                                              onValueChange={setMaxPlayers}/>
                                   </ModalBody>
                                   <ModalFooter>
                                       <Button color="danger" variant="light" onPress={onClose}>
                                           Close
                                       </Button>
                                       <Button color="primary" onPress={handleAddMatch}>
                                           Create
                                       </Button>
                                   </ModalFooter>
                               </>
                           )}
                       </ModalContent>
                   </Modal>
               </div>
            </div>
        </div>
    );
}
