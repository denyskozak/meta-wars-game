const WebSocket = require('ws');
const http = require('http');
// const { mintChest } = require('./sui.cjs');
// const { mintCoins, mintItemWithOptions } = require('./sui.cjs');
const { createProfile } = require('./sui.cjs');

const UPDATE_MATCH_INTERVAL = 33;
const MAX_HP = 156;
const MAX_MANA = 130;
const MAX_KILLS = 15;
const XP_PER_LEVEL = 1000;
const MANA_REGEN_INTERVAL = 1000;
const MANA_REGEN_AMOUNT = 1.3; // 30% faster mana regeneration
const HP_REGEN_AMOUNT = 0.4; // Basic health regeneration per tick (reduced)
const SPELL_COST = require('../client/next-js/consts/spellCosts.json');
const ICEBALL_ICON = '/icons/spell_frostbolt.jpg';
const FROSTNOVA_ICON = '/icons/frostnova.jpg';
const FREEDOM_ICON = '/icons/classes/paladin/sealofvalor.jpg';
const DIVINE_SPEED_ICON = '/icons/classes/paladin/speedoflight.jpg';
const COMBO_ICON = '/icons/classes/rogue/combo_point.jpg';
const ROGUE_SPRINT_ICON = '/icons/classes/rogue/sprint.jpg';
const CLASS_STATS = require('../client/next-js/consts/classStats.json');
const ADRENALINE_RUSH_ICON = '/icons/classes/rogue/adrenalinerush.jpg';
const RAGE_ICON = '/icons/classes/warrior/rage.jpg';
const {
    MELEE_RANGE,
    MELEE_ANGLE,
    withinMeleeRange,
    withinMeleeCone,
} = require('./melee.cjs');

const LIGHTSTRIKE_DAMAGE = 41; // increased by 20%
const BLADESTORM_DAMAGE = 10;

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
    {x: 14.069541342209435, y: -4.496255923961746, z: -15.24597910963735},
    {x: 12.627372560851052, y: -4.496254713453702, z: -19.724646637939752},
    {x: 3.4514372746656194, y: -4.527469163853706, z: -23.492432946194523},
    {x: 5.734421022642891, y: -4.527517258275438, z: -12.088083904027037},
    {x: -11.005143099682149, y: -4.367679262662545, z: -8.103794392465442},
    {x: 3.8971015935710946, y: -4.560733401419311, z: -8.969780906356851},
    {x: 9.156901981930222, y: -4.515065699135925, z: 2.2893488438398624},
    {x: 14.610843970587911, y: -4.496254713453704, z: -1.439554039602133},
];

const XP_RUNE_POSITIONS = [
    {x: 6.641290325990053, y: -4.2929196008886255, z: 5.460140150843531},
    {x: -4.185222755608383, y: -3.2177389700521974, z: 2.388888953482431},
    {x: -11.772502203060036, y: -3.9936772760377854, z: -4.03774228208717},
    {x: -6.194990853982758, y: -3.208653638124812, z: -20.594105133495024},
    {x: 11.267463817740426, y: -4.528864053822103, z: -24.318881576894807},
    {x: 17.175524805873927, y: -4.496254713453699, z: -12.943643247954828},
    {x: 1.7751431647156979, y: -3.0485667965691023, z: -12.733421116158379},
    {x: 8.196071278190033, y: -4.502004474371525, z: -8.556183800688014},
];

