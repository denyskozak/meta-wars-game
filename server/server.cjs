const WebSocket = require('ws');
const http = require('http');
// const { mintChest } = require('./sui.cjs');
// const { mintCoins, mintItemWithOptions } = require('./sui.cjs');
// const { createProfile } = require('./sui.cjs');

const UPDATE_MATCH_INTERVAL = 33;
const MAX_HP = 120;
const MAX_MANA = 130;
const MAX_POINTS = 10000;
const XP_PER_LEVEL = 1000;
const MANA_REGEN_INTERVAL = 1000;
const MANA_REGEN_AMOUNT = 1.3; // 30% faster mana regeneration
const SPELL_COST = require('../client/next-js/consts/spellCosts.json');
const ICEBALL_ICON = '/icons/spell_frostbolt.jpg';
const FROSTNOVA_ICON = '/icons/frostnova.jpg';
const FREEDOM_ICON = '/icons/classes/paladin/sealofvalor.jpg';
const DIVINE_SPEED_ICON = '/icons/classes/paladin/speedoflight.jpg';
const COMBO_ICON = '/icons/classes/rogue/combo_point.jpg';
const ROGUE_SPRINT_ICON = '/icons/classes/rogue/sprint.jpg';
const ADRENALINE_RUSH_ICON = '/icons/classes/rogue/adrenalinerush.jpg';
const MELEE_RANGE = 2.125;
const LIGHTSTRIKE_DAMAGE = 34;

function withinMeleeRange(a, b) {
    if (!a || !b) return false;
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dz = a.position.z - b.position.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz) < MELEE_RANGE;
}

function updateLevel(player) {
    const prevLevel = player.level || 1;
    const newLevel = Math.min(10, Math.floor(player.points / XP_PER_LEVEL) + 1);
    if (newLevel > prevLevel) {
        const gained = Math.min(newLevel, 6) - Math.min(prevLevel, 6);
        if (gained > 0) {
            player.skillPoints = (player.skillPoints || 0) + gained;
        }
    }
    player.level = newLevel;
}

const RUNE_POSITIONS = [
    {x: -1.4597803453135492, y: -4.559844840757203, z: -13.59277062790361},
    {x: 6.4458426357288054, y: -4.570099504987769, z: -14.21597456587476},
    {x: 8.06491923552833, y: -2.9063072814214195, z: 13.047559302135427},
    {x: 6.510563468150582, y: -4.531413194722514, z: 2.7380252681775947},
    {x: 13.257756553968076, y: -3.2336894874607567, z: -7.26236951354287},
    {x: -18.31781906841641, y: -3.9052870185466375, z: 2.1408892316725447},
];

const XP_RUNE_POSITIONS = [
    {x: -11.459228704449428, y: -4.251969766642084, z: -1.477733723831565},
    {x: 3.741877476990533, y: -4.138211703226955, z: 8.833025495925467},
    {x: 1.5510738423664265, y: -4.561222319245496, z: -7.323524148682044},
    {x: -10.067186483334332, y: -4.5227946753742785, z: -12.722234976858129},
];

