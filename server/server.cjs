const WebSocket = require('ws');
const http = require('http');

const UPDATE_MATCH_INTERVAL = 33;
const SPELL_COST = {
    'fireball': 25,
    'iceball': 25,
    'shield': 80,
    'blink': 20,
    'heal': 30,
};

const clients = new Map();
const playerMatchMap = new Map(); // playerId => matchId

const server = http.createServer();
const ws = new WebSocket.Server({server});

const matches = new Map(); // matchId => { id, players: Map, maxPlayers, isFull, finished, summary }
const finishedMatches = new Map(); // store summary of finished matches
let matchCounter = 1;

function createMatch({name, maxPlayers = 4, ownerId}) {
    const matchId = `match_${matchCounter++}`;
    const match = {
        id: matchId,
        name,
        players: new Map(),
        playersReady: 0,
        maxPlayers: Number(maxPlayers),
        isFull: false,
        finished: false,
        summary: null,
    };
    matches.set(matchId, match);
    playerMatchMap.set(ownerId, matchId);
    return match;
}

function broadcastToMatch(matchId, message, excludeId = null) {
    const match = matches.get(matchId);
    if (!match) return;

    for (const [id] of match.players) {
        if (id !== excludeId) {
            const client = clients.get(id);
            if (client) {
                client.send(JSON.stringify({...message, myPlayerId: id}));
            }
        }
    }
}

function createPlayer() {
    return {
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        animationAction: '',
        rotation: {y: 0},
        buffs: [],
        kills: 0,
        deaths: 0,
        assists: 0,
        points: 0,
        hp: 100,
        mana: 100
    };
}

ws.on('connection', (socket) => {
    console.log('New client connected.');
    const id = Date.now();
    clients.set(id, socket);

    setInterval(() => {
        for (const [id, match] of matches) {
            broadcastToMatch(id, {
                type: 'UPDATE_MATCH',
                ...match,
                players: Object.fromEntries(match.players)
            });

        }
    }, UPDATE_MATCH_INTERVAL);

    setInterval(() => {
        for (const match of matches.values()) {
            match.players.forEach(player => {
                if (player.mana < 100) {
                    player.mana = Math.min(100, player.mana + 5);
                }
            });
        }
    }, 1000);

    socket.on('message', (data) => {
        let message = {};
        try {
            message = JSON.parse(data);
        } catch (e) {
        }

        const matchId = playerMatchMap.get(id);
        const match = matches.get(matchId);

        switch (message.type) {
            case 'READY_FOR_MATCH':
                if (match) {
                    match.playersReady++;
                    if (match.playersReady === match.maxPlayers) {
                        const matchReadyMessage = {
                            type: 'MATCH_READY',
                            id: match.id,
                            players: Array.from(match.players).map(([id]) => {
                                return id;
                            }),
                        };
                        broadcastToMatch(match.id, matchReadyMessage);
                    }
                }
                break;
            case 'KILL':
                const player = match.players.get(id);
                const killerPlayer = match.players.get(message.killerId);
                if (player) {
                    player.deaths++;
                }

                if (killerPlayer) {
                    killerPlayer.kills++;
                    killerPlayer.points += 100;

                    if (killerPlayer.kills >= 15 && !match.finished) {
                        match.finished = true;
                        match.summary = Array.from(match.players.entries()).map(([pid, p]) => ({
                            id: pid,
                            kills: p.kills,
                            deaths: p.deaths
                        }));
                        finishedMatches.set(match.id, match.summary);

                        broadcastToMatch(match.id, {
                            type: 'MATCH_FINISHED',
                            matchId: match.id,
                        });
                    }
                }
                break;

            case 'GET_MATCHES':
                const allMatches = Array.from(matches.values()).map(match => ({
                    ...match,
                    players: Array.from(match.players).map(([playerId]) => playerId),
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

            case 'GET_MATCH_SUMMARY':
                const summaryId = message.matchId || matchId;
                let summary = null;
                if (matches.get(summaryId)?.summary) {
                    summary = matches.get(summaryId).summary;
                } else if (finishedMatches.get(summaryId)) {
                    summary = finishedMatches.get(summaryId);
                }
                if (summary) {
                    socket.send(JSON.stringify({
                        type: 'MATCH_SUMMARY',
                        matchId: summaryId,
                        summary,
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
                    socket.send(JSON.stringify({type: 'MATCH_JOIN_FAILED', reason: 'Match not found or full'}));
                    break;
                }

                matchToJoin.players.set(id, createPlayer());
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
                        if (matchToLeave.finished && matchToLeave.summary) {
                            finishedMatches.set(matchToLeave.id, matchToLeave.summary);
                        }
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

            case "UPDATE_ANIMATION":
                if (match) {
                    const player = match.players.get(id);
                    player.animationAction = message.actionName;
                }
                break;
            case 'UPDATE_POSITION':
                if (match) {
                    const player = match.players.get(id);
                    player.position = message.position;
                    player.rotation = message.rotation;
                }
                break;

            case 'CAST_SPELL':
                if (match) {
                    const player = match.players.get(id);
                    const cost = SPELL_COST[message.payload?.type] || 0;
                    if (player && player.mana >= cost) {
                        player.mana -= cost;
                        if (message.payload.type === 'heal') {
                            player.hp = Math.min(100, player.hp + 20);
                        }

                        if (['fireball', 'iceball', 'shield'].includes(message.payload.type)) {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id,
                            }, id);
                        }

                        broadcastToMatch(match.id, {
                            type: 'UPDATE_STATS',
                            playerId: id,
                            hp: player.hp,
                            mana: player.mana,
                        });
                    }
                }
                break;

            case 'TAKE_DAMAGE':
                if (match) {
                    const victim = match.players.get(id);
                    if (victim) {
                        victim.hp = Math.max(0, victim.hp - Number(message.damage));
                        if (victim.hp <= 0) {
                        victim.deaths++;
                        const killer = match.players.get(message.damageDealerId);
                        if (killer) {
                            killer.kills++;
                            killer.points += 100;
                            broadcastToMatch(match.id, {
                                type: 'KILL',
                                killerId: message.damageDealerId,
                            });
                            if (killer.kills >= 15 && !match.finished) {
                                    match.finished = true;
                                    match.summary = Array.from(match.players.entries()).map(([pid, p]) => ({
                                        id: pid,
                                        kills: p.kills,
                                        deaths: p.deaths,
                                    }));
                                    finishedMatches.set(match.id, match.summary);
                                    broadcastToMatch(match.id, {
                                        type: 'MATCH_FINISHED',
                                        matchId: match.id,
                                    });
                                }
                            }
                        }

                        broadcastToMatch(match.id, {
                            type: 'UPDATE_STATS',
                            playerId: id,
                            hp: victim.hp,
                            mana: victim.mana,
                        });
                    }
                }
                break;

            case 'RESPAWN':
                if (match) {
                    const p = match.players.get(id);
                    if (p) {
                        p.hp = 100;
                        p.mana = 100;
                        broadcastToMatch(match.id, {
                            type: 'UPDATE_STATS',
                            playerId: id,
                            hp: p.hp,
                            mana: p.mana,
                        });
                    }
                }
                break;

            default:
                if (matchId) {
                    broadcastToMatch(matchId, {...message, fromId: id}, id);
                }
                break;
        }
    });

    socket.on('close', () => {
        console.log(`Client ${id} disconnected.`);
        clients.delete(id);

        clients.forEach(client => {
            client.send(JSON.stringify({type: 'removePlayer', id}));
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
                    if (match.finished && match.summary) {
                        finishedMatches.set(match.id, match.summary);
                    }
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
