const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
// const { // const { mintCoins } = require('./sui.cjs');mintCoins } = require('./sui.cjs');

const clients = new Map();

// Prod
const server = http.createServer();
const ws = new WebSocket.Server({ server });


// Matches
const matches = new Map(); // matchId => { id, players: Set, maxPlayers, isFull }
let matchCounter = 1;
function createMatch({ name, maxPlayers = 4, ownerId }) {
    const matchId = `match_${matchCounter++}`;
    const match = {
        id: matchId,
        name,
        players: new Set([ownerId]),
        maxPlayers,
        isFull: false,
    };
    console.log("match: ", match);
    matches.set(matchId, match);
    return match;
}


ws.on('connection', (socket) => {
    console.log('New client connected.');
    // Assign a unique ID to the new client
    const id = Date.now();
    clients.set(id, socket);

    const broadcastIt = (message = {}) => {
        clients.forEach((client, clientId) => {
            if (clientId !== id) {
                client.send( JSON.stringify({...message, fromId: id, toId: clientId}));
            }
        });
    }

    // Broadcast new player info to all clients
    const joinMessage = {type: 'newPlayer', id};
    broadcastIt(joinMessage);

    // Handle incoming messages from a client
    socket.on('message', (data) => {
        let message = {};

        try {
            message = JSON.parse(data);
        } catch (e) {}
        // Broadcast the message to all other clients

        switch (message.type) {
            case 'KILL':
                const { killerId } = message;

                // Mint coins for the killer using a Move smart contract
                // mintCoins(killerId, 1) // Example: Award 10 coins to the killer
                //     .then((txHash) => {
                //         console.log(`Minted coins for Player ${killerId}. Transaction Hash: ${txHash}`);
                //
                //         // Broadcast the kill event and reward info
                //         broadcastIt({
                //             ...message,
                //             killerId,
                //             txHash,
                //         });
                //     })
                //     .catch((err) => {
                //         console.error(`Failed to mint coins for Player ${killerId}:`, err);
                //     });
                break;
            case 'GET_MATCHES':
                const allMatches = Array.from(matches.values()).map((match) => ({
                    ...match,
                    players: Array.from(match.players),
                }));

                socket.send(JSON.stringify({
                    type: 'MATCH_LIST',
                    matches: allMatches,
                }));
                break;
            case 'GET_MATCH':
                const match = Array.from(matches.values()).find((match) => match.id === message.id);
                console.log("GET_MATCH match: ",  match);
                socket.send(JSON.stringify({
                    type: 'GET_MATCH',
                    match: {
                        ...match,
                        players: Array.from(match.players),
                    },
                }));
                break;
            case 'CREATE_MATCH':
                 createMatch({ maxPlayers: message.maxPlayers, name: message.name, ownerId: id });

                break;

            case 'JOIN_MATCH':
                const matchToJoin = matches.get(message.matchId);
                if (!matchToJoin || matchToJoin.isFull) {
                    socket.send(JSON.stringify({ type: 'MATCH_JOIN_FAILED', reason: 'Match not found or full' }));
                    break;
                }

                matchToJoin.players.add(id);
                if (matchToJoin.players.size >= matchToJoin.maxPlayers) {
                    matchToJoin.isFull = true;
                }

                // Notify everyone in match
                matchToJoin.players.forEach((playerId) => {
                    const client = clients.get(playerId);
                    if (client) {
                        client.send(JSON.stringify({
                            type: 'MATCH_JOINED',
                            matchId: matchToJoin.id,
                            players: Array.from(matchToJoin.players),
                            isFull: matchToJoin.isFull,
                        }));
                    }
                });
                break;

            case 'LEAVE_MATCH':
                const matchToLeave = matches.get(message.matchId);
                if (matchToLeave) {
                    matchToLeave.players.delete(id);

                    if (matchToLeave.players.size === 0) {
                        matches.delete(message.matchId); // delete empty match
                    } else {
                        matchToLeave.isFull = false;
                        matchToLeave.players.forEach((playerId) => {
                            const client = clients.get(playerId);
                            if (client) {
                                client.send(JSON.stringify({
                                    type: 'PLAYER_LEFT',
                                    matchId: matchToLeave.id,
                                    playerId: id,
                                }));
                            }
                        });
                    }
                }
                break;
            default:
                broadcastIt(message);
        }
    });

    // Handle client disconnect
    socket.on('close', () => {
        console.log(`Client ${id} disconnected.`);
        clients.delete(id);

        // Notify all clients about the disconnection
        const disconnectMessage = JSON.stringify({type: 'removePlayer', id});
        clients.forEach((client) => {
            client.send(disconnectMessage);
        });

        for (const [matchId, match] of matches) {
            if (match.players.has(id)) {
                match.players.delete(id);
                match.isFull = false;

                if (match.players.size === 0) {
                    matches.delete(matchId);
                } else {
                    match.players.forEach((playerId) => {
                        const client = clients.get(playerId);
                        if (client) {
                            client.send(JSON.stringify({
                                type: 'PLAYER_LEFT',
                                matchId,
                                playerId: id,
                            }));
                        }
                    });
                }
            }
        }
    });
});


server.listen(4000, () => {
    console.log('Secure WebSocket server is running');
});