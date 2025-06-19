const WebSocket = require('ws');
const http = require('http');
// const { mintChest } = require('./sui.cjs');
// const { mintCoins, mintItemWithOptions } = require('./sui.cjs');

const UPDATE_MATCH_INTERVAL = 33;
const MAX_HP = 120;
const MAX_POINTS = 1000;
const MANA_REGEN_INTERVAL = 1000;
const MANA_REGEN_AMOUNT = 1.3; // 30% faster mana regeneration
const SPELL_COST = require('../client/next-js/consts/spellCosts.json');
const ICEBALL_ICON = '/icons/spell_frostbolt.jpg';

const RUNE_POSITIONS = [
    {x: -24.55270788467855, y: -2.2653316814013746, z: -29.33086680895419},
    {x: -39.66367142124273, y: -3.590078477015128, z: -25.267868274483295},
    {x: -48.90567952928931, y: 1.3142628316500475, z: -4.757407646665539},
    {x: -35.935269673262255, y: -0.9201681289833328, z: 17.958160345962828},
];

const XP_RUNE_POSITIONS = [
    {x: -36.33733552736014, y: 0.18650680579857343, z: -4.580323077732503},
    {x: -29.58349902197933, y: 0.6628864165173389, z: -10.369847037430544},
    {x: -25.167574279124512, y: 0.5165195417297067, z: -3.3432991165133714},
    {x: -18.493116647242555, y: 0.28728750460708025, z: -4.877113888695841},
    {x: -14.911321752520305, y: 0.41016146303941764, z: -13.070007161780007},
    {x: -20.1146804178187, y: 0.4105227742982425, z: -22.33716834753485},
    {x: -25.744417751903402, y: 1.0044804283178084, z: -23.458841928930575},
    {x: -29.964839430431045, y: 0.6108334494970779, z: -15.49109184571351},
    {x: -39.13481011432206, y: 0.7538530222210333, z: -11.053984725045723},
    {x: -45.89200741704895, y: 0.519306096834576, z: -9.178415243309109},
];

const SPAWN_POINTS = [
    {x: -31.533456476345865, y: -2.4026224958354563, z: -35.535650458003055},
    {x: -32.55407928341656, y: -1.5039584129780783, z: 1.1829651180292098},
    {x: -2.205966504124421, y: -1.908838848084411, z: 22.40594666056034},
    {x: 6.5351778915154854, y: -0.9536854349901706, z: -5.300264692341613},
    {x: -13.514131023893711, y: -2.425699580662904, z: -21.958818971727908},
    {x: -17.715590278500294, y: 1.1694729985423553, z: 21.91448639608614},
];

function randomSpawnPoint() {
    return SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
}

const RUNE_TYPES = ['damage', 'heal', 'mana'];

function randomRuneType() {
    return RUNE_TYPES[Math.floor(Math.random() * RUNE_TYPES.length)];
}

const REWARDS = {
    simple: {
        coinRange: [1, 3],
        items: [{ class: 'Warlock', skin: 'Vampir' }, { class: 'Shaman', skin: 'Vampir' }],
    },
    rare: {
        coinRange: [3, 6],
        items: [{ class: 'Warlock', skin: 'Vampir' }, { class: 'Shaman', skin: 'Vampir' }],
    },
    epic: {
        coinRange: [7, 9],
        items: [{ class: 'Warlock', skin: 'Vampir' }, { class: 'Shaman', skin: 'Vampir' }],
    },
};

const clients = new Map();
const playerMatchMap = new Map(); // playerId => matchId

const server = http.createServer();
const ws = new WebSocket.Server({server});

const matches = new Map(); // matchId => { id, players: Map, maxPlayers, isFull, finished, summary }
const finishedMatches = new Map(); // store summary of finished matches
let matchCounter = 1;

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateRunes(matchId) {
    return shuffle(RUNE_POSITIONS).slice(0, 6).map((pos, idx) => ({
        id: `rune_${matchId}_${Date.now()}_${idx}`,
        type: randomRuneType(),
        position: pos,
    }));
}

function generateXpRunes(matchId) {
    return shuffle(XP_RUNE_POSITIONS).slice(0, 4).map((pos, idx) => ({
        id: `xprune_${matchId}_${Date.now()}_${idx}`,
        type: 'xp',
        position: pos,
    }));
}

