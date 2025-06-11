const WebSocket = require('ws');
const http = require('http');
const { mintChest } = require('./sui.cjs');

const UPDATE_MATCH_INTERVAL = 33;
const SPELL_COST = {
    'fireball': 25,
    'darkball': 25,
    'corruption': 30,
    'immolate': 30,
    'iceball': 25,
    'fireblast': 20,
    'conflagrate': 20,
    'shield': 80,
    'blink': 20,
    'heal': 30,
    'ice-veins': 40,
};

const RUNE_POSITIONS = [
    {x: -38.48709130964472, y: -0.23544278151646073, z: -12.245971700152356},
    {x: -29.946360662245386, y: -0.23544278151647133, z: -28.323764907977612},
    {x: -18.22565348371349, y: -0.2354427815116833, z: -19.057257365313095},
    {x: -16.390257065866678, y: -0.23544278154610798, z: -7.5338405970709985},
    {x: -36.73032129087861, y: -0.23544278144836425, z: 0.13186301070007891},
];

const RUNE_TYPES = ['damage', 'heal', 'mana'];

function randomRuneType() {
    return RUNE_TYPES[Math.floor(Math.random() * RUNE_TYPES.length)];
}

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
        runes: RUNE_POSITIONS.map((pos, idx) => ({
            id: `rune_${matchId}_${idx}`,
            type: randomRuneType(),
            position: pos,
        })),
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

function createPlayer(address) {
    return {
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        animationAction: '',
        rotation: {y: 0},
        buffs: [],
        debuffs: [],
        kills: 0,
        deaths: 0,
        assists: 0,
        points: 0,
        hp: 100,
        mana: 100,
        chests: [],
        address
    };
}

function finalizeMatch(match) {
    if (match.finished) return;
    match.finished = true;
    const sorted = Array.from(match.players.entries()).sort((a, b) => b[1].kills - a[1].kills);
    match.summary = sorted.map(([pid, p], idx) => {
        let chest = 'common';
        if (idx === 0) chest = 'epic';
        else if (idx === 1) chest = 'rare';
        p.chests.push(chest);
        if (p.address) {
            mintChest(p.address, chest).catch(err => console.error('mintChest failed', err));
        }
        return { id: pid, kills: p.kills, deaths: p.deaths, chest };
    });
    finishedMatches.set(match.id, match.summary);
    broadcastToMatch(match.id, {
        type: 'MATCH_FINISHED',
        matchId: match.id,
    });
}

function checkRunePickup(match, playerId) {
    const player = match.players.get(playerId);
    if (!player) return;

    for (let i = 0; i < match.runes.length; i++) {
        const rune = match.runes[i];
        const dx = player.position.x - rune.position.x;
        const dy = player.position.y - rune.position.y;
        const dz = player.position.z - rune.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.5) {
            match.runes.splice(i, 1);
            switch (rune.type) {
                case 'heal':
                    player.hp = Math.min(100, player.hp + 20);
                    break;
                case 'mana':
                    player.mana = Math.min(100, player.mana + 20);
                    break;
                case 'damage':
                    player.buffs.push({type: 'damage', bonus: 10, expires: Date.now() + 60000});
                    break;
            }

            broadcastToMatch(match.id, {
                type: 'UPDATE_STATS',
                playerId,
                hp: player.hp,
                mana: player.mana,
            });

            broadcastToMatch(match.id, {
                type: 'RUNE_PICKED',
                playerId,
                runeId: rune.id,
                runeType: rune.type,
            });
            break;
        }
    }
}

function applyDamage(match, victimId, dealerId, damage) {
    const victim = match.players.get(victimId);
    if (!victim) return;
    const attacker = match.players.get(dealerId);
    let totalDamage = Number(damage);
    if (attacker && attacker.buffs.length) {
        const now = Date.now();
        attacker.buffs.forEach(buff => {
            if (buff.type === 'damage' && buff.expires > now) {
                totalDamage += buff.bonus;
            }
        });
    }

    victim.hp = Math.max(0, victim.hp - totalDamage);
    if (victim.hp <= 0) {
        victim.deaths++;
        if (attacker) {
            attacker.kills++;
            attacker.points += 100;
            broadcastToMatch(match.id, {
                type: 'KILL',
                killerId: dealerId,
            });
            if (attacker.kills >= 15 && !match.finished) {
                finalizeMatch(match);
            }
        }
    }

    broadcastToMatch(match.id, {
        type: 'UPDATE_STATS',
        playerId: victimId,
        hp: victim.hp,
        mana: victim.mana,
    });

    broadcastToMatch(match.id, {
        type: 'DAMAGE',
        targetId: victimId,
        amount: totalDamage,
    });
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
        const now = Date.now();
        for (const match of matches.values()) {
            match.players.forEach((player, pid) => {
                if (player.mana < 100) {
                    player.mana = Math.min(100, player.mana + 5);
                }
                if (player.buffs.length) {
                    player.buffs = player.buffs.filter(b => b.expires > now);
                }
                if (player.debuffs && player.debuffs.length) {
                    player.debuffs = player.debuffs.filter(deb => {
                        if (deb.nextTick <= now) {
                            deb.nextTick = now + deb.interval;
                            applyDamage(match, pid, deb.casterId, deb.damage);
                            deb.ticks--;
                        }
                        return deb.ticks > 0;
                    });
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
                        finalizeMatch(match);
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

                matchToJoin.players.set(id, createPlayer(message.address));
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
                            runes: matchToJoin.runes,
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
                    checkRunePickup(match, id);
                }
                break;

            case 'CAST_SPELL':
                if (match) {
                    const player = match.players.get(id);
                    const cost = SPELL_COST[message.payload?.type] || 0;
                    if (player && player.mana >= cost) {
                        if (message.payload.type === 'conflagrate' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (!target || !Array.isArray(target.debuffs) || !target.debuffs.find(d => d.type === 'immolate')) {
                                break;
                            }
                        }

                        player.mana -= cost;
                        if (message.payload.type === 'heal') {
                            player.hp = Math.min(100, player.hp + 20);
                        }

                        if (['immolate'].includes(message.payload.type)) {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id,
                            });
                        }
                        
                        if (['fireball', 'darkball', 'corruption', 'conflagrate', 'iceball', 'shield', 'ice-veins', 'fireblast'].includes(message.payload.type)) {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id,
                            }, id);
                        }

                        if (message.payload.type === 'ice-veins') {
                            player.buffs.push({
                                type: 'ice-veins',
                                percent: 0.4,
                                expires: Date.now() + 15000,
                                icon: '/icons/spell_veins.jpg',
                            });
                        }
                        if (message.payload.type === 'corruption' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target) {
                                target.debuffs = target.debuffs || [];
                                target.debuffs.push({
                                    type: 'corruption',
                                    casterId: id,
                                    damage: 7,
                                    interval: 2000,
                                    nextTick: Date.now() + 2000,
                                    ticks: 5,
                                    icon: '/icons/spell_corruption.jpg',
                                });
                            }
                        }
                        if (message.payload.type === 'immolate' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target) {
                                target.debuffs = target.debuffs || [];
                                target.debuffs.push({
                                    type: 'immolate',
                                    casterId: id,
                                    damage: 7,
                                    interval: 1000,
                                    nextTick: Date.now() + 1000,
                                    ticks: 5,
                                    icon: '/icons/spell_immolation.jpg',
                                });
                            }
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
                    applyDamage(match, id, message.damageDealerId, message.damage);
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
