"use client";


import {useWS} from "@/hooks/useWS";
import {useEffect, useMemo, useState} from "react";
import Image from "next/image";
import {Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@heroui/react";
import {useParams, useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";
import {useInterface} from "@/context/inteface";


interface Match {
    id: string;
    name: string;
    players: string[];
    maxPlayers: number;
    isFull: boolean;
}

export default function MatchesPage() {
    const params = useParams();
    const router = useRouter();
    const {socket, sendToSocket} = useWS(params?.id);
    const {dispatch} = useInterface();

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<number[]>([]);
    const [classType, setClassType] = useState('');
    const [skin, setSkin] = useState('mad');
    const classOptions = [
        {value: 'mage', label: 'Mage', icon: '/icons/mage.png'},
        {value: 'warlock', label: 'Warlock', icon: '/icons/warlock.webp'},
    ];
    console.log("players: ", players);
    useEffect(() => {
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'GET_MATCH':
                    if (message.match) {
                        setMatch(message.match);
                        setPlayers(Array.from(message.match.players).map(([id]) => Number(id)));
                    }
                    break;
                case 'MATCH_JOINED':
                    if (message.players) {
                        setPlayers(Array.from(message.players).map(([id]) => Number(id)));
                    }
                    break;
                case 'PLAYER_LEFT':
                    setPlayers(prev => prev.filter(p => p !== message.playerId));
                    break;
                case 'MATCH_READY':
                    router.push(`/matches/${params.id}/game`);
                    break;
            }
        };

        sendToSocket({type: 'JOIN_MATCH'});
        sendToSocket({type: 'GET_MATCH'});
    }, []);

    const handleReady = () => {
        dispatch({type: 'SET_CHARACTER', payload: {name: classType, skin}});
        router.push(`/matches/${params.id}/game`);
    };

    const classInfo = useMemo(() => {
        return classType
            ? classOptions.find(({ value }) => value === classType)
            : null;
    }, [classType]);

    return (
        <div className="h-full">
            <Navbar/>
            <div className="flex max-w-[650px] m-auto flex-col items-center mt-4 gap-4">
                {classType
                    ? (
                        <>
                            <h2 className="text-xl font-semibold">Lobby: {match?.name || params?.id}</h2>
                            <Table aria-label="Players">
                                <TableHeader>
                                    <TableColumn>Players</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {players.map(pid => (
                                        <TableRow key={pid}>
                                            <TableCell>{`Player ${pid}`}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="flex gap-4 items-center flex-col">

                                <Image src={classInfo?.icon || ''} alt={classInfo?.label || ''} width={256} height={256}/>

                                <Button disabled={!Boolean(classType)} color="primary"
                                        onPress={handleReady}>Ready?</Button>
                            </div>
                        </>
                    )
                    : (
                        <div className="flex flex-col text-center">
                            <span className="mb-1 text-large">Choose a Class:</span>
                            <div className="grid grid-cols-2 gap-2 ">
                                {classOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setClassType(opt.value)}
                                        className={`flex flex-col items-center p-2`}
                                    >
                                        <Image src={opt.icon} alt={opt.label} width={256} height={256}/>
                                        <span className="text-xs mt-1">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

            </div>
        </div>
    );
}