const SPAWN_POINTS = [
    {
        x: -13.97172642622196,
        y: -4.445570340186189,
        z: 4.960495148783773,
        yaw: 2.224073464102036,
    },
    {
        x: -15.520168499143402,
        y: -4.405270717710024,
        z: -11.267002742839068,
        yaw: 1.820073464102022,
    },
    {
        x: -0.4757279179235443,
        y: -4.404454717531691,
        z: -27.272987731684104,
        yaw: 0.04807346410201263,
    },
    {
        x: 17.67422587934487,
        y: -4.496254713493854,
        z: -21.12081591306549,
        yaw: -0.9851118430776166,
    },
    {
        x: 18.75963759003332,
        y: -4.510634838329724,
        z: -3.3056465085949385,
        yaw: -1.8651118430775842,
    },
    {
        x: 13.280582713405442,
        y: -4.405817236029593,
        z: 6.718118547747754,
        yaw: -2.7411118430775803,
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
const RANK_POINTS = {1: 10, 2: 7, 3: 5, 4: 2, 5: -4, 6: -6};

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
    return shuffle(XP_RUNE_POSITIONS).slice(0, 8).map((pos, idx) => ({
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

const CLASS_E_SKILL = {
    mage: 'fireball',
    warlock: 'darkball',
    paladin: 'lightstrike',
    rogue: 'blood-strike',
    warrior: 'savage-blow',
};

function createPlayer(address, classType, character) {
    const spawn = randomSpawnPoint();
    const charName = character || CLASS_MODELS[classType] || 'vampir';
    const stats = CLASS_STATS[classType] || { hp: MAX_HP, armor: 0, mana: MAX_MANA };
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
        damage: 0,
        assistants: {},
        points: 0,
        level: 1,
        skillPoints: 1,
        learnedSkills: CLASS_E_SKILL[classType] ? { [CLASS_E_SKILL[classType]]: true } : {},
        hp: stats.hp,
        maxHp: stats.hp,
        armor: stats.armor,
        maxArmor: stats.armor,
        mana: stats.mana || MAX_MANA,
        maxMana: stats.mana || MAX_MANA,
        comboPoints: classType === 'rogue' ? 0 : undefined,
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
    const deltas = {};
    sorted.forEach(([pid, p], idx) => {
        if (!p.address) return;
        const delta = RANK_POINTS[idx + 1] || 0;
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
        return {
            id: pid,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            damage: Math.floor(p.damage || 0),
            reward: rarity,
            coins,
            item,
            rankDelta: deltas[pid] || 0,
        };
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
                    player.hp = Math.min(player.maxHp, player.hp + 100);
                    break;
                case 'mana':
                    player.mana = Math.min(player.maxMana, player.mana + 100);
                    break;
                case 'damage':
                    player.buffs.push({
                        type: 'damage',
                        percent: 0.1,
                        expires: Date.now() + 15000,
                        icon: '/icons/rune_power.jpg'
                    });
                    break;
            }

            broadcastToMatch(match.id, {
                type: 'UPDATE_STATS',
                playerId,
                hp: player.hp,
                armor: player.armor,
                maxHp: player.maxHp,
                maxArmor: player.maxArmor,
                mana: player.mana,
                maxMana: player.maxMana,
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

            if (player.kills >= MAX_KILLS && !match.finished) {
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
            if ((buff.type === 'damage' || buff.type === 'rage') && (buff.expires === undefined || buff.expires > now)) {
                if (buff.type === 'rage') {
                    const stacks = buff.stacks || 0;
                    if (stacks > 0) {
                        totalDamage += totalDamage * 0.03 * stacks;
                    }
                } else if (typeof buff.percent === 'number') {
                    totalDamage += totalDamage * buff.percent;
                } else if (typeof buff.bonus === 'number') {
                    totalDamage += buff.bonus;
                }
            }
        });
    }

    if (attacker && dealerId !== victimId) {
        attacker.damage = (attacker.damage || 0) + totalDamage;
        victim.assistants = victim.assistants || {};
        victim.assistants[dealerId] = Date.now();
    }

    const reduction = victim.armor / 200; // 100 armor = 50% damage reduction
    totalDamage = totalDamage * Math.max(0, 1 - reduction);
    totalDamage = Math.round(totalDamage);
    victim.hp = Math.max(0, victim.hp - totalDamage);
    if (victim.hp <= 0) {
        victim.deaths++;
        victim.buffs = [];
        victim.debuffs = [];
        if (attacker) {
            attacker.kills++;
            attacker.points += 600;
            updateLevel(attacker);

            const now = Date.now();
            if (victim.assistants) {
                Object.entries(victim.assistants).forEach(([aid, ts]) => {
                    if (aid != dealerId && now - ts < 15000) {
                        const ap = match.players.get(Number(aid));
                        if (ap) ap.assists = (ap.assists || 0) + 1;
                    }
                });
            }
            victim.assistants = {};

            broadcastToMatch(match.id, {
                type: 'KILL',
                killerId: dealerId,
                victimId,
            });
            if (attacker.kills >= MAX_KILLS && !match.finished) {
                finalizeMatch(match);
            }
        }

        const spawn = randomSpawnPoint();
        victim.position = { ...spawn };
        victim.spawn_point = spawn;
        victim.rotation = { y: spawn.yaw || 0 };
        victim.hp = victim.maxHp;
        victim.armor = victim.maxArmor;
        victim.mana = victim.maxMana;
        victim.animationAction = 'idle';

        broadcastToMatch(match.id, {
            type: 'PLAYER_RESPAWN',
            playerId: victimId,
            position: spawn,
            rotation: { y: spawn.yaw || 0 },
        });
    }

    if (attacker && dealerId !== victimId && attacker.classType === 'warrior') {
        const now = Date.now();
        let rageBuff = attacker.buffs.find(b => b.type === 'rage');
        if (rageBuff && rageBuff.expires > now) {
            rageBuff.stacks = Math.min(5, (rageBuff.stacks || 0) + 1);
            rageBuff.expires = now + 5000;
        } else {
            attacker.buffs = attacker.buffs.filter(b => b.type !== 'rage');
            rageBuff = { type: 'rage', stacks: 1, expires: now + 5000, icon: RAGE_ICON };
            attacker.buffs.push(rageBuff);
        }
        broadcastToMatch(match.id, {
            type: 'UPDATE_STATS',
            playerId: dealerId,
            hp: attacker.hp,
            armor: attacker.armor,
            maxHp: attacker.maxHp,
            maxArmor: attacker.maxArmor,
            mana: attacker.mana,
            maxMana: attacker.maxMana,
            buffs: attacker.buffs,
            debuffs: attacker.debuffs,
        });
    }

    broadcastToMatch(match.id, {
        type: 'UPDATE_STATS',
        playerId: victimId,
        hp: victim.hp,
        armor: victim.armor,
        maxHp: victim.maxHp,
        maxArmor: victim.maxArmor,
        mana: victim.mana,
        maxMana: victim.maxMana,
        buffs: victim.buffs,
        debuffs: victim.debuffs,
    });

    broadcastToMatch(match.id, {
        type: 'DAMAGE',
        targetId: victimId,
        dealerId,
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
                if (player.mana < player.maxMana) {
                    player.mana = Math.min(player.maxMana, player.mana + MANA_REGEN_AMOUNT);
                }
                if (player.hp < player.maxHp) {
                    player.hp = Math.min(player.maxHp, player.hp + HP_REGEN_AMOUNT);
                }
                if (player.buffs.length) {
                    player.buffs = player.buffs.filter(b => {
                        if (b.type === 'bladestorm') {
                            if (b.nextTick !== undefined && b.nextTick <= now) {
                                b.nextTick = now + b.interval;
                                match.players.forEach((t, tid) => {
                                    if (tid !== pid && withinMeleeRange(player, t)) {
                                        applyDamage(match, tid, pid, BLADESTORM_DAMAGE, 'bladestorm');
                                    }
                                });
                            }
                        }
                        return b.expires === undefined || b.expires > now;
                    });
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
                            players: Array.from(match.players),
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

                    if (killerPlayer.kills >= MAX_KILLS && !match.finished) {
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

            case 'GET_RANK_POINTS':
                socket.send(JSON.stringify({
                    type: 'RANK_POINTS',
                    table: Object.entries(RANK_POINTS).map(([pos, pts]) => [Number(pos), pts]),
                }));
                break;

            case 'CREATE_PROFILE':
                if (message.address && message.nickname) {
                    createProfile(message.address, message.nickname)
                        .then(() => {
                            socket.send(JSON.stringify({
                                type: 'PROFILE_CREATED',
                                nickname: message.nickname,
                                success: true,
                            }));
                        })
                        .catch(err => {
                            console.error('createProfile failed:', err);
                            socket.send(JSON.stringify({
                                type: 'PROFILE_CREATED',
                                nickname: message.nickname,
                                success: false,
                            }));
                        });
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
                        if (player.buffs.some(b => b.type === 'bladestorm' && (b.expires === undefined || b.expires > Date.now()))) {
                            break;
                        }

                        player.mana -= cost;
                        if (message.payload.type === 'heal') {
                            player.hp = Math.min(player.maxHp, player.hp + 50);
                        }
                        if (message.payload.type === 'paladin-heal') {
                            player.hp = Math.min(player.maxHp, player.hp + 50);
                        }

                        if (['lifetap'].includes(message.payload.type)) {
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
                        if (message.payload.type === 'lifetap') {
                            player.hp = Math.max(0, player.hp - 30);
                            player.mana = Math.min(player.maxMana, player.mana + 30);
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
                        if (message.payload.type === 'blood-strike') {
                            const candidates = [];
                            match.players.forEach((p, tid) => {
                                if (tid === id) return;
                                if (withinMeleeCone(player, p)) {
                                    const dx = p.position.x - player.position.x;
                                    const dy = p.position.y - player.position.y;
                                    const dz = p.position.z - player.position.z;
                                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                                    candidates.push({ id: tid, player: p, dist });
                                }
                            });
                            candidates.sort((a, b) => a.dist - b.dist);
                            if (player.classType === 'rogue' && candidates.length) {
                                player.comboPoints = Math.min(5, (player.comboPoints || 0) + 1);
                                const comboBuff = player.buffs.find(b => b.type === 'combo');
                                if (comboBuff) comboBuff.stacks = player.comboPoints;
                                else player.buffs.push({ type: 'combo', stacks: player.comboPoints, icon: COMBO_ICON });
                            }
                            candidates.forEach(c => {
                                applyDamage(match, c.id, id, LIGHTSTRIKE_DAMAGE, 'blood-strike');
                            });
                        }
                        if (message.payload.type === 'savage-blow') {
                            match.players.forEach((p, tid) => {
                                if (tid === id) return;
                                if (withinMeleeCone(player, p)) {
                                    applyDamage(match, tid, id, LIGHTSTRIKE_DAMAGE, 'savage-blow');
                                }
                            });
                        }
                        if (message.payload.type === 'lightstrike') {
                            match.players.forEach((p, tid) => {
                                if (tid === id) return;
                                if (withinMeleeCone(player, p)) {
                                    applyDamage(match, tid, id, LIGHTSTRIKE_DAMAGE, 'lightstrike');
                                }
                            });
                        }
                        if (message.payload.type === 'eviscerate' && message.payload.targetId) {
                            const target = match.players.get(message.payload.targetId);
                            if (target && withinMeleeRange(player, target)) {
                                const base = 28;
                                const combo = player.comboPoints || 0;
                                const damage = base * Math.max(combo, 1);
                                applyDamage(match, target.id, id, damage, 'eviscerate');
                            }
                            if (target) {
                                player.comboPoints = 0;
                                player.buffs = player.buffs.filter(b => b.type !== 'combo');
                            }
                        }
                        if (message.payload.type === 'shadow-leap') {
                            player.comboPoints = Math.min(5, (player.comboPoints || 0) + 1);
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
                        if (message.payload.type === 'bladestorm') {
                            player.buffs.push({
                                type: 'bladestorm',
                                expires: Date.now() + 5000,
                                interval: 200,
                                nextTick: Date.now() + 200,
                                icon: '/icons/classes/warrior/bladestorm.jpg',
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
                                    caster.hp = Math.min(caster.maxHp, caster.hp + 30);
                                }

                            }

                            broadcastToMatch(match.id, {
                                type: 'UPDATE_STATS',
                                playerId: id,
                                hp: player.hp,
                                armor: player.armor,
                                maxHp: player.maxHp,
                                maxArmor: player.maxArmor,
                                mana: player.mana,
                                maxMana: player.maxMana,
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
                        p.hp = p.maxHp;
                        p.armor = p.maxArmor;
                        p.mana = p.maxMana;
                        p.buffs = [];
                        p.debuffs = [];
                        broadcastToMatch(match.id, {
                            type: 'UPDATE_STATS',
                            playerId: id,
                            hp: p.hp,
                            armor: p.armor,
                            maxHp: p.maxHp,
                            maxArmor: p.maxArmor,
                            mana: p.mana,
                            maxMana: p.maxMana,
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
