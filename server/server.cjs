const WebSocket = require('ws');
const http = require('http');
// const { mintChest } = require('./sui.cjs');
// const { mintCoins, mintItemWithOptions } = require('./sui.cjs');
// const { createProfile } = require('./sui.cjs');

// Basic CPU profiling using the Node.js inspector module
const inspector = require('inspector');
const fs = require('fs');

const profilerSession = new inspector.Session();
profilerSession.connect();
profilerSession.post('Profiler.enable', () => {
    profilerSession.post('Profiler.start');
    console.log('CPU profiling started');
});

process.on('SIGINT', () => {
    profilerSession.post('Profiler.stop', (err, { profile }) => {
        if (!err) {
            fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
            console.log('CPU profile saved to profile.cpuprofile');
        }
        process.exit();
    });
});

const UPDATE_MATCH_INTERVAL = 33;
const MAX_HP = 156;
const MAX_MANA = 130;
const MAX_KILLS = 15;
const XP_PER_LEVEL = 1000;
const MANA_REGEN_INTERVAL = 1000;
const MANA_REGEN_AMOUNT = 1.3; // 30% faster mana regeneration
// Health regeneration amount applied on each regen tick
// Reduced to slow down passive healing
const HP_REGEN_AMOUNT = 0.2;
const SPELL_COST = require('../client/next-js/consts/spellCosts.json');
const FIRE_RING_ICON = '/icons/frostnova.jpg';
const DIVINE_SPEED_ICON = '/icons/classes/paladin/speedoflight.jpg';
const COMBO_ICON = '/icons/classes/rogue/combo_point.jpg';
const ROGUE_SPRINT_ICON = '/icons/classes/rogue/sprint.jpg';
const CLASS_STATS = require('../client/next-js/consts/classStats.json');
const RAGE_ICON = '/icons/classes/warrior/rage.jpg';

// Simple in-memory storage for player profiles
const profiles = {};

const SPHERE_SPELLS = new Set([
    'fireball',
    'shadowbolt',
]);
const PROJECTILE_RADIUS = 0.35;
const PROJECTILE_MAX_DISTANCE = 10;
const PROJECTILE_UPDATE_INTERVAL = UPDATE_MATCH_INTERVAL;
const {
    MELEE_RANGE,
    withinMeleeRange,
    withinMeleeCone,
    withinCone,
} = require('./melee.cjs');

const LIGHTSTRIKE_DAMAGE = 41; // increased by 20%
const BLADESTORM_DAMAGE = 40;
const BLOOD_STRIKE_DAMAGE = 35; // 15% reduction
const BLOOD_STRIKE_RANGE = MELEE_RANGE * 0.8; // 20% smaller radius
const FIRE_BARRIER_ABSORB = 100;

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
    {x: 9.752463316479112, y: -4.568978734179747, z: -22.04852222353333},
    {x: 3.5166638514687065, y: -4.523174008331129, z: -22.83359032226165},
    {x: -2.8767569874195456, y: -4.525737739156335, z: -17.8681997237118},
    {x: -6.887849061964327, y: -4.212734365535802, z: -13.010297943131498},
    {x: 2.5069098558445604, y: -4.588343509467276, z: -7.309983586630549},
    {x: 0.14855758734695293, y: -4.241040554315638, z: 3.800712270533459},
    {x: 9.688744496209253, y: -4.3813798782856495, z: -0.8876568855751666},
    {x: 14.583123693070196, y: -4.435818925450814, z: -5.298779761185046},
    {x: 5.875943211023699, y: -4.537316879859603, z: -12.386335583076848},
    {x: 13.607070096578889, y: -4.448008859651101, z: -19.481599627689373},
];

