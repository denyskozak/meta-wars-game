"use client";
import {useWS} from "@/hooks/useWS";
import {useCallback, useEffect, useMemo, useState} from "react";
import Image from "next/image";
import {Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@heroui/react";
import {useParams, useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";
import {useInterface} from "@/context/inteface";
import {InterfaceContextValue, MatchDetail, PlayerData} from "@/types";


type Match = MatchDetail;

export default function MatchesPage() {
    const params = useParams();
    const router = useRouter();
    const {socket, sendToSocket} = useWS(params?.id);
    const {dispatch} = useInterface() as InterfaceContextValue;

    const [match, setMatch] = useState<Match | null>(null);
    const [players, setPlayers] = useState<{ id: number, address: string, classType: string }[]>([]);
    const [classType, setClassType] = useState('');
    const [skin, setSkin] = useState('mad');
    const [joined, setJoined] = useState(false);
    const classOptions = {
        mage: {
            label: 'Mage',
            icon: '/icons/mage.png'
        },
        warlock: {
            label: 'Warlock',
            icon: '/icons/warlock.webp'
        },
        paladin: {
            label: 'Paladin',
            icon: '/icons/paladin.webp'
        },
        rogue: {
            label: 'Rogue',
            icon:  '/icons/rogue.webp'
        },
        warrior: {
            label: 'Warrior',
            icon:  '/icons/warrior.webp'
        },
    };

    console.log("players: ", players);
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'GET_MATCH':
                    if (message.match) {
                        setMatch(message.match);
                        setPlayers((message.match.players as Array<[string, PlayerData]>).map(([pid, pdata]) => ({
                            id: Number(pid),
                            address: pdata.address,
                            classType: pdata.classType,
                        })));
                    }
                    break;
                case 'MATCH_JOINED':
                    if (message.players) {
                        setPlayers((message.players as Array<[string, PlayerData]>).map(([pid, pdata]) => ({
                            id: Number(pid),
                            address: pdata.address,
                            classType: pdata.classType,
                        })));
                    }
                    break;
                case 'PLAYER_LEFT':
                    setPlayers(prev => prev.filter(p => p.id !== message.playerId));
                    break;
                case 'MATCH_READY':
                    router.push(`/matches/${params?.id}/game`);
                    break;
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        if (classType && !joined) {
            sendToSocket({type: 'JOIN_MATCH', classType});
            sendToSocket({type: 'GET_MATCH'});
            setJoined(true);
        }
    }, [classType, joined]);

    const handleReady = () => {
        if (!joined && classType) {
            sendToSocket({type: 'JOIN_MATCH', classType});
        }
        dispatch({type: 'SET_CHARACTER', payload: {name: classType.toLowerCase(), skin}});
        router.push(`/matches/${params?.id}/game`);
    };


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
                                    <TableColumn>Address</TableColumn>
                                    <TableColumn>Class</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {players.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.address}</TableCell>
                                            <TableCell>{p.classType}
                                                <Image src={classOptions[p.classType].icon || ''} alt={classOptions[p.classType].label || ''} title={classOptions[p.classType].label || ''} width={34}
                                                       height={34}/>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="flex gap-4 items-center flex-col">



                                <Button disabled={!Boolean(classType)} color="primary"
                                        onPress={handleReady}>Ready?</Button>
                            </div>
                        </>
                    )
                    : (
                        <div className="flex flex-col text-center">
                            <span className="mb-1 text-large">Choose a Class:</span>
                            <div className="grid grid-cols-3 gap-2 ">
                                {Object.entries(classOptions).map(([value, opt]) => (
                                    <button
                                        key={value}
                                        onClick={() => setClassType(value)}
                                        className={`flex flex-col items-center p-2`}
                                    >
                                        <Image src={opt.icon} alt={opt.label} width={180} height={180}/>
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