const SPAWN_POINTS = [
    {
        x: 17.066471695733274,
        y: -4.550211311516363,
        z: -1.8073340929372943,
        yaw: -1.9327412287183703,
    },
    {
        x: 12.990784536413155,
        y: -4.359080290399882,
        z: 10.870314999467237,
        yaw: -2.2299265358979614,
    },
    {
        x: -2.974299001859103,
        y: -4.291511575255745,
        z: 14.115124791448363,
        yaw: 2.797258771281622,
    },
    {
        x: -14.561229709682143,
        y: -4.546747100747368,
        z: 9.69524664453089,
        yaw: 3.0112587712816223,
    },
    {
        x: -20.590902592005303,
        y: -4.380025266447042,
        z: -13.337443073613088,
        yaw: 0.8900734641020238,
    },
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
let rankings = {};

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateRunes(matchId) {
    return shuffle(RUNE_POSITIONS).map((pos, idx) => ({
        id: `rune_${matchId}_${Date.now()}_${idx}`,
        type: randomRuneType(),
        position: pos,
    }));
}

function generateXpRunes(matchId) {
    return shuffle(XP_RUNE_POSITIONS).slice(0, 6).map((pos, idx) => ({
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

const CLASS_MODELS = {
    paladin: 'bolvar',
    mage: 'vampir',
    warlock: 'vampir',
    rogue: 'vampir',
    warrior: 'bolvar',
};

function createPlayer(address, classType, character) {
    const spawn = randomSpawnPoint();
    const charName = character || CLASS_MODELS[classType] || 'vampir';
    return {
        position: {...spawn},
        spawn_point: spawn,
        animationAction: 'idle',
        rotation: {y: spawn.yaw || 0},
        buffs: [],
        debuffs: [],
        kills: 0,
        deaths: 0,
        assists: 0,
        points: 0,
        level: 1,
        skillPoints: 1,
        learnedSkills: {},
        hp: MAX_HP,
        mana: MAX_MANA,
        comboPoints: 0,
        comboTarget: null,
        chests: [],
        address,
        classType,
        character: charName,
    };
}

function finalizeMatch(match) {
    if (match.finished) return;
    match.finished = true;
    match.status = 'finished';
    const sorted = Array.from(match.players.entries()).sort((a, b) => b[1].kills - a[1].kills);
    // update rankings based on player positions
    const total = sorted.length;
    const deltas = {};
    sorted.forEach(([pid, p], idx) => {
        if (!p.address) return;
        let delta = 0;
        if (idx < 3) {
            delta = 3 - idx; // 1st:3, 2nd:2, 3rd:1
        } else if (idx >= total - 3) {
            const posFromEnd = total - 1 - idx;
            delta = -(3 - posFromEnd); // last: -3, etc
        }
        deltas[pid] = delta;
        rankings[p.address] = (rankings[p.address] || 0) + delta;
    });
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
        return { id: pid, kills: p.kills, deaths: p.deaths, reward: rarity, coins, item, rankDelta: deltas[pid] || 0 };
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
                    player.mana = Math.min(MAX_MANA, player.mana + 100);
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
                buffs: player.buffs,
                debuffs: player.debuffs,
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
            player.points += 500;
            updateLevel(player);

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
            if (buff.type === 'damage' && (buff.expires === undefined || buff.expires > now)) {
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
            attacker.points += 600;
            updateLevel(attacker);
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
        victim.rotation = { y: spawn.yaw || 0 };
        victim.hp = MAX_HP;
        victim.mana = MAX_MANA;
        victim.animationAction = 'idle';

        broadcastToMatch(match.id, {
            type: 'PLAYER_RESPAWN',
            playerId: victimId,
            position: spawn,
            rotation: { y: spawn.yaw || 0 },
        });
    }

    broadcastToMatch(match.id, {
        type: 'UPDATE_STATS',
        playerId: victimId,
        hp: victim.hp,
        mana: victim.mana,
        buffs: victim.buffs,
        debuffs: victim.debuffs,
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
                if (player.mana < MAX_MANA) {
                    player.mana = Math.min(MAX_MANA, player.mana + MANA_REGEN_AMOUNT);
                }
                if (player.buffs.length) {
                    player.buffs = player.buffs.filter(b => b.expires === undefined || b.expires > now);
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
    }, 90000);

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
                                rotation: { y: p.rotation?.y || p.position.yaw || 0 },
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
                    killerPlayer.points += 600;
                    updateLevel(killerPlayer);

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

            case 'GET_RANKINGS':
                const rankingList = Object.entries(rankings).sort((a, b) => b[1] - a[1]);
                socket.send(JSON.stringify({
                    type: 'RANKINGS',
                    rankings: rankingList,
                }));
                break;

            case 'CREATE_PROFILE':
                if (message.address && message.nickname) {
                    // createProfile(message.address, message.nickname);
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

                const char = typeof message.character === 'string' ? message.character : null;
                const newPlayer = createPlayer(message.address, message.classType, char);
                matchToJoin.players.set(id, newPlayer);
                broadcastToMatch(matchToJoin.id, {
                    type: 'PLAYER_RESPAWN',
                    playerId: id,
                    position: newPlayer.position,
                    rotation: { y: newPlayer.rotation.y },
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
                    if (message && player) {
                        player.position = message.position;
                        player.rotation = message.rotation;
                    }
                    checkRunePickup(match, id);
                    checkXpRunePickup(match, id);
                }
                break;

            case 'LEARN_SKILL':
                if (match) {
                    const player = match.players.get(id);
                    const skill = message.skillId;
                    if (player && skill && player.skillPoints > 0 && !player.learnedSkills[skill]) {
                        player.learnedSkills[skill] = true;
                        player.skillPoints -= 1;
                    }
                }
                break;

            case 'CAST_SPELL':
                if (match) {
                    const player = match.players.get(id);
                    const cost = SPELL_COST[message.payload?.type] || 0;
                    if (player && player.mana >= cost && player.learnedSkills && player.learnedSkills[message.payload?.type]) {

                        player.mana -= cost;
                        if (message.payload.type === 'heal') {
                            player.hp = Math.min(MAX_HP, player.hp + 50);
                        }
                        if (message.payload.type === 'paladin-heal') {
                            player.hp = Math.min(MAX_HP, player.hp + 50);
                        }

                        if (['immolate'].includes(message.payload.type)) {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id,
                            });
                        }


                        if (['fireball', 'darkball', 'corruption', 'chaosbolt', 'iceball', 'shield', 'pyroblast', 'fireblast', 'lightstrike', 'lightwave', 'stun', 'paladin-heal', 'frostnova', 'blink', 'hand-of-freedom', 'divine-speed', 'lifedrain', 'fear', 'blood-strike', 'eviscerate', 'kidney-strike', 'adrenaline-rush', 'sprint', 'shadow-leap', 'warbringer', 'savage-blow', 'hamstring', 'bladestorm', 'berserk', 'bloodthirst'].includes(message.payload.type)) {
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
                        if (message.payload.type === 'stun' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target && withinMeleeRange(player, target)) {
                                target.debuffs = target.debuffs || [];
                                target.debuffs.push({
                                    type: 'stun',
                                    expires: Date.now() + 3000,
                                    icon: '/icons/classes/paladin/sealofmight.jpg'
                                });
                            }
                        }

                        if (message.payload.type === 'hand-of-freedom') {
                            player.debuffs = player.debuffs?.filter(d => d.type !== 'slow' && d.type !== 'root') || [];
                            player.buffs.push({
                                type: 'freedom',
                                expires: Date.now() + 5000,
                                icon: FREEDOM_ICON,
                            });
                        }
                        if (message.payload.type === 'divine-speed') {
                            player.buffs.push({
                                type: 'speed',
                                expires: Date.now() + 5000,
                                icon: DIVINE_SPEED_ICON,
                            });

                        }
                        if (message.payload.type === 'blood-strike' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target && withinMeleeRange(player, target)) {
                                if (player.comboTarget && player.comboTarget !== message.payload.targetId) {
                                    player.comboPoints = 0;
                                    player.buffs = player.buffs.filter(b => b.type !== 'combo');
                                }
                                player.comboTarget = message.payload.targetId;
                                player.comboPoints = Math.min(5, (player.comboPoints || 0) + 1);
                                const comboBuff = player.buffs.find(b => b.type === 'combo');
                                if (comboBuff) comboBuff.stacks = player.comboPoints;
                                else player.buffs.push({ type: 'combo', stacks: player.comboPoints, icon: COMBO_ICON });
                                applyDamage(match, target.id, id, LIGHTSTRIKE_DAMAGE, 'blood-strike');
                            }
                        }
                        if (message.payload.type === 'eviscerate' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target && withinMeleeRange(player, target)) {
                                const damage = 28 * (player.comboPoints || 0);
                                if (damage > 0) {
                                    applyDamage(match, target.id, id, damage, 'eviscerate');
                                }
                            }
                            if (target) {
                                player.comboPoints = 0;
                                player.comboTarget = null;
                                player.buffs = player.buffs.filter(b => b.type !== 'combo');
                            }
                        }
                        if (message.payload.type === 'shadow-leap') {
                            player.comboPoints = Math.min(5, (player.comboPoints || 0) + 1);
                            player.comboTarget = message.payload.targetId || player.comboTarget;
                            const comboBuff = player.buffs.find(b => b.type === 'combo');
                            if (comboBuff) comboBuff.stacks = player.comboPoints;
                            else player.buffs.push({ type: 'combo', stacks: player.comboPoints, icon: COMBO_ICON });
                        }
                        if (message.payload.type === 'kidney-strike' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target && withinMeleeRange(player, target)) {
                                target.debuffs = target.debuffs || [];
                                const duration = 2000 + (player.comboPoints * 500);
                                target.debuffs.push({
                                    type: 'stun',
                                    expires: Date.now() + duration,
                                    icon: '/icons/classes/rogue/kidneyshot.jpg'
                                });
                                player.comboPoints = 0;
                                player.comboTarget = null;
                                player.buffs = player.buffs.filter(b => b.type !== 'combo');
                            }
                        }
                        if (message.payload.type === 'adrenaline-rush') {
                            player.buffs.push({
                                type: 'speed',
                                expires: Date.now() + 8000,
                                icon: ADRENALINE_RUSH_ICON,
                            });
                        }
                        if (message.payload.type === 'sprint') {
                            player.debuffs = player.debuffs?.filter(d => d.type !== 'slow' && d.type !== 'root') || [];
                            player.buffs.push({
                                type: 'speed',
                                expires: Date.now() + 6000,
                                icon: ROGUE_SPRINT_ICON,
                            });
                        
                        }
                        if (message.payload.type === 'fear' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target) {
                                target.debuffs = target.debuffs || [];
                                    target.debuffs.push({
                                        type: 'root',
                                        expires: Date.now() + 3000,
                                        icon: '/icons/classes/warlock/possession.jpg'
                                    });
                                }
                            }
                            if (message.payload.type === 'lifedrain' && message.payload.targetId) {
                                const target = match.players.get(message.payload.targetId);
                                const caster = match.players.get(id);
                                if (target && caster) {
                                    applyDamage(match, target.id, id, 30, 'lifedrain');
                                    caster.hp = Math.min(MAX_HP, caster.hp + 30);
                                }

                            }

                            broadcastToMatch(match.id, {
                                type: 'UPDATE_STATS',
                                playerId: id,
                                hp: player.hp,
                                mana: player.mana,
                                buffs: player.buffs,
                                debuffs: player.debuffs,
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
                    if (message.spellType === 'frostnova') {
                        const target = match.players.get(id);
                        if (target) {
                            target.debuffs = target.debuffs || [];
                            target.debuffs.push({
                                type: 'root',
                                expires: Date.now() + 3000,
                                icon: FROSTNOVA_ICON,
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
                        p.mana = MAX_MANA;
                        p.buffs = [];
                        p.debuffs = [];
                        broadcastToMatch(match.id, {
                            type: 'UPDATE_STATS',
                            playerId: id,
                            hp: p.hp,
                            mana: p.mana,
                            buffs: p.buffs,
                            debuffs: p.debuffs,
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