const XP_RUNE_POSITIONS = [
    {x: -4.664625051228077, y: -4.657103374034273, z: -18.61502949658547},
    {x: -0.7547631202259506, y: -4.724822607345391, z: -15.125514325619852},
    {x: -4.181586836175412, y: -4.734886767074329, z: -0.49402029596131314},
    {x: -8.530329400309867, y: -4.547166906718689, z: 0.6046106936635873},
    {x: 4.967721949860355, y: -4.541785547481596, z: 1.749847132021338},
    {x: 8.975996094979743, y: -4.44707180952986, z: 3.408178693429249},
    {x: 12.058703109637804, y: -4.709000586013118, z: -10.910414657811739},
    {x: 11.867362140749306, y: -4.686908505072279, z: -14.74669375867096},
];

const SPAWN_POINTS = [
    {
        x: 3.0013719354747215,
        y: -2.451324372932303,
        z: 0.32692775645491895,
        yaw: 1.4032587712816127,
    },
    {
        x: -3.62699989249054,
        y: -2.7953789299780247,
        z: 7.900023479442847,
        yaw: 2.2852587712816197,
    },
    {
        x: -7.046607600025795,
        y: -2.6048787510211966,
        z: 14.34505672590721,
        yaw: -1.8299265358979697,
    },
    {
        x: 1.468051070777204,
        y: -2.0711704338035357,
        z: 18.163444418778752,
        yaw: -2.5459265358979652,
    },
    {
        x: -4.96445778805502,
        y: -2.6219820587166645,
        z: -8.559169211957045,
        yaw: -0.8379265358979877,
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
        projectiles: [],
        resorve: [], // players that can return to the match
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
    paladin: 'kayle',
    mage: 'brand',
    warlock: 'karthus',
    rogue: 'fizz',
    warrior: 'darius',
};

const CLASS_E_SKILL = {
    mage: 'fireball',
    warlock: 'shadowbolt',
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
        nickname: profiles[address]?.nickname || address,
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

    if (victim.buffs.length) {
        const now = Date.now();
        victim.buffs.forEach(buff => {
            if (buff.type === 'fire-barrier' && (buff.expires === undefined || buff.expires > now)) {
                const absorb = Math.min(buff.remaining || 0, totalDamage);
                totalDamage -= absorb;
                buff.remaining = (buff.remaining || 0) - absorb;
            }
        });
        victim.buffs = victim.buffs.filter(b => !(b.type === 'fire-barrier' && b.remaining <= 0));
    }

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
        for (const match of matches.values()) {
            if (!match.projectiles.length) continue;
            const remove = [];
            match.projectiles.forEach((p, idx) => {
                p.position.x += p.velocity.x * (PROJECTILE_UPDATE_INTERVAL / 1000);
                p.position.y += p.velocity.y * (PROJECTILE_UPDATE_INTERVAL / 1000);
                p.position.z += p.velocity.z * (PROJECTILE_UPDATE_INTERVAL / 1000);
                const dist = Math.sqrt(
                    (p.position.x - p.start.x) ** 2 +
                    (p.position.y - p.start.y) ** 2 +
                    (p.position.z - p.start.z) ** 2
                );
                if (dist > PROJECTILE_MAX_DISTANCE) {
                    remove.push(idx);
                    return;
                }
                for (const [pid, player] of match.players) {
                    if (pid === p.ownerId) continue;
                    const dx = player.position.x - p.position.x;
                    const dy = player.position.y - p.position.y;
                    const dz = player.position.z - p.position.z;
                    const d2 = dx * dx + dy * dy + dz * dz;
                    const r = PROJECTILE_RADIUS + 0.6;
                    if (d2 < r * r) {
                        applyDamage(match, pid, p.ownerId, p.damage, p.type);
                        if (p.type === 'fireball') {
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: {
                                    type: `${p.type}-hit`,
                                    targetId: pid,
                                    position: {
                                        x: p.position.x,
                                        y: p.position.y,
                                        z: p.position.z,
                                    },
                                },
                                id: p.ownerId,
                            });
                        }
                        remove.push(idx);
                        break;
                    }
                }
            });
            for (let i = remove.length - 1; i >= 0; i--) {
                match.projectiles.splice(remove[i], 1);
            }
        }
    }, PROJECTILE_UPDATE_INTERVAL);

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

            case 'GET_PROFILE':
                if (message.address) {
                    const profile = profiles[message.address] || null;
                    socket.send(JSON.stringify({
                        type: 'PROFILE',
                        address: message.address,
                        profile,
                    }));
                }
                break;

            case 'CREATE_PROFILE':
                if (message.address && message.nickname) {
                    profiles[message.address] = { nickname: message.nickname };
                    socket.send(JSON.stringify({
                        type: 'PROFILE_CREATED',
                        nickname: message.nickname,
                        success: true,
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

            case 'SET_CHARACTER':
                if (match) {
                    const players = match.players;
                    const myPlayer = players.get(id);
                    myPlayer.classType = message.classType;
                    myPlayer.character = message.character;
                    const stats = CLASS_STATS[message.classType] || { hp: MAX_HP, armor: 0, mana: MAX_MANA };
                    myPlayer.hp = stats.hp;
                    myPlayer.maxHp = stats.hp;
                    myPlayer.armor = stats.armor;
                    myPlayer.maxArmor = stats.armor;
                    myPlayer.mana = stats.mana || MAX_MANA;
                    myPlayer.maxMana = stats.mana || MAX_MANA;
                    if (CLASS_E_SKILL[message.classType]) {
                        myPlayer.learnedSkills = {
                            ...myPlayer.learnedSkills,
                            [CLASS_E_SKILL[message.classType]]: true,
                        };
                    }
                    socket.send(JSON.stringify({
                        type: 'CHARACTER_READY'
                    }))
                }


                break;
            case 'JOIN_MATCH':
                const matchToJoin = matches.get(message.matchId);
                if (!matchToJoin) {
                    socket.send(JSON.stringify({type: 'MATCH_JOIN_FAILED', reason: 'Match not found or full'}));
                    break;
                }

                let existingIdx = matchToJoin.resorve.findIndex(p => p.address === message.address);
                let joiningPlayer = null;
                if (existingIdx !== -1) {
                    joiningPlayer = matchToJoin.resorve.splice(existingIdx, 1)[0];
                } else {
                    if (matchToJoin.isFull) {
                        socket.send(JSON.stringify({type: 'MATCH_JOIN_FAILED', reason: 'Match not found or full'}));
                        break;
                    }
                    joiningPlayer = createPlayer(message.address, '', '');
                }

                matchToJoin.players.set(id, joiningPlayer);
                broadcastToMatch(matchToJoin.id, {
                    type: 'PLAYER_RESPAWN',
                    playerId: id,
                    position: joiningPlayer.position,
                    rotation: { y: joiningPlayer.rotation.y },
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

                socket.send(JSON.stringify({
                    type: 'ME_JOINED_MATCH',
                    matchId: message.matchId
                }));
                broadcastMatchesToWaitingClients();
                break;

            case 'LEAVE_MATCH':
                const matchToLeave = matches.get(message.matchId);
                if (matchToLeave) {
                    const leavingPlayer = matchToLeave.players.get(id);
                    if (leavingPlayer) {
                        matchToLeave.resorve.push(leavingPlayer);
                    }
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
                    broadcastToMatch(match.id, {
                        type: 'UPDATE_ANIMATION',
                        playerId: id,
                        actionName: message.actionName,
                    }, id);
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

                        if (SPHERE_SPELLS.has(message.payload.type)) {
                            const proj = {
                                id: `proj_${Date.now()}_${Math.random()}`,
                                position: { ...message.payload.position },
                                start: { ...message.payload.position },
                                velocity: { ...message.payload.velocity },
                                ownerId: id,
                                type: message.payload.type,
                                damage: message.payload.damage || 0,
                            };
                            match.projectiles.push(proj);
                            broadcastToMatch(match.id, {
                                type: 'CAST_SPELL',
                                payload: { ...message.payload, id: proj.id },
                                id,
                            }, id);
                        }

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


                        if (['corruption', 'lightstrike', 'stun', 'paladin-heal', 'firering', 'blink', 'divine-speed', 'lifedrain', 'blood-strike', 'eviscerate', 'kidney-strike', 'sprint', 'warbringer', 'savage-blow', 'hook', 'bladestorm', 'fire-barrier'].includes(message.payload.type)) {
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
                                    candidates.push({ id: tid, player: p });
                                }
                            });
                            if (player.classType === 'rogue' && candidates.length) {
                                player.comboPoints = Math.min(5, (player.comboPoints || 0) + 1);
                                const comboBuff = player.buffs.find(b => b.type === 'combo');
                                if (comboBuff) comboBuff.stacks = player.comboPoints;
                                else player.buffs.push({ type: 'combo', stacks: player.comboPoints, icon: COMBO_ICON });
                            }
                            candidates.forEach(c => {
                                applyDamage(match, c.id, id, BLOOD_STRIKE_DAMAGE, 'blood-strike');
                            });
                        }
                        if (message.payload.type === 'savage-blow') {
                            const hasRage = player.buffs?.some(b => b.type === 'rage' && (b.expires === undefined || b.expires > Date.now()));
                            const damage = hasRage ? LIGHTSTRIKE_DAMAGE * 1.3 : LIGHTSTRIKE_DAMAGE;
                            match.players.forEach((p, tid) => {
                                if (tid === id) return;
                                if (withinMeleeCone(player, p)) {
                                    applyDamage(match, tid, id, damage, 'savage-blow');
                                }
                            });
                        }
                        if (message.payload.type === 'hook') {
                            match.players.forEach((p, tid) => {
                                if (tid === id) return;
                                if (withinMeleeCone(player, p)) {
                                    const pos = { ...player.position };
                                    p.position = pos;
                                    p.debuffs = p.debuffs || [];
                                    p.debuffs.push({
                                        type: 'slow',
                                        expires: Date.now() + 3000,
                                        icon: '/icons/classes/warrior/hook.jpg',
                                    });
                                    broadcastToMatch(match.id, {
                                        type: 'PULL_PLAYER',
                                        playerId: tid,
                                        position: pos,
                                    });
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
                        if (message.payload.type === 'fire-barrier') {
                            player.buffs.push({
                                type: 'fire-barrier',
                                remaining: FIRE_BARRIER_ABSORB,
                                expires: Date.now() + 5000,
                                icon: FIRE_RING_ICON,
                            });
                        }
                        if (message.payload.type === 'eviscerate') {
                            const target = match.players.get(message.payload.targetId);
                            const base = 28;
                            const combo = player.comboPoints || 0;
                            const damage = base * (combo + 1);
                            match.players.forEach((p, tid) => {
                                if (tid === id) return;
                                if (withinMeleeCone(player, p)) {
                                    applyDamage(match, tid, id, damage, 'eviscerate');
                                }
                            });

                            player.comboPoints = 0;
                            player.buffs = player.buffs.filter(b => b.type !== 'combo');
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
                                interval: 1000,
                                nextTick: Date.now() + 1000,
                                icon: '/icons/classes/warrior/bladestorm.jpg',
                            });

                            socket.send(JSON.stringify({
                                type: 'CAST_SPELL',
                                payload: message.payload,
                                id
                            }))
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
                    if (SPHERE_SPELLS.has(message.spellType)) {
                        break;
                    }
                    applyDamage(match, id, message.damageDealerId, message.damage, message.spellType);
                    if (message.spellType === 'firering') {
                        const target = match.players.get(id);
                        if (target) {
                            // Currently no additional debuff for fire ring
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
                const leavingPlayer = match.players.get(id);
                if (leavingPlayer) {
                    match.resorve.push(leavingPlayer);
                }
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
