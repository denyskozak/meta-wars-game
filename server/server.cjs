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
const COMBO_ICON = '/icons/combo_point.jpg';
const ROGUE_SPRINT_ICON = '/icons/classes/rogue/sprint.jpg';
const ADRENALINE_RUSH_ICON = '/icons/classes/rogue/adrenalinerush.jpg';

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
    {x: -24.55270788467855, y: -2.2653316814013746, z: -29.33086680895419},
    {x: -39.66367142124273, y: -3.590078477015128, z: -25.267868274483295},
    {x: -48.90567952928931, y: 1.3142628316500475, z: -4.757407646665539},
    {x: -35.935269673262255, y: -0.9201681289833328, z: 17.958160345962828},
    {x: -51.74580125838502, y: 1.6693158257437584, z: -43.48305799953747},
    {x: -52.77988678180723, y: 0.9561725871391544, z: -19.019056260756873},
    {x: -15.906002067072242, y: -2.3330959231418595, z: -21.411684820666476},
    {x: -26.48075466996452, y: -1.777865573488649, z: -2.8313589521598326},
    {x: -32.80106167843453, y: 1.3084035240328742, z: -7.0988156766733645},
    {x: -34.33288863236902, y: -0.4213500678183642, z: -17.738746619320715},
    {x: -42.07720168470141, y: -0.3428705721983756, z: -46.776695072771986},
];

const XP_RUNE_POSITIONS = [
    {x: -35.70514170006643, y: 2.601446813843647, z: -5.212786347863764},
    {x: 8.133188781732617, y: -1.4916939381362184, z: -23.81247829211135},
    {x: -25.868706172895312, y: -1.527604189505654, z: -11.910345993703375},
    {x: -51.789088884915905, y: 2.6104882346551426, z: -14.986608160797829},
    {x: -51.35025944329837, y: 1.5372639946699047, z: -43.15540050157057},
    // lowered by ~1.5m to sit on the ground
    {x: -30.74329645409973, y: -1.1954629632710854, z: -28.155936814794597},
    {x: -8.102091312005948, y: -2.2004346239022534, z: -10.761102551832773},
    {x: -7.395922431633509, y: -2.1844077002400244, z: -13.274076270863635},
    {x: -4.822602429657976, y: -2.1920123877688074, z: -12.934166777612559},
    {x: -4.864900047668874, y: -2.1923052613878715, z: -10.289829406441832},
    {x: -8.06186942580486, y: -2.64518742830583, z: 7.850037991966927},
    {x: -40.97472234059998, y: -0.4912025450200873, z: 5.294724503857731},
    {x: -26.176594226478215, y: 0.20037900295975603, z: 25.591722359019432},
    {x: -11.222822353241419, y: -1.1602739502024886, z: 18.62337141869081},
];

const SPAWN_POINTS = [
    {
        x: -31.533456476345865,
        y: -2.4026224958354563,
        z: -35.535650458003055,
        yaw: 0.5780367320510054,
    },
    {
        x: -32.55407928341656,
        y: -1.5039584129780783,
        z: 1.1829651180292098,
        yaw: 1.338036732051006,
    },
    {
        x: -2.205966504124421,
        y: -1.908838848084411,
        z: 22.40594666056034,
        yaw: -2.80714857512864,
    },
    {
        x: 6.5351778915154854,
        y: -0.9536854349901706,
        z: -5.300264692341613,
        yaw: -1.8271485751285905,
    },
    {
        x: -13.514131023893711,
        y: -2.425699580662904,
        z: -21.958818971727908,
        yaw: -0.021148575128611173,
    },
    {
        x: -17.715590278500294,
        y: 1.1694729985423553,
        z: 21.91448639608614,
        yaw: -3.048333882308307,
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
                            if (target) {
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
                        if (message.payload.type === 'blood-strike') {
                            if (player.comboTarget && player.comboTarget !== message.payload.targetId) {
                                player.comboPoints = 0;
                                player.buffs = player.buffs.filter(b => b.type !== 'combo');
                            }
                            player.comboTarget = message.payload.targetId || player.comboTarget;
                            player.comboPoints = Math.min(5, (player.comboPoints || 0) + 1);
                            const comboBuff = player.buffs.find(b => b.type === 'combo');
                            if (comboBuff) comboBuff.stacks = player.comboPoints;
                            else player.buffs.push({ type: 'combo', stacks: player.comboPoints, icon: COMBO_ICON });
                        }
                        if (message.payload.type === 'eviscerate' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target) {
                                const damage = 28 * (player.comboPoints || 0);
                                if (damage > 0) {
                                    applyDamage(match, target.id, id, damage, 'eviscerate');
                                }
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
                            if (target) {
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