function createMatch({name, maxPlayers = 6, ownerId}) {
    const matchId = `match_${matchCounter++}`;
    const match = {
        id: matchId,
        name,
        status: 'waiting',
        players: new Map(),
        playersReady: 0,
        maxPlayers: Number(maxPlayers),
        isFull: false,
        finished: false,
        summary: null,
        runes: generateRunes(matchId),
        xpRunes: generateXpRunes(matchId),
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

function broadcastMatchesToWaitingClients() {
    const allMatches = Array.from(matches.values()).map(match => ({
        ...match,
        players: Array.from(match.players).map(([playerId]) => playerId),
    }));

    for (const [cid, client] of clients) {
        if (!playerMatchMap.has(cid)) {
            client.send(JSON.stringify({
                type: 'MATCH_LIST',
                matches: allMatches,
            }));
        }
    }
}

function createPlayer(address, classType) {
    const spawn = randomSpawnPoint();
    return {
        position: {...spawn},
        spawn_point: spawn,
        animationAction: 'idle',
        rotation: {y: 0},
        buffs: [],
        debuffs: [],
        kills: 0,
        deaths: 0,
        assists: 0,
        points: 0,
        hp: MAX_HP,
        mana: 100,
        chests: [],
        address,
        classType
    };
}

function finalizeMatch(match) {
    if (match.finished) return;
    match.finished = true;
    match.status = 'finished';
    const sorted = Array.from(match.players.entries()).sort((a, b) => b[1].kills - a[1].kills);
    match.summary = sorted.map(([pid, p], idx) => {
        let rarity = 'simple';
        if (idx === 0 || idx === 1) rarity = 'epic';
        else if (idx === 2 || idx === 3) rarity = 'rare';

        const range = REWARDS[rarity].coinRange;
        const coins = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];

        let item = null;
        if (Math.random() < 0.1) {
            const list = REWARDS[rarity].items;
            item = list[Math.floor(Math.random() * list.length)];
        }

        if (p.address) {
            // mintCoins(p.address, coins).catch(err => console.error('mintCoins failed', err));
            // if (item) {
            //     mintItemWithOptions(p.address, 'reward', item).catch(err => console.error('mintItem failed', err));
            // }
        }

        p.chests.push(rarity);
        return { id: pid, kills: p.kills, deaths: p.deaths, reward: rarity, coins, item };
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
                    player.hp = Math.min(MAX_HP, player.hp + 100);
                    break;
                case 'mana':
                    player.mana = Math.min(100, player.mana + 100);
                    break;
                case 'damage':
                    player.buffs.push({
                        type: 'damage',
                        percent: 0.4,
                        expires: Date.now() + 60000,
                        icon: '/icons/rune_power.jpg'
                    });
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

function checkXpRunePickup(match, playerId) {
    const player = match.players.get(playerId);
    if (!player) return;

    for (let i = 0; i < match.xpRunes.length; i++) {
        const rune = match.xpRunes[i];
        const dx = player.position.x - rune.position.x;
        const dy = player.position.y - rune.position.y;
        const dz = player.position.z - rune.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.5) {
            match.xpRunes.splice(i, 1);
            player.points += 50;

            broadcastToMatch(match.id, {
                type: 'RUNE_PICKED',
                playerId,
                runeId: rune.id,
                runeType: rune.type,
            });

            if (player.points >= MAX_POINTS && !match.finished) {
                finalizeMatch(match);
            }
            break;
        }
    }
}

function applyDamage(match, victimId, dealerId, damage, spellType) {
    const victim = match.players.get(victimId);
    if (!victim) return;
    const attacker = match.players.get(dealerId);
    let totalDamage = Number(damage);
    if (attacker && attacker.buffs.length) {
        const now = Date.now();
        attacker.buffs.forEach(buff => {
            if (buff.type === 'damage' && buff.expires > now) {
                if (typeof buff.percent === 'number') {
                    totalDamage += totalDamage * buff.percent;
                } else if (typeof buff.bonus === 'number') {
                    totalDamage += buff.bonus;
                }
            }
        });
    }

    victim.hp = Math.max(0, victim.hp - totalDamage);
    if (victim.hp <= 0) {
        victim.deaths++;
        victim.buffs = [];
        victim.debuffs = [];
        if (attacker) {
            attacker.kills++;
            attacker.points += 100;
            broadcastToMatch(match.id, {
                type: 'KILL',
                killerId: dealerId,
            });
            if (attacker.points >= MAX_POINTS && !match.finished) {
                finalizeMatch(match);
            }
        }

        const spawn = randomSpawnPoint();
        victim.position = { ...spawn };
        victim.spawn_point = spawn;
        victim.hp = MAX_HP;
        victim.mana = 100;
        victim.animationAction = 'idle';

        broadcastToMatch(match.id, {
            type: 'PLAYER_RESPAWN',
            playerId: victimId,
            position: spawn,
        });
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
        spellType,
    });
}

ws.on('connection', (socket) => {
    console.log('New client connected.');
    const id = Date.now();
    clients.set(id, socket);

    setInterval(() => {
        for (const [id, match] of matches) {
            if (match.status === 'on-going') {
                broadcastToMatch(id, {
                    type: 'UPDATE_MATCH',
                    ...match,
                    players: Object.fromEntries(match.players)
                });
            }

        }
    }, UPDATE_MATCH_INTERVAL);

    setInterval(() => {
        const now = Date.now();
        for (const match of matches.values()) {
            match.players.forEach((player, pid) => {
                if (player.mana < 100) {
                    player.mana = Math.min(100, player.mana + MANA_REGEN_AMOUNT);
                }
                if (player.buffs.length) {
                    player.buffs = player.buffs.filter(b => b.expires > now);
                }
                if (player.debuffs && player.debuffs.length) {
                    player.debuffs = player.debuffs.filter(deb => {
                        if (deb.nextTick !== undefined && deb.nextTick <= now) {
                            deb.nextTick = now + deb.interval;
                            applyDamage(match, pid, deb.casterId, deb.damage, deb.type);
                            deb.ticks--;
                        }

                        if (deb.ticks !== undefined) {
                            return deb.ticks > 0;
                        }

                        if (deb.expires !== undefined) {
                            return deb.expires > now;
                        }

                        return false;
                    });
                }
            });
        }
    }, MANA_REGEN_INTERVAL);

    setInterval(() => {
        for (const match of matches.values()) {
            match.runes = generateRunes(match.id);
            match.xpRunes = generateXpRunes(match.id);
        }
    }, 180000);

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
                        match.status = 'on-going';
                        const matchReadyMessage = {
                            type: 'MATCH_READY',
                            id: match.id,
                            players: Array.from(match.players).map(([id]) => {
                                return id;
                            }),
                        };
                        broadcastToMatch(match.id, matchReadyMessage);
                        match.players.forEach((p, pid) => {
                            broadcastToMatch(match.id, {
                                type: 'PLAYER_RESPAWN',
                                playerId: pid,
                                position: p.position,
                            });
                        });
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

                    if (killerPlayer.points >= MAX_POINTS && !match.finished) {
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
                broadcastMatchesToWaitingClients();
                break;

            case 'JOIN_MATCH':
                const matchToJoin = matches.get(message.matchId);
                if (!matchToJoin || matchToJoin.isFull) {
                    socket.send(JSON.stringify({type: 'MATCH_JOIN_FAILED', reason: 'Match not found or full'}));
                    break;
                }

                const newPlayer = createPlayer(message.address, message.classType || message.character?.name);
                matchToJoin.players.set(id, newPlayer);
                broadcastToMatch(matchToJoin.id, {
                    type: 'PLAYER_RESPAWN',
                    playerId: id,
                    position: newPlayer.position,
                });
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
                            xpRunes: matchToJoin.xpRunes,
                        }));
                    }
                });

                socket.send(JSON.stringify({
                    type: 'GET_MATCH',
                    match: {
                        ...matchToJoin,
                        players: Array.from(matchToJoin.players),
                    },
                }));
                broadcastMatchesToWaitingClients();
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

                    socket.send(JSON.stringify({
                        type: 'GET_MATCH',
                        match: {
                            ...matchToLeave,
                            players: Array.from(matchToLeave.players),
                        },
                    }));
                    broadcastMatchesToWaitingClients();
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
                    if (message) {
                        player.position = message.position;
                        player.rotation = message.rotation;
                    }
                    checkRunePickup(match, id);
                    checkXpRunePickup(match, id);
                }
                break;

            case 'CAST_SPELL':
                if (match) {
                    const player = match.players.get(id);
                    const cost = SPELL_COST[message.payload?.type] || 0;
                    if (player && player.mana >= cost) {

                        player.mana -= cost;
                        if (message.payload.type === 'heal') {
                            player.hp = Math.min(MAX_HP, player.hp + 50);
                        }

                        if (['immolate'].includes(message.payload.type)) {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id,
                            });
                        }
                        
                        if (['fireball', 'darkball', 'corruption', 'chaosbolt', 'iceball', 'shield', 'pyroblast', 'fireblast'].includes(message.payload.type)) {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id,
                            }, id);
                        }
                        if (message.payload.type === 'corruption' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target) {
                                target.debuffs = target.debuffs || [];
                                target.debuffs.push({
                                    type: 'corruption',
                                    casterId: id,
                                    damage: 8,
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
                                    damage: 10,
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
                    applyDamage(match, id, message.damageDealerId, message.damage, message.spellType);
                    if (message.spellType === 'iceball') {
                        const target = match.players.get(id);
                        if (target) {
                            target.debuffs = target.debuffs || [];
                            target.debuffs = target.debuffs.filter(d => d.type !== 'slow');
                            target.debuffs.push({
                                type: 'slow',
                                percent: 0.4,
                                expires: Date.now() + 3000,
                                icon: ICEBALL_ICON,
                            });
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: { type: 'iceball-hit', targetId: id },
                                id: message.damageDealerId,
                            });
                        }
                    }
                }
                break;

            case 'RESPAWN':
                if (match) {
                    const p = match.players.get(id);
                    if (p) {
                        p.hp = MAX_HP;
                        p.mana = 100;
                        p.buffs = [];
                        p.debuffs = [];
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
        broadcastMatchesToWaitingClients();
    });
});

server.listen(4000, () => {
    console.log('Secure WebSocket server is running');
});
