const WebSocket = require('ws');
const http = require('http');

const clients = new Map();
const playerMatchMap = new Map(); // playerId => matchId

const server = http.createServer();
const ws = new WebSocket.Server({ server });

const matches = new Map(); // matchId => { id, players: Set, maxPlayers, isFull }
let matchCounter = 1;

function createMatch({ name, maxPlayers = 4, ownerId }) {
    const matchId = `match_${matchCounter++}`;
    const match = {
        id: matchId,
        name,
        players: new Set([]),
        playersReady: 0,
        maxPlayers: Number(maxPlayers),
        isFull: false,
    };
    matches.set(matchId, match);
    playerMatchMap.set(ownerId, matchId);
    return match;
}

function broadcastToMatch(matchId, message, excludeId = null) {
    const match = matches.get(matchId);
    if (!match) return;

    match.players.forEach((playerId) => {
        if (playerId !== excludeId) {
            const client = clients.get(playerId);
            if (client) {
                client.send(JSON.stringify({...message, myPlayerId: playerId }));
            }
        }
    });
}

ws.on('connection', (socket) => {
    console.log('New client connected.');
    const id = Date.now();
    clients.set(id, socket);

    socket.on('message', (data) => {
        let message = {};
        try {
            message = JSON.parse(data);
        } catch (e) {}

        const match = matches.get(message.matchId);
        if (message.type !== 'updatePosition') {
            console.log("message: ", message);
            console.log("match: ", match);
        }
        switch (message.type) {
            case 'READY_FOR_MATCH':
                if (match) {
                    const matchId = playerMatchMap.get(id);

                    match.playersReady++;
                    if (match.playersReady === match.maxPlayers) {
                        const matchReadyMessage = {
                            type: 'MATCH_READY',
                            id: match.id,
                            players: Array.from(match.players),
                        };
                        console.log("matchReadyMessage: ", matchReadyMessage);
                        broadcastToMatch(matchId, matchReadyMessage);
                    }
                }
                break;
            case 'KILL':
                break;

            case 'GET_MATCHES':
                const allMatches = Array.from(matches.values()).map(match => ({
                    ...match,
                    players: Array.from(match.players),
                }));
                socket.send(JSON.stringify({
                    type: 'MATCH_LIST',
                    matches: allMatches,
                }));
                break;

            case 'GET_MATCH':

                if (match) {
                    socket.send(JSON.stringify({
                        type: 'GET_MATCH',
                        match: {
                            ...match,
                            players: Array.from(match.players),
                        },
                    }));
                }
                break;

            case 'CREATE_MATCH':
                createMatch({
                    maxPlayers: message.maxPlayers,
                    name: message.name,
                    ownerId: id,
                });
                break;

            case 'JOIN_MATCH':
                const matchToJoin = matches.get(message.matchId);
                if (!matchToJoin || matchToJoin.isFull) {
                    socket.send(JSON.stringify({ type: 'MATCH_JOIN_FAILED', reason: 'Match not found or full' }));
                    break;
                }

                matchToJoin.players.add(id);
                playerMatchMap.set(id, message.matchId);
                if (matchToJoin.players.size >= matchToJoin.maxPlayers) {
                    matchToJoin.isFull = true;
                }

                matchToJoin.players.forEach(playerId => {
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
                    matchToLeave.playersReady--;
                    playerMatchMap.delete(id);

                    if (matchToLeave.players.size === 0) {
                        matches.delete(message.matchId);
                    } else {
                        matchToLeave.isFull = false;
                        matchToLeave.players.forEach(playerId => {
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

            case 'updatePosition':
                const posMatchId = playerMatchMap.get(id);
                if (posMatchId) {
                    broadcastToMatch(posMatchId, {
                        type: 'updatePosition',
                        position: message.position,
                        rotation: message.rotation,
                        fromId: id,
                    }, id);
                }
                break;

            case 'CAST_SPELL':
                const spellMatchId = playerMatchMap.get(id);
                if (spellMatchId) {
                    broadcastToMatch(spellMatchId, {
                        type: 'CAST_SPELL',
                        payload: message.payload,
                        id,
                    }, id);
                }
                break;

            default:
                const defaultMatchId = playerMatchMap.get(id);
                if (defaultMatchId) {
                    broadcastToMatch(defaultMatchId, { ...message, fromId: id }, id);
                }
                break;
        }
    });

    socket.on('close', () => {
        console.log(`Client ${id} disconnected.`);
        clients.delete(id);

        clients.forEach(client => {
            client.send(JSON.stringify({ type: 'removePlayer', id }));
        });

        const matchId = playerMatchMap.get(id);
        playerMatchMap.delete(id);

        if (matchId) {
            const match = matches.get(matchId);
            if (match) {
                match.players.delete(id);
                match.playersReady--;
                match.isFull = false;

                if (match.players.size === 0) {
                    matches.delete(matchId);
                } else {
                    match.players.forEach(playerId => {
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
