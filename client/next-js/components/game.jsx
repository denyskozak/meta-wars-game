import React, {useLayoutEffect, useRef, useState, useEffect} from "react";
import gsap from "gsap";
import {
    MAX_HP,
    MAX_MANA,
    CLASS_MODELS,
    CLASS_STATS,
    SKIN_ANIMATIONS,
    MELEE_RANGE_ATTACK,
    MELEE_INDICATOR_RANGE,
    MELEE_ANGLE,
} from "../consts";
import { SPELL_COST, ASSET_BASE_URL } from '../consts';
import { assetUrl } from '../utilities/assets';
import * as THREE from "three";
import { Fire } from "../three/Fire";
import { createFireballMaterial } from "../three/FireballMaterial";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import Stats from "three/examples/jsm/libs/stats.module";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {Capsule} from "three/examples/jsm/math/Capsule";
import {CSS2DRenderer, CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {useRouter} from "next/navigation";
import {
    MeshBVH,
    MeshBVHHelper,
    StaticGeometryGenerator,
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree,
    CONTAINED,
    INTERSECTED,
    NOT_INTERSECTED,
} from 'three-mesh-bvh';
import {useCoins} from "../hooks/useCoins";
import {useInterface} from "../context/inteface";
import {useWS} from "../hooks/useWS";
import {world} from "../worlds/main/data";

THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// spell implementations
import castFireball, { meta as fireballMeta } from '../skills/mage/fireball';
import castFireBarrier, { meta as fireBarrierMeta } from '../skills/mage/fireBarrier';

import castFireRing, { meta as fireRingMeta } from '../skills/mage/fireRing';
import castBlink, { meta as blinkMeta } from '../skills/mage/blink';
import castShadowbolt, { meta as shadowboltMeta } from '../skills/warlock/shadowbolt';
import castCorruption, { meta as corruptionMeta } from '../skills/warlock/corruption';
import castLifeTap, { meta as lifeTapMeta } from '../skills/warlock/lifeTap';
import castLifeDrain, { meta as lifeDrainMeta } from '../skills/warlock/lifeDrain';
import { meta as lightStrikeMeta } from '../skills/paladin/lightStrike';
import castStun, { meta as stunMeta } from '../skills/paladin/stun';
import castPaladinHeal, { meta as paladinHealMeta } from '../skills/paladin/heal';

import castDivineSpeed, { meta as divineSpeedMeta } from '../skills/paladin/divineSpeed';
import castBloodStrike, { meta as bloodStrikeMeta } from '../skills/rogue/bloodStrike';
import castEviscerate, { meta as eviscerateMeta } from '../skills/rogue/eviscerate';
import castKidneyStrike, { meta as kidneyStrikeMeta } from '../skills/rogue/kidneyStrike';
import castSprint, { meta as sprintMeta } from '../skills/rogue/sprint';
import castWarbringer, { meta as warbringerMeta } from '../skills/warrior/warbringer';
import { meta as savageBlowMeta } from '../skills/warrior/savageBlow';
import castHook, { meta as hookMeta } from '../skills/warrior/hook';
import castBladestorm, { meta as bladestormMeta } from '../skills/warrior/bladestorm';


import {Interface} from "@/components/layout/Interface";
import * as iceShieldMesh from "three/examples/jsm/utils/SkeletonUtils";
import { MatchLoading } from "@/components/match-loading";
import { Countdown } from "./parts/Countdown.jsx";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const SPELL_ICONS = {
    [fireballMeta.id]: fireballMeta.icon,
    [fireBarrierMeta.id]: fireBarrierMeta.icon,
    [shadowboltMeta.id]: shadowboltMeta.icon,
    [corruptionMeta.id]: corruptionMeta.icon,
    [lifeTapMeta.id]: lifeTapMeta.icon,
    [lifeDrainMeta.id]: lifeDrainMeta.icon,
    [lightStrikeMeta.id]: lightStrikeMeta.icon,
    [stunMeta.id]: stunMeta.icon,
    [paladinHealMeta.id]: paladinHealMeta.icon,
    [divineSpeedMeta.id]: divineSpeedMeta.icon,
    [bloodStrikeMeta.id]: bloodStrikeMeta.icon,
    [eviscerateMeta.id]: eviscerateMeta.icon,
    [kidneyStrikeMeta.id]: kidneyStrikeMeta.icon,
    [sprintMeta.id]: sprintMeta.icon,
    [warbringerMeta.id]: warbringerMeta.icon,
    [savageBlowMeta.id]: savageBlowMeta.icon,
    [hookMeta.id]: hookMeta.icon,
    [bladestormMeta.id]: bladestormMeta.icon,
    [fireRingMeta.id]: fireRingMeta.icon,
    [blinkMeta.id]: blinkMeta.icon,
};

const SPELL_META = {
    [fireballMeta.id]: fireballMeta,
    [fireBarrierMeta.id]: fireBarrierMeta,
    [shadowboltMeta.id]: shadowboltMeta,
    [corruptionMeta.id]: corruptionMeta,
    [lifeTapMeta.id]: lifeTapMeta,
    [lifeDrainMeta.id]: lifeDrainMeta,
    [lightStrikeMeta.id]: lightStrikeMeta,
    [stunMeta.id]: stunMeta,
    [paladinHealMeta.id]: paladinHealMeta,
    [divineSpeedMeta.id]: divineSpeedMeta,
    [bloodStrikeMeta.id]: bloodStrikeMeta,
    [eviscerateMeta.id]: eviscerateMeta,
    [kidneyStrikeMeta.id]: kidneyStrikeMeta,
    [sprintMeta.id]: sprintMeta,
    [warbringerMeta.id]: warbringerMeta,
    [savageBlowMeta.id]: savageBlowMeta,
    [hookMeta.id]: hookMeta,
    [bladestormMeta.id]: bladestormMeta,
    [fireRingMeta.id]: fireRingMeta,
    [blinkMeta.id]: blinkMeta,
};

const SPELL_SCALES = {
    // fireball enlarged for better visuals
    fireball: 0.5,
    shadowbolt: 0.5,
};

const USER_DEFAULT_POSITION = [
    -4.96445778805502, -2.6219820587166645, -8.559169211957045,
];

const spawns = [
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

const FLASHLIGHT_POINTS = [
    { position: { x: -5.1408368130489235, y: -4.4568565292403095, z: -2.979375995683337 } },
    { position: { x: -6.842160039213642, y: -4.3095398975062675, z: 1.7689433923809024 } },
    { position: { x: 5.103792710188843, y: -4.374560910167638, z: -0.5960711658921486 } },
    { position: { x: 13.842740098763008, y: -4.35683354101714, z: -0.1762214176925535 } },
    { position: { x: 13.30818642695792, y: -4.447945869504579, z: -3.0413979140347007 } },
    { position: { x: 14.16385225238336, y: -4.306117111315048, z: -6.919929447788394 } },
    { position: { x: 10.100726859124114, y: -4.532862355237318, z: -17.407155284417463 } },
    { position: { x: 2.584119581040061, y: -4.542257254786189, z: -23.051874939332993 } },
];

function getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error("Invalid array: must be a non-empty array.");
    }
    const randomIndex = Math.floor(Math.random() * array.length);

    return array[randomIndex];
}

function dispatchEvent(name = '', detail = {}) {
    window.dispatchEvent(new CustomEvent(name, {
        detail
    }))
}

export function Game({models, sounds, textures, matchId, character}) {
    const containerRef = useRef(null);
    const {refetch: refetchCoins} = useCoins();
    const {state, dispatch} = useInterface();
    const debuffsRef = useRef(state.debuffs);
    const menuVisibleRef = useRef(state.menuVisible);
    useEffect(() => {
        debuffsRef.current = state.debuffs;
    }, [state.debuffs]);
    useEffect(() => {
        menuVisibleRef.current = state.menuVisible;
    }, [state.menuVisible]);
    const {socket, sendToSocket} = useWS(matchId);
    const router = useRouter();
    const [isReadyToPlay, setIsReadyToPlay] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [playersInfo, setPlayersInfo] = useState([]);
    // scoreboard visibility and data managed via interface context
    const account = useCurrentAccount();
    const address = account?.address;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleMouseDown = (event) => {
            if (container.contains(event.target)) {
                container.requestPointerLock();
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    useLayoutEffect(() => {
        // Store other players
        const players = new Map();
        const runes = new Map();
        const xpRunes = new Map();
        const projectiles = new Map();
        const damageLabels = new Map();
        let myPlayerId = null;

        let controlsEnabled = false;
        let countdownInterval = null;

        const startCountdown = () => {
            controlsEnabled = false;
            setCountdown(5);
            let remaining = 5;
            countdownInterval = setInterval(() => {
                remaining -= 1;
                setCountdown(remaining);
                if (remaining <= 0) {
                    controlsEnabled = true;
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }
            }, 1000);
        };

        // Character Model and Animation Variables
        let camera;
        const animations = models["character_animations"];

        const baseStats = CLASS_STATS[character?.classType] || { hp: MAX_HP, armor: 0, mana: MAX_MANA };
        let hp = baseStats.hp,
            armor = baseStats.armor,
            maxHp = baseStats.hp,
            maxArmor = baseStats.armor,
            mana = baseStats.mana || MAX_MANA,
            maxMana = baseStats.mana || MAX_MANA,
            points = 0,
            level = 1,
            skillPoints = 1;
        let prevLevel = 1;
        let learnedSkills = {};
        let playerMixers = [];

        let meleeRangeIndicator = null;
        const MELEE_INDICATOR_OPACITY = 0.2; // transparency for the auto attack indicator
        const TARGET_INDICATOR_OPACITY = 0.4; // transparency for target highlight
        let targetIndicator = null;
        let highlightIndicator = null;
        let highlightedPlayerId = null;

        const createTargetIndicator = () => {
            const geometry = new THREE.RingGeometry(0.275, 0.35, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: TARGET_INDICATOR_OPACITY,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.05;
            return mesh;
        };

        const updateTargetIndicator = () => {
            if (targetIndicator) {
                targetIndicator.parent?.remove(targetIndicator);
                targetIndicator = null;
            }
            if (targetedPlayerId && players.has(targetedPlayerId)) {
                const player = players.get(targetedPlayerId).model;
                targetIndicator = createTargetIndicator();
                player.add(targetIndicator);
            }
        };

        const createHighlightIndicator = () => {
            const sprite = makeGlowSprite(0xff0000, 0.3);
            sprite.position.y = 2.3;
            return sprite;
        };

        const updateHighlightIndicator = () => {
            if (highlightIndicator) {
                highlightIndicator.parent?.remove(highlightIndicator);
                highlightIndicator = null;
            }
            if (highlightedPlayerId && players.has(highlightedPlayerId)) {
                const player = players.get(highlightedPlayerId).model;
                highlightIndicator = createHighlightIndicator();
                player.add(highlightIndicator);
            }
        };

        const createMeleeIndicator = () => {
            const geometry = new THREE.CircleGeometry(
                MELEE_INDICATOR_RANGE,
                32,
                Math.PI / 2 - MELEE_ANGLE / 2,
                MELEE_ANGLE,
            );
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: MELEE_INDICATOR_OPACITY,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = Math.PI / 2;
            mesh.position.y = 0.05;
            return mesh;
        };


        let movementSpeedModifier = 1; // Normal speed
        let speedBuffActive = false;

        const damageBar = document.getElementById("damage");
        const selfDamage = document.getElementById("selfDamage");
        let targetedPlayerId = null;

        // Developer panel helpers
        const devDraco = new DRACOLoader();
        devDraco.setDecoderPath('/libs/draco/');
        const devLoader = new GLTFLoader().setPath(assetUrl('/models/'));
        devLoader.setDRACOLoader(devDraco);
        devLoader.setMeshoptDecoder(MeshoptDecoder);
        let currentScale = 0.00665;

        const handleScaleChange = (e) => {
            currentScale = e.detail.scale;
            if (players.has(myPlayerId)) {
                const m = players.get(myPlayerId).model;
                m.scale.set(currentScale, currentScale, currentScale);
                if (meleeRangeIndicator) {
                    meleeRangeIndicator.scale.setScalar(1 / currentScale);
                }
            }
        };

        const handleModelChange = (e) => {
            const newModelName = e.detail.model;
            if (!newModelName) return;
            if (!players.has(myPlayerId)) return;
            if (!models[newModelName]) return;
            const playerData = players.get(myPlayerId);
            const oldModel = playerData.model;
            const base = models[newModelName];
            const defaultScale = base.userData?.scale ?? 0.00665;
            const newModel = base.clone();
            newModel.position.copy(oldModel.position);
            newModel.rotation.copy(oldModel.rotation);
            newModel.scale.set(defaultScale, defaultScale, defaultScale);
            currentScale = defaultScale;
            newModel.traverse((obj) => { if (obj.isMesh) obj.castShadow = true; });
            scene.remove(oldModel);
            scene.add(newModel);
            playerData.model = newModel;
            const cls = playerData.classType;
            const meleeAllowed = ['paladin', 'warrior', 'rogue'];
            if (meleeAllowed.includes(cls)) {
                if (!meleeRangeIndicator) {
                    meleeRangeIndicator = createMeleeIndicator();
                }
                newModel.add(meleeRangeIndicator);
                meleeRangeIndicator.scale.setScalar(1 / currentScale);
            } else if (meleeRangeIndicator) {
                meleeRangeIndicator.parent?.remove(meleeRangeIndicator);
                meleeRangeIndicator = null;
            }
            const anims = models[`${newModelName}_animations`] || animations;
            playerData.actions = buildActions(
                playerData.mixer,
                anims,
                newModelName,
            );
        };

        window.addEventListener('DEV_SCALE_CHANGE', handleScaleChange);
        window.addEventListener('DEV_MODEL_CHANGE', handleModelChange);

        const activeShields = new Map(); // key = playerId
        const activeHandEffects = new Map(); // key = playerId -> { effectKey: {left, right} }
        const activeDamageEffects = new Map(); // key = playerId -> effect mesh
        const activeImmolation = new Map(); // key = playerId -> effect mesh
        const activeStunEffects = new Map(); // key = playerId -> {group, timeout}
        const activeSlowEffects = new Map(); // key = playerId -> {mesh, timeout}
        const activeSprintTrails = new Map(); // key = playerId -> {mesh, start, duration, timeout}
        const activeBladestorms = new Map(); // key = playerId -> {start, duration, sound}
        const activeFireBarriers = new Map(); // key = playerId -> {mesh, start, duration}

        const glowTexture = (() => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 2
            );
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
            return new THREE.CanvasTexture(canvas);
        })();

        function makeGlowSprite(color = 0xffffff, size = 1) {
            const material = new THREE.SpriteMaterial({
                map: glowTexture,
                color,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(size, size, 1);
            sprite.renderOrder = 999;
            return sprite;
        }

        const projectileTexture = (() => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');

            const grad = ctx.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 2
            );
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.25, 'rgba(255,255,255,0.95)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
            grad.addColorStop(0.75, 'rgba(255,255,255,0.2)');

            grad.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            return new THREE.CanvasTexture(canvas);
        })();

        function makeProjectileSprite(color = 0xffffff, size = 1) {
            const material = new THREE.SpriteMaterial({
                map: projectileTexture,
                color,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(size, size, 1);
            sprite.renderOrder = 999;
            return sprite;
        }

        const starTexture = (() => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            const spikes = 5;
            const outerRadius = size / 2;
            const innerRadius = size / 4;
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(size / 2, size / 2 - outerRadius);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(
                    size / 2 + Math.cos(rot) * outerRadius,
                    size / 2 + Math.sin(rot) * outerRadius
                );
                rot += step;
                ctx.lineTo(
                    size / 2 + Math.cos(rot) * innerRadius,
                    size / 2 + Math.sin(rot) * innerRadius
                );
                rot += step;
            }
            ctx.lineTo(size / 2, size / 2 - outerRadius);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,0,1)';
            ctx.fill();
            return new THREE.CanvasTexture(canvas);
        })();

        const trailTexture = (() => {
            const width = 64;
            const height = 8;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, width, 0);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, 'rgba(255,255,255,0.8)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            return new THREE.CanvasTexture(canvas);
        })();

        function makeStarSprite(size = 0.5) {
            const material = new THREE.SpriteMaterial({
                map: starTexture,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(size, size, 1);
            sprite.renderOrder = 999;
            return sprite;
        }


        // Function to update the HP bar width
        function updateHPBar() {
            dispatchEvent('self-update', { hp, mana, armor, maxHp, maxArmor, maxMana, points, level, skillPoints, learnedSkills });
        }

        // Function to update the Mana bar width
        function updateManaBar() {
            dispatchEvent('self-update', { hp, mana, armor, maxHp, maxArmor, maxMana, points, level, skillPoints, learnedSkills });
        }

        function dispatchTargetUpdate() {
            updateTargetIndicator();
            if (!targetedPlayerId || !players.has(targetedPlayerId)) {
                dispatchEvent('target-update', null);
                return;
            }
            const p = players.get(targetedPlayerId);
            if (!p) {
                dispatchEvent('target-update', null);
                return;
            }
            dispatchEvent('target-update', {
                id: targetedPlayerId,
                hp: p.hp,
                maxHp: p.maxHp,
                armor: p.armor,
                maxArmor: p.maxArmor,
                mana: p.mana,
                maxMana: p.maxMana,
                address: p.address || `Player ${targetedPlayerId}`,
                classType: p.classType,
                buffs: p.buffs || [],
                debuffs: p.debuffs || [],
            });
        }

        // Function to handle damage and update health
        let takeDamage = (amount, userIdTouched, spellType = '') => {
            if (isShieldActive) {
                amount *= DAMAGE_REDUCTION; // Apply damage reduction
            }

            dispatch({
                type: "SEND_CHAT_MESSAGE",
                payload: `You got ${amount} damage!`,
            });

            sendToSocket({
                type: "TAKE_DAMAGE",
                damageDealerId: userIdTouched,
                damage: amount,
                spellType,
            });
        };

        const fireballGeometry = new THREE.SphereGeometry(0.13, 16, 16); // Огненный шар (30% больше)

        const fireTexture = textures.fire;
        fireTexture.wrapS = fireTexture.wrapT = THREE.RepeatWrapping;
        const perlinTexture = textures.noise;
        const sparkTexture = textures.sparkle;
        const fireballMaterial = createFireballMaterial(perlinTexture, sparkTexture);


        const fireballMesh = new THREE.Mesh(
            fireballGeometry,
            fireballMaterial
        );
        fireballMesh.scale.set(
            SPELL_SCALES.fireball,
            SPELL_SCALES.fireball,
            SPELL_SCALES.fireball,
        );


        const darkballFragmentShader = fireballMaterial.fragmentShader.replace(
            'gl_FragColor = vec4(col, alpha);',
            'gl_FragColor = vec4(col, min(1.0, alpha * 1.5));'
        );

        const darkballMaterial = new THREE.ShaderMaterial({
            transparent: false,
            depthWrite: true,
            blending: THREE.NormalBlending,
            uniforms: {
                time: {value: 0},
                coreCol: {value: new THREE.Color(0xb84dff)},
                flameCol: {value: new THREE.Color(0x220044)},
                fireTex: {value: fireTexture},
            },
            vertexShader: fireballMaterial.vertexShader,
            fragmentShader: darkballFragmentShader,
        });
        const shadowboltMesh = makeProjectileSprite(
            0x8a2be2,
            SPELL_SCALES.shadowbolt,
        );

        const chaosBoltMesh = makeProjectileSprite(
            0x8a2be2,
            SPELL_SCALES.chaosBolt,
        );



        const labelRenderer = new CSS2DRenderer();

        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = "absolute";
        labelRenderer.domElement.style.top = "0px";


        const clock = new THREE.Clock();

        const scene = new THREE.Scene();

        // Use preloaded environment texture
        const worldTexture = textures.world;
        worldTexture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = worldTexture;
        scene.background = worldTexture; // optional

        scene.fog = new THREE.Fog(0x88ccee, 0, 50);

        camera = new THREE.PerspectiveCamera(
            80,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        );
        camera.rotation.order = "YXZ";

        let globalSkillCooldown = false; // Tracks if the global cooldown is active
        let isCasting = false;
        const cooldownDuration = 700; // Cooldown duration in milliseconds
        const SKILL_COOLDOWNS = {
            fireball: 0,
            shadowbolt: 0,
            corruption: 10000,
            lifetap: 10000,
            'fire-barrier': 30000,
            lifedrain: 0,
            'ice-shield': 30000,
            blink: 10000,
            lightstrike: 2000,
            stun: 50000,
            'paladin-heal': 20000,
            firering: 15000,
            'divine-speed': 20000,
            'blood-strike': 1000,
            eviscerate: 10000,
            'kidney-strike': 15000,
            sprint: 20000,
            'warbringer': 10000,
            'savage-blow': 0,
            'hook': 10000,
            'bladestorm': 40000,
        };
        const skillCooldownTimers = {};

        function isSkillOnCooldown(skill) {
            return skillCooldownTimers[skill] && skillCooldownTimers[skill] > Date.now();
        }

        function startSkillCooldown(skill) {
            const duration = SKILL_COOLDOWNS[skill];
            if (duration && duration > 0) {
                dispatchEvent('skill-cooldown', {skill, duration});
                skillCooldownTimers[skill] = Date.now() + duration;
                setTimeout(() => delete skillCooldownTimers[skill], duration);
            }
        }

        // Function to activate the cooldown
        function activateGlobalCooldown() {
            globalSkillCooldown = true;
            setTimeout(() => {
                globalSkillCooldown = false; // Reset the cooldown after the duration
            }, cooldownDuration);
        }

        // Lighting setup
        // const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 2);
        // fillLight1.position.set(2, 20, 1);
        // scene.add(fillLight1);

        const light = new THREE.AmbientLight(0xffffff, 2);
        scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLight.position.set(5, 15, 7.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        //Set up shadow properties for the light
        directionalLight.shadow.mapSize.width = 512; // default
        directionalLight.shadow.mapSize.height = 512; // default
        directionalLight.shadow.camera.near = 0.5; // default
        directionalLight.shadow.camera.far = 500; // default

        // const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        // directionalLight.position.set(-5, 25, -1);
        // directionalLight.castShadow = true;
        // directionalLight.shadow.camera.near = 0.01;
        // directionalLight.shadow.camera.far = 500;
        // directionalLight.shadow.camera.right = 30;
        // directionalLight.shadow.camera.left = -30;
        // directionalLight.shadow.camera.top = 30;
        // directionalLight.shadow.camera.bottom = -30;
        // directionalLight.shadow.mapSize.width = 1024;
        // directionalLight.shadow.mapSize.height = 1024;
        // directionalLight.shadow.radius = 4;
        // directionalLight.shadow.bias = -0.00006;
        // scene.add(directionalLight);

        // const moonLight = new THREE.DirectionalLight(0x88aaff, 0.8);
        // moonLight.position.set(10, 20, -10);     // направление «луны»
        // moonLight.castShadow = true;             // тени от объектов
        // scene.add(moonLight);

        // const hemi = new THREE.HemisphereLight(0x111133, 0x000000, 0.6); // слабый «ночной» свет
        // scene.add(hemi);
        // const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        // scene.add(ambientLight);
        // add stationary point lights for debugging
        // FLASHLIGHT_POINTS.forEach((p) => {
        //     const light = new THREE.PointLight(0xffffff, 2, 20);
        //     light.position.set(p.position.x, p.position.y, p.position.z);
        //     light.castShadow = true;
        //     scene.add(light);
        // });

        const renderer = new THREE.WebGLRenderer({antialias: true});

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animate);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        function preloadMesh(mesh, color = 0xffaa33) {
            const temp = mesh.clone();
            temp.visible = false;
            const light = new THREE.PointLight(color, 2, 5);
            temp.add(light);
            scene.add(temp);
            renderer.compile(scene, camera);
            scene.remove(temp);
        }

        preloadMesh(fireballMesh, 0xffaa33);
        preloadMesh(shadowboltMesh, 0x8a2be2);
        preloadMesh(shadowboltMesh, 0x8a2be2);

        const stats = new Stats();

        stats.domElement.style.position = "absolute";
        stats.domElement.style.top = "0px";


        const GRAVITY = 20;


        const FIREBLAST_RANGE = 20;

        const FIREBALL_DAMAGE = 44; // increased by 10%
        const DARKBALL_DAMAGE = 33; // increased by 10%
        const LIFEDRAIN_DAMAGE = 30;
        const FIRE_RING_DAMAGE = 20;
        const FIRE_RING_RANGE = MELEE_RANGE_ATTACK * 2.5; // increased by 25%
        const FIRE_RING_DURATION = 500; // ms
        const KNOCKBACK_STRENGTH = 6;
        const LIGHTWAVE_RING_DURATION = 1000; // ms
        const LIGHTWAVE_RANGE = MELEE_RANGE_ATTACK;
        const LIGHTSTRIKE_DAMAGE = 35; // reduced by 15%
        const LIGHTWAVE_DAMAGE = 40;
        const STUN_SPIN_SPEED = 2;
        const FEAR_SPIN_SPEED = 1.5;
        const SLOW_SPIN_SPEED = 1;
        const TARGET_INDICATOR_ROT_SPEED = 2;
        const BLADESTORM_DAMAGE = 10;
        const EXPLOSION_DURATION = 300; // ms
        const PROJECTILE_TRAIL_DURATION = 400; // ms

        // Медленнее пускаем сферы как настоящие заклинания
        const MIN_SPHERE_IMPULSE = 3;
        const MAX_SPHERE_IMPULSE = 4;

        // Maximum distance any sphere can travel
        // Use FIREBLAST_RANGE for consistency
        const SPHERE_MAX_DISTANCE = FIREBLAST_RANGE / 2;

        // Tail effects removed for all sphere projectiles

        const STEPS_PER_FRAME = 30;


        const spheres = [];

        // for (let i = 0; i < NUM_SPHERES; i++) {
        //
        //     const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        //     sphere.castShadow = true;
        //     sphere.receiveShadow = true;
        //
        //     scene.add(sphere);
        //
        //     spheres.push({
        //         mesh: sphere,
        //         collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
        //         velocity: new THREE.Vector3()
        //     });
        //
        // }

        const worldOctree = {
            bvh: null,
            collider: null,
            fromGraphNode(node) {
                node.updateWorldMatrix(true, true);
                const geometries = [];
                node.traverse(child => {
                    if (child.isMesh) {
                        const geom = child.geometry.clone();
                        geom.applyMatrix4(child.matrixWorld);
                        geometries.push(geom);
                    }
                });
                const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
                merged.computeBoundsTree();
                this.bvh = merged.boundsTree;
                this.collider = new THREE.Mesh(merged);
                this.collider.visible = false;
            },
            rayIntersect(ray) {
                if (!this.bvh) return false;
                const hit = this.bvh.raycastFirst(ray);
                if (hit) {
                    return { distance: hit.distance, point: hit.point };
                }
                return false;
            },
            capsuleIntersect(capsule) {
                if (!this.bvh) return false;
                const start = capsule.start.clone();
                const tempBox = new THREE.Box3();
                const tempSegment = new THREE.Line3();
                const tempVector = new THREE.Vector3();
                const tempVector2 = new THREE.Vector3();

                tempSegment.copy(capsule);
                tempBox.makeEmpty();
                tempBox.expandByPoint(tempSegment.start);
                tempBox.expandByPoint(tempSegment.end);
                tempBox.min.addScalar(-capsule.radius);
                tempBox.max.addScalar(capsule.radius);

                this.bvh.shapecast({
                    intersectsBounds: box => (box.intersectsBox(tempBox) ? INTERSECTED : NOT_INTERSECTED),
                    intersectsTriangle: tri => {
                        const triPoint = tempVector;
                        const capsulePoint = tempVector2;
                        const dist = tri.closestPointToSegment(tempSegment, triPoint, capsulePoint);
                        if (dist < capsule.radius) {
                            const depth = capsule.radius - dist;
                            const dir = capsulePoint.sub(triPoint).normalize();
                            tempSegment.start.addScaledVector(dir, depth);
                            tempSegment.end.addScaledVector(dir, depth);
                        }
                    },
                });

                const deltaVector = tempSegment.start.clone().sub(start);
                const depth = deltaVector.length();
                if (!depth) return false;
                capsule.start.copy(tempSegment.start);
                capsule.end.copy(tempSegment.end);
                return { normal: deltaVector.normalize(), depth };
            },
            sphereIntersect(sphere) {
                if (!this.bvh) return false;
                const target = { point: new THREE.Vector3(), distance: Infinity };
                const hit = this.bvh.closestPointToPoint(sphere.center, target);
                if (hit && target.distance < sphere.radius) {
                    const normal = sphere.center.clone().sub(target.point).normalize();
                    const depth = sphere.radius - target.distance;
                    sphere.center.addScaledVector(normal, depth);
                    return { normal, depth };
                }
                return false;
            },
        };

        const playerCollider = new Capsule(
            new THREE.Vector3(0, 0.35, 10),
            new THREE.Vector3(0, 1, 10),
            0.35,
        );
        const playerVelocity = new THREE.Vector3();
        const playerDirection = new THREE.Vector3();

        let playerOnFloor = false;
        let mouseTime = 0;

        const keyStates = {};

        const vector1 = new THREE.Vector3();

        const BASE_SPHERE_RADIUS = 0.26;
        const SPHERE_RADIUS = BASE_SPHERE_RADIUS * SPELL_SCALES.fireball;
        const SPHERE_SPAWN_OFFSET = playerCollider.radius + SPHERE_RADIUS;

        // Set limits for the FOV
        const minFOV = 10;
        const maxFOV = 100;

        // Shield skill vars
        const SHIELD_MANA_COST = SPELL_COST['shield'];
        const SHIELD_DURATION = 3; // Shield duration in seconds
        const DAMAGE_REDUCTION = 0.5; // Reduces damage by 50%
        const PRIORITY_ACTIONS = ['attack', 'attack_360'];
        // Rotation speed for the damage rune effect attached to players
        const DAMAGE_EFFECT_ROT_SPEED = 0.2;
        const DAMAGE_EFFECT_MAP_SPEED = 0.05;
        // Activate shield
        let isShieldActive = false;
        let isChatActive = false;
        let isHealActive = false;
        const fireRings = [];
        const lightWaveRings = [];
        const projectileExplosions = [];
        const projectileTrails = [];

        // Crosshair elements
        const target = document.getElementById("target");
        const targetImage = document.getElementById("targetImage");
        let isFocused = false;
        let isCameraDragging = false;

        const AIM_BEAM_OPACITY = 0.5;
        const AIM_BEAM_LENGTH = SPHERE_MAX_DISTANCE * 1.5;
        const AIM_BEAM_RADIUS = 0.05;
        let aimBeam = null;

        function createAimBeam() {
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: AIM_BEAM_OPACITY,
                depthWrite: false,
            });
            const geometry = new THREE.CylinderGeometry(
                AIM_BEAM_RADIUS,
                AIM_BEAM_RADIUS,
                1,
                8
            );
            return new THREE.Mesh(geometry, material);
        }

        function showAimBeam() {
            if (aimBeam || isFocused) return;
            aimBeam = createAimBeam();
            scene.add(aimBeam);
            updateAimBeam();
        }

        function updateAimBeam() {
            if (!aimBeam) return;
            const dir = getAimDirection();
            const start = playerCollider.start
                .clone()
                .add(playerCollider.end)
                .multiplyScalar(0.5)
                .addScaledVector(dir, SPHERE_SPAWN_OFFSET);
            const end = start.clone().addScaledVector(dir, AIM_BEAM_LENGTH);
            const diff = end.clone().sub(start);
            const len = diff.length();
            aimBeam.position.copy(start).addScaledVector(diff, 0.5);
            aimBeam.scale.set(1, len, 1);
            aimBeam.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                diff.clone().normalize()
            );
        }

        function hideAimBeam() {
            if (!aimBeam) return;
            aimBeam.parent?.remove(aimBeam);
            aimBeam.geometry.dispose();
            aimBeam.material.dispose();
            aimBeam = null;
        }



        // Хвосты отключены

        function adjustFOV(delta) {
            camera.fov = THREE.MathUtils.clamp(camera.fov + delta, minFOV, maxFOV);

            camera.updateProjectionMatrix(); // Update the projection matrix after changing the FOV
        }

        // Define the offset from the model for default follow camera position
        const cameraTarget = new THREE.Object3D();

        scene.add(cameraTarget);

        // Variables for camera rotation control
        // Set initial yaw and pitch so the camera faces approximately
        // the same direction as the logged rotation
        let yaw = 1.30;       // default yaw angle in radians
        let pitch = -0.36;    // default pitch angle in radians
        // Speed in radians per second for keyboard based rotation
        const ROTATION_SPEED = 2.5;

        // const mouse = new THREE.Vector2(); // Normalized device coordinates
        // const raycaster = new THREE.Raycaster(); // To project cursor onto the scene

        // function createCursor() {
        //     const cursorGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small sphere
        //     const cursorMaterial = new THREE.MeshBasicMaterial({color: 0xff0000}); // Red color
        //     cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
        //     scene.add(cursor);
        // }

        function appendRenderer() {
            containerRef.current.appendChild(labelRenderer.domElement);
            containerRef.current.appendChild(renderer.domElement);
            containerRef.current.appendChild(stats.domElement);
        };

        function respawnPlayer(position) {
            hp = MAX_HP;
            updateHPBar();
            teleportTo(position);
        }

        // Function to update the camera position and rotation
        function updateCameraPosition() {
            const playerPosition = new THREE.Vector3();
            playerCollider.getCenter(playerPosition);

            const offset = new THREE.Vector3(
                Math.sin(yaw) * Math.cos(pitch),
                Math.sin(pitch),
                Math.cos(yaw) * Math.cos(pitch),
            ).multiplyScalar(2);

            const desiredPos = playerPosition.clone().add(offset);

            const ray = new THREE.Ray(playerPosition, offset.clone().normalize());
            const hit = worldOctree.rayIntersect(ray);

            if (hit && hit.distance < offset.length()) {
                camera.position.copy(ray.at(hit.distance - 0.1, new THREE.Vector3()));
            } else {
                camera.position.copy(desiredPos);
            }

            cameraTarget.position.copy(playerPosition);
            camera.lookAt(cameraTarget.position);
        }

        // Event listener for mouse wheel scroll (for zooming in and out)
        window.addEventListener("wheel", (event) => {
            const delta = event.deltaY * 0.05; // Sensitivity adjustment

            adjustFOV(delta);
        });

        let jumpBlocked = false;
        const chatInputElement = document.getElementById("chat-input");

        function handleKeyW() {
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) &&
                setAnimation(speedBuffActive ? "run" : "walk");
        }
        function handleKeyA() {
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) &&
                setAnimation(speedBuffActive ? "run" : "walk");
        }
        function handleKeyD() {
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) &&
                setAnimation(speedBuffActive ? "run" : "walk");
        }
        function handleKeyS() {
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) && setAnimation("idle");
        }
        function handleKeyE() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('shadowbolt');
            else if (className === 'paladin') castSpell('lightstrike');
            else if (className === 'rogue') castSpell('blood-strike');
            else if (className === 'warrior') castSpell('savage-blow');
            else castSpell('fireball');
        }
        function handleKeyR() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('corruption');
            else if (className === 'paladin') castSpell('stun');
            else if (className === 'rogue') castSpell('eviscerate');
            else if (className === 'warrior') castSpell('warbringer');
            else castSpell('fire-barrier');
        }
        function handleKeyF() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('lifedrain');
            else if (className === 'paladin') castSpell('divine-speed');
            else if (className === 'rogue') castSpell('kidney-strike');
            else if (className === 'warrior') castSpell('hook');
            else castSpell('blink');
        }
        function handleKeyJ() {
            const currentPosition = new THREE.Vector3();
            playerCollider.getCenter(currentPosition);
            console.log(
                `Player position: x=${currentPosition.x}, y=${currentPosition.y}, z=${currentPosition.z}`,
            );
            const lookDir = new THREE.Vector3();
            camera.getWorldDirection(lookDir);
            console.log(
                `Looking direction: x=${lookDir.x}, y=${lookDir.y}, z=${lookDir.z}`,
            );
        }
        function handleDanceStart() {
            const { mixer, actions } = players.get(myPlayerId);
            const actionName = 'dance';
            controlAction({
                action: actions[actionName],
                actionName,
                mixer,
                loop: THREE.LoopRepeat,
                fadeIn: 0.2,
                reset: true,
            });
        }
        function handleDanceStop() {
            setAnimation('idle');
        }
        function handleKeyT() {
            dispatch({type: 'SET_SCOREBOARD_VISIBLE', payload: true});
        }
        function handleKeyC() {
            dispatch({type: 'SET_STATS_VISIBLE', payload: true});
        }
        function handleSpace() {
            if (playerOnFloor && !jumpBlocked && !isActionRunning(PRIORITY_ACTIONS)) {
                jumpBlocked = true;
                const {mixer, actions} = players.get(myPlayerId);
                const actionName = 'jump';
                controlAction({
                    action: actions[actionName],
                    actionName,
                    mixer: mixer,
                    loop: THREE.LoopOnce,
                    fadeIn: 0.1,
                    reset: true,
                    clampWhenFinished: true,
                });
                setTimeout(() => {
                    playerVelocity.y = 6;
                }, 150);
            }
        }
        function handleKeyQ() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('lifetap');
            else if (className === 'paladin') castSpell('paladin-heal');
            else if (className === 'rogue') castSpell('sprint');
            else if (className === 'warrior') castSpell('bladestorm');
            else castSpell('firering');
        }
        function handleEscape() {
            dispatch({type: 'SET_MENU_VISIBLE', payload: !menuVisibleRef.current});
        }

        const keyDownHandlers = {
            KeyW: handleKeyW,
            KeyA: handleKeyA,
            KeyD: handleKeyD,
            KeyS: handleKeyS,
            KeyE: handleKeyE,
            KeyR: handleKeyR,
            KeyF: handleKeyF,
            KeyJ: handleKeyJ,
            KeyT: handleKeyT,
            KeyC: handleKeyC,
            Space: handleSpace,
            KeyQ: handleKeyQ,
        };

        const skillKeyCodes = new Set([
            'KeyE',
            'KeyR',
            'KeyF',
            'KeyQ',
        ]);

        document.addEventListener("keydown", (event) => {
            if (event.code === "Escape") {
                handleEscape();
                return;
            }
            if (event.altKey && event.code === "Digit3") {
                handleDanceStart();
                keyStates[event.code] = true;
                return;
            }
            if (event.code === "Enter") {
                if (!isChatActive) {
                    chatInputElement.focus();
                } else {
                    chatInputElement.blur();
                }
                isChatActive = !isChatActive;
            }

            if (isChatActive) return;

            if (!controlsEnabled || debuffsRef.current.some(d => d.type === 'stun') || menuVisibleRef.current) return;

            keyStates[event.code] = true;

            const handler = keyDownHandlers[event.code];
            if (handler) handler();
        });

        function handleKeyUpT() {
            dispatch({type: 'SET_SCOREBOARD_VISIBLE', payload: false});
        }
        function handleKeyUpC() {
            dispatch({type: 'SET_STATS_VISIBLE', payload: false});
        }
        function handleKeyUpSpace() {
            setTimeout(() => {
                jumpBlocked = false;
            }, 4000);
        }

        const keyUpHandlers = {
            KeyT: handleKeyUpT,
            KeyC: handleKeyUpC,
            Space: handleKeyUpSpace,
        };

        document.addEventListener("keyup", (event) => {
            if (isChatActive) return;

            if (!controlsEnabled || debuffsRef.current.some(d => d.type === 'stun') || menuVisibleRef.current) return;

            if (event.code === "Digit3" || event.code === "AltLeft" || event.code === "AltRight") {
                handleDanceStop();
            }

            keyStates[event.code] = false;

            const handler = keyUpHandlers[event.code];
            if (handler) handler();

            if (isCasting && skillKeyCodes.has(event.code)) {
                dispatchEvent('release-cast');
            }

            // // Check if no movement keys are active
            if (
                !isCasting &&
                !isActionRunning(PRIORITY_ACTIONS) &&
                !keyStates["KeyW"] &&
                !keyStates["KeyA"] &&
                !keyStates["KeyD"] &&
                !keyStates["KeyS"]
            ) {
                setAnimation("idle"); // Return to idle animation
            }
        });

        const handleRightClick = () => {
            isFocused = !isFocused;

            if (isFocused) {
                target.style.display = "block"; // Показываем перекрестие
                showModel(false);
            } else {
                target.style.display = "none"; // Показываем перекрестие
                showModel(true);
            }
            highlightCrosshair();
        };

        // handle mouse events
        document.addEventListener("mousedown", (event) => {
            if (!controlsEnabled || debuffsRef.current.some(d => d.type === 'stun')) return;

            if (event.button === 2) {
                handleRightClick();
            }

            if (event.button === 0) {
                if (!isFocused && document.pointerLockElement === containerRef.current) {
                    isCameraDragging = true;
                }
                const id = getTargetPlayer();
                if (id) {
                    targetedPlayerId = id;
                    dispatchTargetUpdate();
                } else {
                    targetedPlayerId = null;
                    dispatchTargetUpdate();
                }

                mouseTime = performance.now();

                sounds.background.volume = 0.1;
                sounds.background.play();
            }
        });

        document.addEventListener("mouseup", () => {
            isCameraDragging = false;
        });


        document.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Prevent the context menu from showing
        });

        document.body.addEventListener("mousemove", (event) => {
            const locked = document.pointerLockElement === containerRef.current;

            if (!isFocused && !locked) return;


            yaw -= event.movementX / 500;
            pitch = Math.max(
                -Math.PI / 2,
                Math.min(Math.PI / 2, pitch + event.movementY  / 500),
            );
        });
        // const renderCursor = () => {
        //     if (!model) return;
        //     raycaster.setFromCamera(mouse, camera);
        //
        //     const intersects = raycaster.intersectObjects(scene.children, true); // Intersect with all scene objects
        //     console.log('model ', model)
        //     if (intersects.length > 0) {
        //         const intersectionPoint = intersects[0].point; // Get the first intersection point
        //         cursor.position.copy(intersectionPoint); // Move the cursor to the intersection point
        //     }
        // }

        // Cursor
        // document.addEventListener('pointermove', (event) => {
        //     // Convert mouse position to normalized device coordinates (-1 to +1)
        //     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        //     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //     mouse.z = 1;
        //     console.log('mouse.x ', mouse.x)
        //     console.log(' mouse.y ',  mouse.y)
        //     // Use the raycaster to find where the mouse intersects the scene
        //     renderCursor();
        // });

        window.addEventListener("resize", onWindowResize);

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
        }



        function castHeal() {
            const HEAL_AMOUNT = 20; // Amount of HP restored
            const HEAL_MANA_COST = SPELL_COST['heal'];

            if (!isFocused) {
                handleRightClick();
            }

            if (globalSkillCooldown || isCasting || isSkillOnCooldown('heal')) {
                return;
            }

            // Check if enough mana is available
            if (mana < HEAL_MANA_COST) {
                console.log("Not enough mana to heal!");
                if (sounds.noMana) {
                    sounds.noMana.currentTime = 0;
                    sounds.noMana.volume = 0.5;
                    sounds.noMana.play();
                }

                return;
            }

            const onCastEnd = () => {
                const { mixer, actions } = players.get(myPlayerId);
                controlAction({
                    action: actions['castEnd'],
                    actionName: 'castEnd',
                    mixer,
                    loop: THREE.LoopOnce,
                    fadeIn: 0.1,
                    reset: true,
                    clampWhenFinished: true,
                });

                isCasting = false;
                movementSpeedModifier = 1;
                sounds.spellCast.pause();
                sounds.heal.volume = 0.5;
                sounds.heal.play();

                dispatch({
                    type: "SEND_CHAT_MESSAGE",
                    payload: `Got ${HEAL_AMOUNT} heal!`,
                });

                sendToSocket({
                    type: 'CAST_SPELL',
                    payload: {type: 'heal'}
                });
                isHealActive = true;
                setTimeout(() => (isHealActive = false), 700);
                activateGlobalCooldown(); // Activate global cooldown
                startSkillCooldown('heal');
            };

            isCasting = true;
            movementSpeedModifier = 0.3;
            sounds.spellCast.volume = 0.3;
            sounds.spellCast.play();
            dispatchEvent('start-cast', {duration: 2000, onEnd: onCastEnd, name: 'heal', icon: ''})
        }

       function getAimDirection() {
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);

           if (isFocused) {
               const cameraPos = camera.position.clone();
               const farPoint = cameraPos.clone().add(cameraDir.clone().multiplyScalar(1000));
               const start = playerCollider.start
                   .clone()
                   .add(playerCollider.end)
                   .multiplyScalar(0.5);
               return farPoint.sub(start).normalize();
           }

           // If not focused, shoot in the direction the model is facing
           const player = players.get(myPlayerId);
           if (player) {

               const lookVector = new THREE.Vector3(0, 0, 1);
               lookVector.applyQuaternion(player.model.quaternion);
               lookVector.normalize();
               return lookVector;
           }

           // Fallback to camera direction
           return cameraDir.normalize();
        }

        function hasLineOfSight(targetId) {
            if (!players.has(targetId)) return false;
            const origin = playerCollider.start
                .clone()
                .add(playerCollider.end)
                .multiplyScalar(0.5);
            const targetPos = players.get(targetId).model.position.clone();
            const dir = targetPos.clone().sub(origin).normalize();
            const ray = new THREE.Ray(origin, dir);
            const collision = worldOctree.rayIntersect(ray);
            if (collision && collision.distance < origin.distanceTo(targetPos)) {
                return false;
            }
            return true;
        }

        function getTargetPlayer() {
            const origin = playerCollider.start
                .clone()
                .add(playerCollider.end)
                .multiplyScalar(0.5);
            const dir = getAimDirection();

            const raycaster = new THREE.Raycaster(origin, dir, 0, FIREBLAST_RANGE);
            let closest = null;
            let minDist = Infinity;
            players.forEach((p, id) => {
                if (id === myPlayerId) return;
                const box = new THREE.Box3().setFromObject(p.model);
                const hit = raycaster.ray.intersectBox(box, new THREE.Vector3());
                if (hit) {
                    const dist = origin.distanceTo(hit);
                    if (dist < minDist && hasLineOfSight(id)) {
                        minDist = dist;
                        closest = id;
                    }
                }
            });
            return closest;
        }

        function highlightCrosshair() {
            if (!targetImage) return;

            if (!isFocused) {
                targetImage.classList.remove('targeted');
                targetImage.classList.add('not-targeted');
                return;
            }
            const id = getTargetPlayer();
            if (id && players.has(id) && hasLineOfSight(id)) {
                targetImage.classList.add('targeted');
                targetImage.classList.remove('not-targeted');
            } else {
                targetImage.classList.remove('targeted');
                targetImage.classList.add('not-targeted');
            }
        }


        function castSpell(spellType, playerId = myPlayerId) {
            if (!learnedSkills || !learnedSkills[spellType]) {
                return;
            }
            dispatchEvent('skill-use', { skill: spellType });
            const meta = SPELL_META[spellType];
            if (!isFocused && meta?.autoFocus !== false) {
                handleRightClick();
            }

            if (isSkillOnCooldown(spellType)) {
                if (sounds?.cooldown) {
                    sounds.cooldown.currentTime = 0;
                    sounds.cooldown.volume = 0.5;
                    sounds.cooldown.play();
                }
                return;
            }

            if (globalSkillCooldown || isCasting || isActionRunning(PRIORITY_ACTIONS)) {
                return;
            }
            switch (spellType) {
                case 'ice-shield':
                    castSpellImpl(
                        playerId,
                        80,
                        2000,
                        () => castShield(),
                        sounds.spellCast,
                        sounds.spellCast,
                        'ice-shield',
                        false
                    )
                    break;
                case "fireball":
                    castFireball({
                        playerId,
                        castSpellImpl,
                        igniteHands,
                        castSphere,
                        fireballMesh,
                        sounds,
                        damage: FIREBALL_DAMAGE,
                    });
                    break;
                case "shadowbolt":
                    igniteHands(myPlayerId, 1000);
                    castShadowbolt({
                        playerId,
                        castSpellImpl,
                        igniteHands: darkHands,
                        castSphere,
                        shadowboltMesh: shadowboltMesh,
                        sounds,
                        damage: DARKBALL_DAMAGE,
                    });
                    break;
                case "corruption":
                    castCorruption({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        getTargetPlayer,
                        dispatch,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    break;
                case "lifetap":
                    castLifeTap({
                        playerId,
                        castSpellImpl,
                        sendToSocket,
                        sounds,
                    });
                    break;
                case "lifedrain":
                    castLifeDrain({
                        playerId,
                        castSpellImpl,
                        mana,
                        getTargetPlayer,
                        dispatch,
                        sendToSocket,
                        sounds,
                    });
                    break;
                case "fire-barrier":
                    castFireBarrier({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    spawnFireBarrier(playerId);
                    break;
                case "firering":
                    castFireRing({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    spawnFireRing(playerId);
                    break;
                case "blink":
                    castBlink({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                        teleportTo,
                        playerCollider,
                        worldOctree,
                        camera,
                        FIREBLAST_RANGE,
                        rotationY: players.get(playerId)?.model.rotation.y,
                    });
                    break;
                case "lightstrike":
                    performLightStrike();
                    break;
                case "stun":
                    const target = castStun({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        getTargetPlayer,
                        dispatch,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    if (target) applyStunEffect(target, 3000);
                    break;
                case "divine-speed":
                    castDivineSpeed({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    applySpeedEffect(playerId, 5000, 2);
                    spawnSprintTrail(playerId, 5000);
                    break;
                case "paladin-heal":
                    castPaladinHeal({
                        playerId,
                        castSpellImpl,
                        mana,
                        sendToSocket,
                        sounds,
                    });
                    break;
                case "blood-strike":
                    castBloodStrike({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    break;
                case "eviscerate":
                    castEviscerate({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    break;
                case "kidney-strike":
                    const targetKidney = castKidneyStrike({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        getTargetPlayer,
                        dispatch,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    if (targetKidney) applyStunEffect(targetKidney, 2000);
                    break;
                case "sprint":
                    castSprint({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    applySpeedEffect(playerId, 4000, 2);
                    spawnSprintTrail(playerId, 4000);
                    break;
                case "warbringer":
                    castWarbringer({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                        teleportTo,
                        playerCollider,
                        worldOctree,
                        camera,
                        FIREBLAST_RANGE,
                        rotationY: players.get(playerId)?.model.rotation.y,
                    });
                    break;
                case "savage-blow":
                    performSavageBlow();
                    break;
                case "hook":
                    castHook({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    break;
                case "bladestorm":
                    castBladestorm({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    break;
            }
        }

        function castShield() {
            isShieldActive = true;

            sendToSocket({
                type: "CAST_SPELL",
                payload: {
                    type: "shield",
                },
            });

            setTimeout(() => {
                isShieldActive = false; // Deactivate shield
            }, SHIELD_DURATION * 1000);
        }

        function performLightStrike() {
            const playerData = players.get(myPlayerId);
            if (!playerData) return;
            const { mixer, actions } = playerData;


            lightSword(myPlayerId, 500);

            const attack = actions['attack'];
            const originalScale = attack.timeScale;
            attack.timeScale = originalScale * 0.6;

            controlAction({
                action: attack,
                actionName: 'attack',
                mixer,
                loop: THREE.LoopOnce,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
                onEnd: () => {
                    attack.timeScale = originalScale;
                    setAnimation('idle');
                },
            });

            sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightstrike' } });
            activateGlobalCooldown();
            startSkillCooldown('lightstrike');
        }

        function performSavageBlow() {
            const playerData = players.get(myPlayerId);
            if (!playerData) return;
            const { mixer, actions } = playerData;
            console.log("actions: ", actions);

            lightSword(myPlayerId, 500);

            const attack = actions['attack'];
            const originalScale = attack.timeScale;
            attack.timeScale = originalScale * 0.6;

            controlAction({
                action: attack,
                actionName: 'attack',
                mixer,
                loop: THREE.LoopOnce,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
                onEnd: () => {
                    attack.timeScale = originalScale;
                    setAnimation('idle');
                },
            });

            if (sounds.mortalStrike) {
                sounds.mortalStrike.currentTime = 0;
                sounds.mortalStrike.volume = 0.5;
                sounds.mortalStrike.play();
            }

            sendToSocket({ type: 'CAST_SPELL', payload: { type: 'savage-blow' } });
            activateGlobalCooldown();
            startSkillCooldown('savage-blow');
        }





        function castSphere(model, sphereMesh, type, damage) {
            sphereMesh.rotation.copy(model.rotation);

            if (sphereMesh instanceof Fire) {
                sphereMesh.lookAt(camera.position);
            }

            // Compute aim direction based on camera ray and player position
            const aimDir = getAimDirection();

            const initialPosition = playerCollider.start
                .clone()
                .add(playerCollider.end)
                .multiplyScalar(0.5)
                .addScaledVector(aimDir, SPHERE_SPAWN_OFFSET);

            // Calculate smoother impulse using cubic easing
            const chargeTime = Math.min(performance.now() - mouseTime, 1000); // Cap charge time to 1 second
            const chargeFactor = chargeTime / 1000; // Normalize to range [0, 1]
            const impulse = THREE.MathUtils.lerp(
                MIN_SPHERE_IMPULSE,
                MAX_SPHERE_IMPULSE,
                chargeFactor * chargeFactor * (3 - 2 * chargeFactor),
            ); // Smoothstep with more power

            const velocity = aimDir.clone().multiplyScalar(impulse);

            sendToSocket({
                type: "CAST_SPELL",
                payload: {
                    type,
                    damage,
                    position: {
                        x: initialPosition.x,
                        y: initialPosition.y,
                        z: initialPosition.z,
                    },
                    rotation: {
                        x: sphereMesh.rotation.x,
                        y: sphereMesh.rotation.y,
                        z: sphereMesh.rotation.z,
                    },
                    velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
                },
            });
        }

        function castSpellImpl(playerId, manaCost, duration, onUsage = () => {
        }, soundCast, soundCastEnd, spellType, instant = false) {
            if (globalSkillCooldown || isSkillOnCooldown(spellType)) {
                return;
            }

            if (mana < manaCost || isCasting) {
                if (mana < manaCost && sounds.noMana) {
                    sounds.noMana.currentTime = 0;
                    sounds.noMana.volume = 0.5;
                    sounds.noMana.play();
                }
                return; // Ensure the fireball model is loaded
            }
            const {mixer, actions} = players.get(myPlayerId)


            const execute = () => {
                soundCastEnd.volume = 0.5;
                soundCastEnd.play();

                if (players.has(playerId)) {
                    const { model } = players.get(playerId);
                    onUsage(model);
                }

                activateGlobalCooldown();
                startSkillCooldown(spellType);
            };

            if (instant) {
                execute();
                return;
            }

            const onCastEnd = () => {
                const { mixer, actions } = players.get(myPlayerId);
                controlAction({
                    action: actions['castEnd'],
                    actionName: 'castEnd',
                    mixer,
                    loop: THREE.LoopOnce,
                    fadeIn: 0.1,
                    reset: true,
                    clampWhenFinished: true,
                });

                soundCast.pause();
                isCasting = false;
                movementSpeedModifier = 1;
                hideAimBeam();
                execute();
            };

            isCasting = true;
            movementSpeedModifier = 0.3;
            showAimBeam();

            const actionName = 'casting';
            controlAction({
                action: actions[actionName],
                actionName,
                mixer: mixer,
                loop: THREE.LoopRepeat,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
            });
            soundCast.volume = 0.5;
            soundCast.play();
            dispatchEvent('start-cast', { duration, onEnd: onCastEnd, icon: SPELL_META[spellType]?.icon, name: spellType });
        }

        function playerCollisions(delta) {
            // Use a copy of the player collider so the BVH query can adjust it
            // without immediately modifying the original capsule.
            const tempCapsule = playerCollider.clone();
            const result = worldOctree.capsuleIntersect(tempCapsule);

            playerOnFloor = false;

            if (result) {
                const deltaVector = result.normal.clone().multiplyScalar(result.depth);

                // Determine if the player is on the ground based on the vertical
                // component of the collision offset compared to the velocity.
                playerOnFloor = deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25);

                const offset = Math.max(0.0, deltaVector.length() - 1e-5);
                deltaVector.normalize().multiplyScalar(offset);

                // Move the actual collider by the computed offset.
                playerCollider.translate(deltaVector);

                if (!playerOnFloor) {
                    playerVelocity.addScaledVector(deltaVector, -deltaVector.dot(playerVelocity));
                } else {
                    playerVelocity.set(0, 0, 0);
                }
            }
        }

        function updateMyPlayer(deltaTime) {
            let damping = Math.exp(-4 * deltaTime) - 1;

            if (!playerOnFloor) {
                playerVelocity.y -= GRAVITY * deltaTime;

                // small air resistance
                damping *= 0.1;
            }

            playerVelocity.addScaledVector(playerVelocity, damping);

            const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);

            playerCollider.translate(deltaPosition);

            playerCollisions(deltaTime);
            // camera.position.copy(playerCollider.end);
        }

        function playerSphereCollision(sphere, index) {
            const center = vector1
                .addVectors(playerCollider.start, playerCollider.end)
            ;

            const sphere_center = sphere.collider.center;

            const SHRINK = 0.6;
            // const r = playerCollider.radius + sphere.collider.radius;
            const r = (playerCollider.radius + sphere.collider.radius) * SHRINK;
            const r2 = r * r;

            // approximation: player = 3 spheres

            let touchedPlayer = false;
            let userIdTouched;

            for (const point of [playerCollider.start, playerCollider.end, center]) {
                const d2 = point.distanceToSquared(sphere_center);


                if (d2 < r2) {
                    userIdTouched = spheres[index]["ownerId"];
                    removeSphere(sphere, index)
                    touchedPlayer = true;
                    break;
                }
            }

            if (touchedPlayer) {
                // damage will be applied by the server
            }

            return touchedPlayer;
        }

        // function spheresCollisions() {
        //
        //     for (let i = 0, length = spheres.length; i < length; i++) {
        //
        //         const s1 = spheres[i];
        //
        //         for (let j = i + 1; j < length; j++) {
        //
        //             const s2 = spheres[j];
        //
        //             const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
        //             const r = s1.collider.radius + s2.collider.radius;
        //             const r2 = r * r;
        //
        //             if (d2 < r2) {
        //
        //                 const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
        //                 const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
        //                 const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
        //
        //                 s1.velocity.add(v2).sub(v1);
        //                 s2.velocity.add(v1).sub(v2);
        //
        //                 const d = (r - Math.sqrt(d2)) / 2;
        //
        //                 s1.collider.center.addScaledVector(normal, d);
        //                 s2.collider.center.addScaledVector(normal, -d);
        //
        //             }
        //
        //         }
        //
        //     }
        //
        // }

        const removeSphere = (sphere, index) => {
            scene.remove(sphere.mesh); // Remove the fireball from the scene
            spheres.splice(index, 1); // Remove it from the array
            sphere.mesh = null;
        };

        function updateSpheres(deltaTime) {
            const now = performance.now();

            for (let index = spheres.length - 1; index >= 0; index--) {
                const sphere = spheres[index];
                if (!sphere.mesh) continue;

                sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

                const result = worldOctree.sphereIntersect(sphere.collider);

                if (result) {
                    // Handle collision logic (e.g., explode fireball or bounce)
                    removeSphere(sphere, index);
                    continue;

                    // sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
                    // sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
                }

                // Check distance from initial position
                if (sphere.initialPosition) {
                    const traveledDistance = sphere.collider.center.distanceTo(
                        sphere.initialPosition,
                    );
                    if (traveledDistance > SPHERE_MAX_DISTANCE) {
                        removeSphere(sphere, index);
                        continue;
                    }
                }

                if (playerSphereCollision(sphere, index)) {
                    continue;
                }

                // tails removed
            }

            // spheresCollisions(); // Handle collisions between spheres

           for (let sphere of spheres) {
                sphere.mesh?.position.copy(sphere.collider?.center); // TODO fix
                sphere.mesh?.children.forEach(c => {
                    if (c.isSprite && c.material?.rotation !== undefined) {
                        c.material.rotation += deltaTime * 5;
                    }
                });
            }
        }

        // function getForwardVector() {
        //
        //     camera.getWorldDirection(playerDirection);
        //     playerDirection.y = 0;
        //     playerDirection.normalize();
        //
        //     return playerDirection;
        //
        // }

        function getSideVector() {
            camera.getWorldDirection(playerDirection);
            playerDirection.y = 0;
            playerDirection.normalize();
            playerDirection.cross(camera.up);

            return playerDirection;
        }

        function controls(deltaTime) {
            if (isChatActive) return;
            if (!controlsEnabled || debuffsRef.current.some(d => d.type === 'stun')) return;
            const model = players.get(myPlayerId).model;
            // Adjust walking and running speed
            const baseWalkSpeed = 5.508; // Slowed base speed by 10%
            const speedDelta =
                deltaTime * (playerOnFloor ? baseWalkSpeed : 3.825) * movementSpeedModifier; // Apply speed modifier

            // Rotate the camera horizontally using A and D instead of strafing
            if (keyStates["KeyA"]) {
                playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
                if (!isAnyActionRunning()) setAnimation(speedBuffActive ? "run" : "walk");
            }

            if (keyStates["KeyD"]) {
                playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation(speedBuffActive ? "run" : "walk");
            }

            if (keyStates["KeyW"]) {
                let y = 0;

                if (document.pointerLockElement !== containerRef.current) {
                    y = model.rotation.y;
                } else {

                    if (!isCameraDragging) {
                        const cameraDirection = new THREE.Vector3();

                        camera.getWorldDirection(cameraDirection);

                        // Calculate the direction the player is moving (opposite to camera's forward)
                        y = Math.atan2(
                            cameraDirection.x,
                            cameraDirection.z,
                        );
                    } else {
                        const lookVector = new THREE.Vector3(0, 0, 1);
                        const player = players.get(myPlayerId);
                        if (player) {
                            lookVector.applyQuaternion(player.model.quaternion);
                            lookVector.normalize();

                            y = Math.atan2(
                                lookVector.x,
                                lookVector.z,
                            );
                        }

                    }



                }


                const forwardVector = new THREE.Vector3(
                    Math.sin(y),
                    0,
                    Math.cos(y),
                );
                playerVelocity.add(forwardVector.multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation(speedBuffActive ? "run" : "walk");
            }

            if (keyStates["KeyS"]) {
                const backwardVector = new THREE.Vector3(
                    -Math.sin(model.rotation.y),
                    0,
                    -Math.cos(model.rotation.y),
                );

                playerVelocity.add(backwardVector.multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation(speedBuffActive ? "run" : "walk");
            }
        }

        // Play or pause animations
        // function playPause() {
        //     actions.forEach(action => settings.play ? action.play() : action.stop());
        // }

        // Show or hide model with fade animation
        function showModel(visibility) {
            if (!players.has(myPlayerId)) return;
            const model = players.get(myPlayerId).model;
            const fadeDuration = 0.3;

            const applyToMaterials = (mesh, fn) => {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(fn);
                } else if (mesh.material) {
                    fn(mesh.material);
                }
            };

            if (visibility) {
                model.visible = true;
                model.traverse((obj) => {
                    if (obj.isMesh) {
                        applyToMaterials(obj, (mat) => {
                            gsap.killTweensOf(mat);
                            mat.transparent = true;
                            mat.opacity = 0;
                            const targetOpacity =
                                meleeRangeIndicator && obj === meleeRangeIndicator
                                    ? MELEE_INDICATOR_OPACITY
                                    : 1;
                            gsap.to(mat, {
                                opacity: targetOpacity,
                                duration: fadeDuration,
                                overwrite: true,
                            });
                        });
                    }
                });
            } else {
                model.traverse((obj) => {
                    if (obj.isMesh) {
                        applyToMaterials(obj, (mat) => {
                            gsap.killTweensOf(mat);
                            mat.transparent = true;
                            gsap.to(mat, {
                                opacity: 0,
                                duration: fadeDuration,
                                overwrite: true,
                            });
                        });
                    }
                });
                gsap.delayedCall(fadeDuration, () => {
                    model.visible = false;
                });
            }
        }


        function controlAction({
                                   action, // THREE.AnimationAction to control
                                   actionName = '', // THREE.AnimationAction to control
                                   mixer, // THREE.AnimationMixer for blending animations
                                   loop = THREE.LoopRepeat, // Loop mode: THREE.LoopOnce, THREE.LoopRepeat, etc.
                                   reset = true, // Whether to reset the action to the beginning
                                   fadeIn = 0.5, // Duration of fade-in (seconds)
                                   fadeOut = 0.5, // Duration of fade-out for current action
                                   clampWhenFinished = false, // Stop at the last frame if loop is THREE.LoopOnce
                                   onEnd = null, // Callback when the animation finishes (only for LoopOnce)
                               }) {

            console.log("action: ", action);
            console.log("mixer: ", mixer);
            if (!action || !mixer) {
                console.warn("Invalid action or mixer provided.");

                return;
            }

            // Check if the action is already playing
            if (action.isRunning()) {
                return; // Prevent double triggering
            }

            // Configure the action
            action.setLoop(loop);
            action.clampWhenFinished = clampWhenFinished;

            if (reset) {
                action.reset(); // Reset animation to the start
            }

            // Stop all other animations (optional, can be skipped for blending)
            mixer.stopAllAction();

            // Fade in the new action
            action.fadeIn(fadeIn).play();
            if (actionName) {
                sendToSocket({type: "UPDATE_ANIMATION", actionName, loop, fadeIn});
            }

            // Attach an event listener for when the animation ends
            if (loop === THREE.LoopOnce) {
                const onAnimationEnd = (event) => {
                    if (event.action === action) {
                        mixer.removeEventListener("finished", onAnimationEnd); // Clean up listener
                        if (onEnd) {
                            onEnd(event);
                        } else {
                            setAnimation("idle");
                        }
                    }
                };

                mixer.addEventListener("finished", onAnimationEnd);
            }
        }

        function setAnimation(actionName) {
            if (!players.get(myPlayerId)) return;
            const {mixer, actions} = players.get(myPlayerId);
            const action = actions[actionName];
            switch (actionName) {
                case "idle":
                    controlAction({action, actionName, mixer, fadeIn: 0.5});
                    break;
                case "walk":
                    controlAction({action, actionName, mixer, fadeIn: 0.2});
                    break;
                case "run":
                    controlAction({action, actionName, mixer, fadeIn: 0.2});
                    break;
            }
        }

        // 2
        const zone = models["zone"];

        scene.add(zone);
        worldOctree.fromGraphNode(zone);

        zone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material.map) {
                    child.material.map.anisotropy = 4;
                }
            }
        });

        const helper = new MeshBVHHelper(worldOctree.collider);

        helper.visible = false;
        scene.add(helper);

        // const gui = new GUI({width: 200});
        // gui.add({debug: false}, 'debug')
        //     .onChange(function (value) {
        //
        //         helper.visible = value;
        //
        //     });

        playerCollider.start.set(...USER_DEFAULT_POSITION);
        playerCollider.end.set(
            USER_DEFAULT_POSITION[0],
            USER_DEFAULT_POSITION[1] + 0.75,
            USER_DEFAULT_POSITION[2],
        );
        playerCollider.radius = 0.35;


        function isAnyActionRunning(excludeActions = []) {
            const {mixer, actions} = players.get(myPlayerId)

            if (!mixer) return false; // Ensure mixer exists

            return Object.values(actions).some(
                (action) => action && action.isRunning() && !excludeActions.includes(action),
            );
        }

        function isActionRunning(names) {
            const { actions } = players.get(myPlayerId);
            if (!actions) return false;
            const list = Array.isArray(names) ? names : [names];
            return list.some(name => actions[name] && actions[name].isRunning());
        }

        // settings = {
        //     'show model': true,
        //     'play': true,
        //     'deactivate all': deactivateAllActions,
        //     'activate all': activateAllActions,
        //     'modify time scale': 2.0
        // };
        //
        // const panel = new GUI({width: 310});
        // panel.add(settings, 'show model').onChange(showModel);
        // panel.add(settings, 'play').onChange(playPause);
        // panel.add(settings, 'deactivate all');
        // panel.add(settings, 'activate all');
        // panel.add(settings, 'modify time scale', 0.0, 3, 2).onChange(modifyTimeScale);

        // activateAllActions();

        function teleportTo(position) {
            // Validate input
            if (
                !position ||
                typeof position.x !== "number" ||
                typeof position.y !== "number" ||
                typeof position.z !== "number"
            ) {
                console.error("Invalid teleport position:", position);

                return;
            }

            // Update playerCollider position
            playerCollider.start.set(position.x, position.y, position.z);
            playerCollider.end.set(position.x, position.y + 0.75, position.z); // Keep the capsule height consistent

            // Update camera position to follow the player
            camera.position.set(position.x, position.y + 1.6, position.z); // Adjust for camera height
            const model = players.get(myPlayerId).model;
            // Update the model's position
            if (model) {
                // Adjust for model offset so it doesn't hover above ground
                model.position.set(position.x, position.y - 0.7, position.z);
                const rotY =
                    typeof position.yaw === "number"
                        ? position.yaw
                        : position.rotation?.y;
                if (typeof rotY === "number") {
                    // camera yaw is offset by PI relative to the model's
                    // facing direction, so adjust accordingly when
                    // teleporting to preserve the desired orientation
                    yaw = rotY - Math.PI;
                    pitch = 0;
                    model.rotation.y = rotY;
                }
            }

            console.log(
                `Player teleported to: x=${position.x}, y=${position.y}, z=${position.z}`,
            );
        }

        function teleportPlayerIfOob() {
            if (camera.position.y <= -25) {
                teleportTo(getRandomElement(spawns));
                camera.position.copy(playerCollider.end);
                camera.rotation.set(0, 0, 0);
            }
        }

        let healEffectModel;

        // Create a bubble-like shield
        const bubbleGeometry = new THREE.SphereGeometry(1.5, 32, 32); // Reduced segments for better performance
        const frostNormal = textures.ice.clone();
        frostNormal.wrapS = frostNormal.wrapT = THREE.RepeatWrapping;
        frostNormal.repeat.set(4, 4);                 // мелкий узор


        const bubbleMaterial = new THREE.MeshPhysicalMaterial({
            // базовый тон ­— чуть холоднее
            color: 0x62b8ff,      // ледяной голубой
            // прозрачность/преломление
            transparent: true,
            transmission: 1.0,           // «стекло» вместо простого alpha
            ior: 1.25,          // показатель преломления (вода ≈ 1.33)
            thickness: 0.35,          // толщина «стекла»
            attenuationColor: 0x62b8ff,      // цвет поглощения
            attenuationDistance: 1.5,
            opacity: 0.8,
            // глянец и блики
            roughness: 0.05,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            // тонкая радужная плёнка по краю (WebGPU + r156+, но работает и на r155+)
            iridescence: 0.5,
            iridescenceIOR: 1.1,
            sheen: 0.3,
            sheenColor: 0xc8f6ff,
            // нормали «иней»
            normalMap: frostNormal,
            normalScale: new THREE.Vector2(0.2, 0.2),
        });
        const bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubbleMesh.scale.set(0.3, 0.3, 0.3);
        scene.add(bubbleMesh);
        bubbleMesh.visible = false;

        function makeShieldMesh() {
            const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            mesh.scale.set(0.3, 0.3, 0.3);
            mesh.renderOrder = 999;          // чтобы просвечивал сквозь персонажа
            return mesh;
        }

        function applyHandEffect(playerId, effectKey, createMeshes, duration = 1000) {
            const effects = activeHandEffects.get(playerId) || {};
            const existing = effects[effectKey];
            if (existing) {
                existing.left.parent?.remove(existing.left);
                existing.right.parent?.remove(existing.right);
            }

            const player = players.get(playerId)?.model;
            if (!player) return;

            const leftHand = player.getObjectByName('mixamorigLeftHand');
            const rightHand = player.getObjectByName('mixamorigRightHand');
            if (!leftHand || !rightHand) return;

            const {left, right} = createMeshes();
            if (!left || !right) return;

            leftHand.add(left);
            rightHand.add(right);

            effects[effectKey] = {left, right};
            activeHandEffects.set(playerId, effects);

            setTimeout(() => {
                leftHand.remove(left);
                rightHand.remove(right);
                delete effects[effectKey];
                if (Object.keys(effects).length === 0) {
                    activeHandEffects.delete(playerId);
                }
            }, duration);
        }

        function igniteHands(playerId, duration = 1000) {
            applyHandEffect(playerId, 'fire', () => {
                const left = new THREE.Mesh(fireballGeometry, fireballMaterial.clone());
                const right = new THREE.Mesh(fireballGeometry, fireballMaterial.clone());
                left.scale.set(100, 100, 100);
                right.scale.set(100, 100, 100);
                return {left, right};
            }, duration);
        }

        function darkHands(playerId, duration = 1000) {
            applyHandEffect(playerId, 'shadow', () => {
                const left = new THREE.Mesh(fireballGeometry, darkballMaterial.clone());
                const right = new THREE.Mesh(fireballGeometry, darkballMaterial.clone());
                left.scale.set(100, 100, 100);
                right.scale.set(100, 100, 100);
                return {left, right};
            }, duration);
        }

        const activeSwordEffects = new Map();

        function lightSword(playerId, duration = 500) {
            const existing = activeSwordEffects.get(playerId);
            if (existing) {
                existing.parent?.remove(existing);
            }

            const player = players.get(playerId)?.model;
            if (!player) return;

            const hand = player.getObjectByName('mixamorigRightHand');
            if (!hand) return;

            const mesh = new THREE.Mesh(fireballGeometry, fireballMaterial.clone());
            mesh.scale.set(150, 150, 150);
            hand.add(mesh);
            activeSwordEffects.set(playerId, mesh);

            setTimeout(() => {
                hand.remove(mesh);
                activeSwordEffects.delete(playerId);
            }, duration);
        }


        function applyDamageRuneEffect(playerId, duration = 15000) {
            const existing = activeDamageEffects.get(playerId);
            if (existing) {
                existing.parent?.remove(existing);
            }

            const player = players.get(playerId)?.model;
            if (!player) return;

            const base = models['damage_effect'];
            if (!base) return;

            const effect = SkeletonUtils.clone(base);
            effect.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                }
            });

            player.add(effect);
            activeDamageEffects.set(playerId, effect);

            setTimeout(() => {
                effect.parent?.remove(effect);
                activeDamageEffects.delete(playerId);
            }, duration);
        }

        function applyImmolationEffect(playerId, duration = 5000) {
            const existing = activeImmolation.get(playerId);
            if (existing) {
                existing.parent?.remove(existing);
            }

            const player = players.get(playerId)?.model;
            if (!player) return;

            const effect = new THREE.Mesh(
                fireballGeometry,
                fireballMaterial.clone()
            );
            effect.scale.set(0.5, 0.5, 0.5);
            scene.add(effect);
            activeImmolation.set(playerId, effect);
            setTimeout(() => {
                effect.parent?.remove(effect);
                activeImmolation.delete(playerId);
            }, duration);
        }

        function applySlowEffect(playerId, duration = 3000, multiplier = 0.6) {
            if (playerId === myPlayerId) {
                if (freedomActive) return;
                movementSpeedModifier = multiplier;
                setTimeout(() => (movementSpeedModifier = 1), duration);
            }

            const existing = activeSlowEffects.get(playerId);
            if (existing) {
                existing.mesh.parent?.remove(existing.mesh);
                clearTimeout(existing.timeout);
            }

            const player = players.get(playerId)?.model;
            if (!player) return;

            const geometry = new THREE.RingGeometry(0.6, 0.8, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x88ddff,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            scene.add(mesh);

            const timeout = setTimeout(() => {
                mesh.parent?.remove(mesh);
                activeSlowEffects.delete(playerId);
            }, duration);

            activeSlowEffects.set(playerId, { mesh, timeout });
        }

        function applyRootEffect(playerId, duration = 3000) {
            if (playerId === myPlayerId) {
                if (freedomActive) return;
                movementSpeedModifier = 0;
                playerVelocity.x = 0;
                playerVelocity.z = 0;
                setTimeout(() => (movementSpeedModifier = 1), duration);
            }
        }

        let freedomActive = false;

        function applyFreedomEffect(playerId, duration = 5000) {
            if (playerId === myPlayerId) {
                freedomActive = true;
                movementSpeedModifier = 1;
                setTimeout(() => (freedomActive = false), duration);
            }
        }

        function applySpeedEffect(playerId, duration = 5000, multiplier = 1.4) {
            if (playerId === myPlayerId) {
                movementSpeedModifier = multiplier;
                speedBuffActive = true;
                setTimeout(() => {
                    movementSpeedModifier = 1;
                    speedBuffActive = false;
                }, duration);
            }
        }

        function applyStunEffect(playerId, duration = 3000) {
            const existing = activeStunEffects.get(playerId);
            if (existing) {
                existing.group.parent?.remove(existing.group);
                clearTimeout(existing.timeout);
            }

            const group = new THREE.Group();
            const count = 5;
            for (let i = 0; i < count; i++) {
                const sprite = makeStarSprite(0.4);
                const angle = (i / count) * Math.PI * 2;
                sprite.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
                group.add(sprite);
            }

            scene.add(group);

            const timeout = setTimeout(() => {
                group.parent?.remove(group);
                activeStunEffects.delete(playerId);
            }, duration);

            activeStunEffects.set(playerId, { group, timeout });
        }


        function spawnFireRing(playerId, duration = FIRE_RING_DURATION) {
            const player = players.get(playerId)?.model;
            if (!player) return;

            const position = new THREE.Vector3();
            player.getWorldPosition(position);
            position.y += 0.1;

            const geometry = new THREE.RingGeometry(0.625, 1.25, 64); // 25% larger ring
            const material = new THREE.MeshBasicMaterial({
                map: glowTexture,
                color: 0xffaa33,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.copy(position);
            // begin at scale 0 so the nova expands from the player
            mesh.scale.setScalar(0);

            scene.add(mesh);
            fireRings.push({ mesh, start: performance.now(), duration });
        }

        function spawnLightWaveRing(playerId, duration = LIGHTWAVE_RING_DURATION) {
            const player = players.get(playerId)?.model;
            if (!player) return;

            const position = new THREE.Vector3();
            player.getWorldPosition(position);
            position.y += 0.1;

            // Start very close to the player so the wave visually grows outwards
            const geometry = new THREE.RingGeometry(0.5, 1.5, 64);
            const material = new THREE.MeshBasicMaterial({
                color: 0xfff8e8,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.copy(position);
            // spawn small and let the update loop scale it outward
            mesh.scale.setScalar(0.1);

            scene.add(mesh);
            lightWaveRings.push({ mesh, start: performance.now(), duration });
        }

        function spawnFireBarrier(playerId, duration = 5000) {
            const player = players.get(playerId)?.model;
            if (!player) return;

            const geometry = new THREE.SphereGeometry(1.1, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                map: fireTexture,
                color: 0xff5522,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.scale.set(0.6, 0.9, 0.6);
            player.add(mesh);
            activeFireBarriers.set(playerId, { mesh, start: performance.now(), duration });
        }


        function spawnProjectileExplosion(playerId, color, impactPosition, duration = EXPLOSION_DURATION) {
            let position;
            if (impactPosition && typeof impactPosition.x === 'number') {
                position = new THREE.Vector3(impactPosition.x, impactPosition.y, impactPosition.z);
            } else {
                const player = players.get(playerId)?.model;
                if (!player) return;
                position = new THREE.Vector3();
                player.getWorldPosition(position);
                position.y += 1;
            }

            const geometry = new THREE.SphereGeometry(0.2, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            scene.add(mesh);
            projectileExplosions.push({ mesh, start: performance.now(), duration });
        }

        function spawnProjectileTrail(position, color, scale = 0.4, duration = PROJECTILE_TRAIL_DURATION) {
            const material = new THREE.SpriteMaterial({
                map: projectileTexture,
                color,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(scale, scale, 1);
            sprite.position.copy(position);
            sprite.renderOrder = 998;
            scene.add(sprite);
            projectileTrails.push({ mesh: sprite, start: performance.now(), duration, initialScale: scale });
        }

        function spawnSprintTrail(playerId, duration = 6000) {
            if (playerId !== myPlayerId) return;
            const existing = activeSprintTrails.get(playerId);
            if (existing) {
                existing.mesh.parent?.remove(existing.mesh);
                clearTimeout(existing.timeout);
            }

            const player = players.get(playerId)?.model;
            if (!player) return;

            const geometry = new THREE.PlaneGeometry(1.5, 0.3);
            const material = new THREE.MeshBasicMaterial({
                map: trailTexture,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(0, 0.05, -0.7);

            player.add(mesh);

            const timeout = setTimeout(() => {
                mesh.parent?.remove(mesh);
                activeSprintTrails.delete(playerId);
            }, duration);

            activeSprintTrails.set(playerId, { mesh, start: performance.now(), duration, timeout });
        }

        function startBladestorm(playerId, duration = 5000) {
            const playerData = players.get(playerId);

            if (!playerData) return;
            const { mixer, actions } = playerData;

            const spin = actions['attack360'] || actions['attack'];
            const originalScale = spin.timeScale;
            spin.timeScale = originalScale * 0.6;

            controlAction({
                action: spin,
                actionName: 'attack360',
                mixer,
                loop: THREE.LoopRepeat,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
            });

            const sound = sounds.bladestorm;
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.5;
                sound.loop = true;
                sound.play();
            }

            activeBladestorms.set(playerId, { start: performance.now(), duration, sound });
            if (playerId === myPlayerId) {
                isCasting = true;
            }

            setTimeout(() => {
                mixer.stopAllAction();
                spin.timeScale = originalScale;
                actions['idle'].play();
            }, duration)
        }



        function toggleShieldOnPlayer(id, visible) {
            let shield = activeShields.get(id);

            if (visible) {
                if (!shield) {
                    shield = makeShieldMesh();
                    scene.add(shield);
                    activeShields.set(id, shield);
                }
            } else if (shield) {
                scene.remove(shield);
                activeShields.delete(id);
            }
        }

        function updateModel() {
            const model = players.get(myPlayerId).model;
            if (model) {
                const playerPosition = new THREE.Vector3();

                playerCollider.getCenter(playerPosition);

                // Update model position and height
                model.position.copy(playerPosition);
                // model.position.y += 0.5; // Adjust the height to keep the model slightly above ground
                // Lower the model slightly so the feet touch the ground
                model.position.y -= 0.7;

                if (!isCameraDragging) {
                    model.rotation.y = yaw + Math.PI;
                }


                if (isShieldActive) {
                    bubbleMesh.visible = true;
                    bubbleMesh.position.copy(playerPosition);
                    bubbleMesh.position.y -= 0.4; // Move the effect closer to the player's feet
                } else {
                    bubbleMesh.visible = false;
                }

                if (isHealActive) {
                    if (!healEffectModel) {
                        // If the shield model isn't already in the scene, add it
                        healEffectModel = SkeletonUtils.clone(models["heal-effect"]);
                        healEffectModel.scale.set(0.3, 0.3, 0.3); // Adjust size of shield
                        scene.add(healEffectModel);
                    }

                    // Update shield position to follow the player
                    healEffectModel.position.copy(playerPosition);
                    healEffectModel.position.y -= 0.4; // Move the effect closer to the player's feet

                    // Optionally add some animation, like pulsing
                    // const time = clock.getElapsedTime();
                    // const pulse = Math.sin(time * 5) * 0.1 + 1; // Pulsing scale effect
                    // shieldEffectModel.scale.set(1.5 * pulse, 1.5 * pulse, 1.5 * pulse);
                } else if (healEffectModel) {
                    // Remove the shield model if shield is no longer active
                    scene.remove(healEffectModel);
                    healEffectModel = null;
                }

            }
        }

        // Example function to send player position updates to the server
        function sendPositionUpdate() {
            if (!playerCollider.start || !players.has(myPlayerId)) return;
            const model = players.get(myPlayerId).model;

            const position = {
                x: playerCollider.start.x,
                y: playerCollider.start.y,
                z: playerCollider.start.z,
            };

            const rotation = {
                y: model?.rotation?.y || 0, // Send only the Y-axis rotation
            };

            sendToSocket({type: "UPDATE_POSITION", position, rotation});
        }

        // setInterval(
        //     () =>
        //         console.log("position ", {
        //             x: model.position.x,
        //             y: model.position.y,
        //             z: model.position.z,
        //         }),
        //     5000,
        // );

        function initWordObjects() {
            for (const object of world.stuff) {
                const objectAnimations = models[`${object.id}_animations`];

                // console.log('objectAnimations ', objectAnimations)
                for (const position of object.positions) {
                    const objectModel = SkeletonUtils.clone(models[object.id]);

                    objectModel.scale.set(object.scale, object.scale, object.scale);
                    objectModel.position.set(position.x, position.y, position.z);

                    if (object.animated) {
                        const objectMixer = new THREE.AnimationMixer(objectModel);

                        objectMixer.timeScale = 40;

                        scene.add(objectModel);

                        if (objectAnimations[0]) {
                            const action = objectMixer.clipAction(objectAnimations[0]);

                            controlAction({
                                action,
                                loop: THREE.LoopRepeat,
                                mixer: objectMixer,
                            });
                        }
                    } else {
                        scene.add(objectModel);
                    }
                }
            }
        }

        initWordObjects();

        function animate() {
            const delta = clock.getDelta();
            fireballMaterial.uniforms.time.value += delta;
            // spheres.forEach(s => {
            //     if (s.mesh?.material?.uniforms?.time) {
            //         s.mesh.material.uniforms.time.value += delta;
            //     }
            // });
            projectiles.forEach(p => {
                if (p.mesh?.material?.uniforms?.time) {
                    p.mesh.material.uniforms.time.value += delta;
                }
            });
            // Если игрок мёртв, отключаем управление
            if (hp <= 0) {
                playerVelocity.set(0, 0, 0);
                return;
            }

            const deltaTime = Math.min(0.04, delta) / STEPS_PER_FRAME;

            // Update the character model and animations
            // if (mixer) mixer.update(deltaTime);
            playerMixers.forEach(m => m.update(deltaTime));
            // we look for collisions in substeps to mitigate the risk of
            // an object traversing another too quickly for detection.

            if (players.has(myPlayerId)) {
                for (let i = 0; i < STEPS_PER_FRAME; i++) {
                    if (controlsEnabled) {
                        controls(deltaTime);
                        updateMyPlayer(deltaTime);
                    }

                    for (const [playerId] of players) {
                        if (playerId !== myPlayerId) {
                            updatePlayerPosition(playerId);
                        }
                    }

                    updateModel();
                    // updateSpheres(deltaTime);
                    updateProjectiles(deltaTime);

                    activeShields.forEach((mesh, id) => {
                        const target = players.get(id)?.model;
                        if (!target) return;

                        target.getWorldPosition(mesh.position);
                        mesh.position.y += 0.2;
                    });


                    activeDamageEffects.forEach((mesh) => {
                        mesh.rotation.y += delta * DAMAGE_EFFECT_ROT_SPEED;
                        mesh.children.forEach(c => {
                            if (c.material?.map) {
                                c.material.map.offset.x -= delta * DAMAGE_EFFECT_MAP_SPEED;
                            }
                        });
                    });

                    activeImmolation.forEach((mesh, id) => {
                        const target = players.get(id)?.model;
                        if (!target) return;
                        target.getWorldPosition(mesh.position);
                        mesh.position.y += 0.5;
                    });

                   activeStunEffects.forEach((obj, id) => {
                       const target = players.get(id)?.model;
                       if (!target) return;
                       target.getWorldPosition(obj.group.position);
                       obj.group.position.y += 1.8;
                       obj.group.rotation.y += delta * STUN_SPIN_SPEED;
                   });


                    activeSlowEffects.forEach((obj, id) => {
                        const target = players.get(id)?.model;
                        if (!target) return;
                        target.getWorldPosition(obj.mesh.position);
                        obj.mesh.position.y += 0.1;
                        obj.mesh.rotation.z += delta * SLOW_SPIN_SPEED;
                    });

                    for (let i = fireRings.length - 1; i >= 0; i--) {
                        const effect = fireRings[i];
                        const elapsed = performance.now() - effect.start;
                        const progress = elapsed / effect.duration;
                        // expand from the player out to the melee range
                        effect.mesh.scale.setScalar(FIRE_RING_RANGE * progress);
                        effect.mesh.material.opacity = 0.8 * (1 - progress);
                        if (progress >= 1) {
                            scene.remove(effect.mesh);
                            fireRings.splice(i, 1);
                        }
                    }

                    for (let i = lightWaveRings.length - 1; i >= 0; i--) {
                        const effect = lightWaveRings[i];
                        const elapsed = performance.now() - effect.start;
                        const progress = elapsed / effect.duration;
                        effect.mesh.scale.setScalar(progress * LIGHTWAVE_RANGE);
                        effect.mesh.material.opacity = 0.9 * (1 - progress);
                        effect.mesh.rotation.z += delta * 2;
                        if (progress >= 1) {
                            scene.remove(effect.mesh);
                            lightWaveRings.splice(i, 1);
                        }
                    }


                    for (let i = projectileExplosions.length - 1; i >= 0; i--) {
                        const effect = projectileExplosions[i];
                        const elapsed = performance.now() - effect.start;
                        const progress = elapsed / effect.duration;
                        effect.mesh.scale.setScalar(0.5 + progress * 0.8);
                        effect.mesh.material.opacity = 0.8 * (1 - progress);
                        if (progress >= 1) {
                            scene.remove(effect.mesh);
                            projectileExplosions.splice(i, 1);
                        }
                    }

                    for (let i = projectileTrails.length - 1; i >= 0; i--) {
                        const seg = projectileTrails[i];
                        const elapsed = performance.now() - seg.start;
                        const progress = elapsed / seg.duration;
                        seg.mesh.scale.setScalar(seg.initialScale * (1 - progress));
                        seg.mesh.material.opacity = 0.8 * (1 - progress);
                        if (progress >= 1) {
                            scene.remove(seg.mesh);
                            projectileTrails.splice(i, 1);
                        }
                    }


                    activeSprintTrails.forEach((obj, id) => {
                        const progress = (performance.now() - obj.start) / obj.duration;
                        obj.mesh.scale.x = 1 + progress * 1.5;
                        obj.mesh.material.opacity = 0.8 * (1 - progress);
                        if (progress >= 1) {
                            obj.mesh.parent?.remove(obj.mesh);
                            clearTimeout(obj.timeout);
                            activeSprintTrails.delete(id);
                        }
                    });

                    activeBladestorms.forEach((obj, id) => {
                        const player = players.get(id)?.model;
                        if (!player) return;
                        const elapsed = performance.now() - obj.start;
                        if (elapsed >= obj.duration) {
                            activeBladestorms.delete(id);
                            obj.sound?.pause();
                            if (id === myPlayerId) isCasting = false;
                        }
                    });

                    activeFireBarriers.forEach((obj, id) => {
                        const elapsed = performance.now() - obj.start;
                        const progress = elapsed / obj.duration;
                        obj.mesh.material.opacity = 0.7 * (1 - progress);
                        if (progress >= 1) {
                            obj.mesh.parent?.remove(obj.mesh);
                            activeFireBarriers.delete(id);
                        }
                    });

                    runes.forEach(r => {
                        const speed = r.userData.type === 'damage' ? 0.025 : 0.1;
                        r.rotation.y += delta * speed;
                    });

                    xpRunes.forEach(r => {
                        r.rotation.y += delta * 0.1;
                    });

                    if (targetIndicator) {
                        targetIndicator.rotation.y += delta * TARGET_INDICATOR_ROT_SPEED;
                    }

                    // renderCursor();
                    updateCameraPosition();
                    highlightCrosshair();
                    if (aimBeam) updateAimBeam();
                }

                teleportPlayerIfOob();

                updateNameLabels();

                sendPositionUpdate();

                renderer.render(scene, camera);
                labelRenderer.render(scene, camera); // Render labels

                stats.update();
            }
        }

        function createStaffMesh() {
            const staffId = 'mage_staff';
            const base = models[staffId];
            if (base) {
                const staff = SkeletonUtils.clone(base);
                staff.scale.set(0.3, 0.3, 0.3);
                // Ensure the staff points upward and sits behind the character
                staff.rotation.set(0, 1.5, 0);
                staff.position.set(0, 0.4, -0.25);
                return staff;
            }
            const group = new THREE.Group();
            const stick = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
                new THREE.MeshStandardMaterial({color: 0x8B4513})
            );
            stick.position.y = 0.75;
            const top = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 16, 16),
                new THREE.MeshStandardMaterial({color: 0xffffff})
            );
            top.position.y = 1.5;
            group.add(stick);
            group.add(top);
            // Placeholder staff positioned upright
            group.rotation.set(0, 0, 0);
            group.position.set(0, 0.9, -0.2);
            return group;
        }

        // Function to create a new player in the scene
        function buildActions(mixer, animations, skin = 'brand') {
            const map = SKIN_ANIMATIONS[skin] || SKIN_ANIMATIONS['brand'];
            const get = (...names) => {
                const lowerNames = names.map(n => n?.toLowerCase() || '');
                const clip = animations.find(c => lowerNames.includes(c.name.toLowerCase()));
                return clip ? mixer.clipAction(clip) : null;
            };

            const actions = {
                idle: get(map.idle),
                walk: get(map.walk),
                run: get(map.run),
                jump: get(map.jump),
                casting: get(map.casting),
                castEnd: get(map.castEnd),
                cast: get(map.cast),
                dying: get(map.dying),
                hitReaction: get(map.hitReaction),
                attack: get(map.attack),
                attack360: get(map.attack360),
                dance: get(map.dance),
                hook: get(map.hook),
            };

            // Speed up attack animations
            if (actions.attack) actions.attack.timeScale *= 2;
            if (actions.attack360) actions.attack360.timeScale *= 2;

            return actions;
        }

        function createPlayer(id, name = "", address = "", classType = "", characterModel = "vampir") {
            const baseModel = models[characterModel] || models['character'];
            if (baseModel) {
                const defaultScale = baseModel.userData?.scale ?? 0.00665;
                const player = SkeletonUtils.clone(baseModel);
                player.position.set(...USER_DEFAULT_POSITION);

                player.scale.set(defaultScale, defaultScale, defaultScale);
                if (id === myPlayerId) {
                    currentScale = defaultScale;
                }
                player.rotation.set(0, 0, 0);

                player.traverse((object) => {
                    if (object.isMesh) {
                        object.castShadow = true;
                        // Clone materials to avoid sharing between players
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material = object.material.map((m) => m.clone());
                            } else {
                                object.material = object.material.clone();
                            }
                        }
                    }
                });

                let nameLabel = null;
                if (id !== myPlayerId) {
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'name-label';
                    nameDiv.textContent = name;
                    nameLabel = new CSS2DObject(nameDiv);
                    nameLabel.position.set(0, 2.5, 0);
                    player.add(nameLabel);
                }

                const mixer = new THREE.AnimationMixer(player);
                mixer.timeScale = 40;
                // const idle = mixer.clipAction(animations[2]).play();
                // const walk = mixer.clipAction(animations[6]);
                console.log("animations: ", animations);
                console.log("characterModel: ", characterModel);
                const actions = buildActions(
                    mixer,
                    animations,
                    characterModel,
                );


                scene.add(player);
                if (
                    id === myPlayerId &&
                    ['paladin', 'warrior', 'rogue'].includes(classType)
                ) {
                    meleeRangeIndicator = createMeleeIndicator();
                    meleeRangeIndicator.scale.setScalar(1 / currentScale);
                    player.add(meleeRangeIndicator);
                }
                const stats = CLASS_STATS[classType] || { hp: MAX_HP, armor: 0, mana: MAX_MANA };
                players.set(id, {
                    model: player,
                    name,
                    nameLabel,
                    mixer: mixer,
                    position: {x: 0, y: 0, z: 0},
                    rotation: {y: 0},
                    action: '',
                    currentAction: '',
                    kills: 0,
                    deaths: 0,
                    assists: 0,
                    points: 0,
                    level: 1,
                    hp: stats.hp,
                    maxHp: stats.hp,
                    armor: stats.armor,
                    maxArmor: stats.armor,
                    mana: stats.mana || MAX_MANA,
                    maxMana: stats.mana || MAX_MANA,
                    actions,
                    prevPos: new THREE.Vector3().copy(player.position),
                    buffs: [],
                    address,
                    classType,
                    character: characterModel,
                });
                if (actions.idle) actions.idle.play();
                playerMixers.push(mixer);   // массив всех чужих миксеров
                const pData = players.get(id);
                if (pData) {
                    pData.currentAction = 'idle';
                }
            }
        }


        // Function to update a player's position
        function updatePlayer(id, message) {
            if (players.has(id)) {
                const playerData = players.get(id);
                const {mixer, actions} = playerData;

                playerData.position = message.position;
                playerData.rotation = message.rotation;
                playerData.kills = message.kills;
                playerData.deaths = message.deaths;
                playerData.assists = message.assists;
                playerData.points = message.points;
                playerData.level = message.level;
                playerData.buffs = message.buffs;
                playerData.debuffs = message.debuffs;
                if (message.maxHp !== undefined) playerData.maxHp = message.maxHp;
                if (message.maxArmor !== undefined) playerData.maxArmor = message.maxArmor;
                if (message.maxMana !== undefined) playerData.maxMana = message.maxMana;
                if (message.armor !== undefined) playerData.armor = message.armor;
                playerData.hp = message.hp;
                playerData.mana = message.mana;
                playerData.address = message.address || playerData.address;
                if (message.classType) {
                    playerData.classType = message.classType;
                }
                if (message.character) {
                    playerData.character = message.character;
                }

                const action = actions?.[message.animationAction];
                const loop = message.loop ?? THREE.LoopOnce;
                if (action && message.animationAction !== playerData.currentAction) {
                    controlAction({
                        action,
                        mixer,
                        loop,
                        fadeIn: 0.2
                    });
                    playerData.currentAction = message.animationAction;
                }

            }

        }

        function updatePlayerPosition(id) {
            const p = players.get(id);
            if (!p) return;
            const { model, position, rotation } = p;
            model.position.set(position.x, position.y, position.z);
            model.rotation.y = rotation?.y;
        }

        function updateNameLabels() {
            players.forEach((p, id) => {
                if (id === myPlayerId) return;
                if (!p.nameLabel) return;
                const visible = hasLineOfSight(id);
                p.nameLabel.element.style.display = visible ? 'block' : 'none';
            });
        }

        function createRune(data) {
            const modelId = `${data.type}_rune`;
            const base = models[modelId];
            if (!base) return;
            const rune = SkeletonUtils.clone(base);
            rune.position.set(data.position.x, data.position.y, data.position.z);
            // Scale runes down by 30%
            rune.scale.multiplyScalar(0.098);
            // lower the rune 20% further so it sits closer to the ground
            rune.position.y -= 0.36;
            rune.userData.type = data.type;

            rune.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                }
            });

            let color = 0xffffff;
            if (data.type === 'heal') color = 0x00ff7f;
            if (data.type === 'mana') color = 0x44aaff;
            if (data.type === 'damage') color = 0xff3333;
            const glow = makeGlowSprite(color, 1.5);
            glow.position.y = 0.2;
            rune.add(glow);

            scene.add(rune);
            runes.set(data.id, rune);
        }

        function removeRune(id) {
            const rune = runes.get(id);
            if (rune) {
                scene.remove(rune);
                runes.delete(id);
            }
        }

        function createXpRune(data) {
            const modelId = 'xp_rune';
            const base = models[modelId];
            if (!base) return;
            const rune = SkeletonUtils.clone(base);
            rune.position.set(data.position.x, data.position.y, data.position.z);
            // Scale XP runes down by 30%
            rune.scale.multiplyScalar(0.0196);
            rune.position.y -= 0.24;
            rune.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                }
            });
            const glow = makeGlowSprite(0xffff00, 1.5);
            glow.position.y = 0.2;
            rune.add(glow);
            scene.add(rune);
            xpRunes.set(data.id, rune);
        }

        function removeXpRune(id) {
            const rune = xpRunes.get(id);
            if (rune) {
                scene.remove(rune);
                xpRunes.delete(id);
            }
        }

        function createProjectile(data) {
            removeProjectile(data.id);
            let mesh;
            let color = 0xffffff;
            if (data.type === 'fireball') {
                color = 0xffaa33;
                mesh = makeProjectileSprite(color, SPELL_SCALES.fireball);

            } else if (data.type === 'shadowbolt') {

                mesh = makeProjectileSprite(0x8a2be2, SPELL_SCALES.shadowbolt);

            } else {
                mesh = new THREE.Mesh(fireballGeometry, fireballMaterial.clone());
            }

            mesh.position.set(data.position.x, data.position.y, data.position.z);

            scene.add(mesh);
            projectiles.set(data.id, {
                mesh,
                type: data.type,
                color,
                prevPos: mesh.position.clone(),
                trailTimer: 0,
            });
        }

        function removeProjectile(id) {
            const proj = projectiles.get(id);
            if (proj) {
                scene.remove(proj.mesh);
                projectiles.delete(id);
            }
        }

        function syncProjectiles(list) {
            const ids = new Set();
            if (Array.isArray(list)) {
                list.forEach(p => {
                    ids.add(p.id);
                    if (projectiles.has(p.id)) {
                        const proj = projectiles.get(p.id);
                        proj.prevPos.copy(proj.mesh.position);
                        proj.mesh.position.set(p.position.x, p.position.y, p.position.z);
                    } else {
                        createProjectile(p);
                    }
                });
            }
            Array.from(projectiles.keys()).forEach(id => {
                if (!ids.has(id)) {
                    removeProjectile(id);
                }
            });
        }

        function updateProjectiles(deltaTime) {
            projectiles.forEach(p => {
                p.trailTimer = (p.trailTimer || 0) + deltaTime;
                if (p.prevPos && p.trailTimer > 0.05) {
                    spawnProjectileTrail(p.prevPos.clone(), p.color);
                    p.trailTimer = 0;
                }
                if (p.prevPos) {
                    p.prevPos.copy(p.mesh.position);
                }
            });
        }

        // Function to remove a player from the scene
        function removePlayer(id) {
            if (players.has(id)) {
                const data = players.get(id);
                if (data.model) scene.remove(data.model);
                if (data.nameLabel) {
                    data.model.remove(data.nameLabel);
                    data.nameLabel.element?.remove();
                }
                players.delete(id);
                if (id === myPlayerId && meleeRangeIndicator) {
                    meleeRangeIndicator.parent?.remove(meleeRangeIndicator);
                    meleeRangeIndicator = null;
                }
                if (id === targetedPlayerId) {
                    targetedPlayerId = null;
                    dispatchTargetUpdate();
                }
                if (id === highlightedPlayerId) {
                    highlightedPlayerId = null;
                    updateHighlightIndicator();
                }
            }
        }

        function playHitReaction(playerId) {
            const data = players.get(playerId);
            if (!data) return;
            const { actions, mixer } = data;
            const hit = actions?.hitReaction;
            if (!hit || !mixer) return;
            if (hit.isRunning()) return;
            hit.reset();
            hit.setLoop(THREE.LoopOnce, 1);
            hit.clampWhenFinished = true;
            hit.fadeIn(0.1).play();
            const onFinished = (e) => {
                if (e.action === hit) {
                    mixer.removeEventListener('finished', onFinished);
                    hit.fadeOut(0.1);
                }
            };
            mixer.addEventListener('finished', onFinished);
        }

        function showDamage(playerId, amount, spellType) {
            const player = players.get(playerId)?.model;
            if (!player) return;

            playHitReaction(playerId);

            let record = damageLabels.get(playerId);
            if (!record) {
                const container = document.createElement('div');
                container.className = 'damage-label-container';
                const label = new CSS2DObject(container);
                label.position.set(0, 2.5, 0);
                player.add(label);
                record = {label, container};
                damageLabels.set(playerId, record);
            }

            const div = document.createElement('div');
            div.className = 'damage-label';

            const iconSrc = SPELL_ICONS[spellType];
            if (iconSrc) {
                const img = document.createElement('img');
                img.src = iconSrc;
                img.className = 'damage-icon';
                div.appendChild(img);
            }

            const span = document.createElement('span');
            span.textContent = String(amount);
            div.appendChild(span);
            record.container.prepend(div);

            if (record.container.childElementCount > 3) {
                record.container.removeChild(record.container.lastElementChild);
            }

            setTimeout(() => {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
                if (record.container.childElementCount === 0) {
                    player.remove(record.label);
                    damageLabels.delete(playerId);
                }
            }, 1000);
        }

        function showSelfDamage(amount) {
            if (!selfDamage) return;
            const div = document.createElement('div');
            div.className = 'damage-label';
            div.textContent = String(amount);
            selfDamage.appendChild(div);
            setTimeout(() => {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            }, 1000);
        }

        function castSphereOtherUser(data) {
            createProjectile(data);
        }

        function castShieldOtherUser() {
        }

        // Handle incoming messages from the server
        const handleMessage = async (event) => {
            let message = JSON.parse(event.data);

            switch (message.type) {
                case "GET_MATCH":
                    if (message.match && Array.isArray(message.match.players)) {
                        const list = [];
                        message.match.players.forEach(([pid, pdata]) => {
                            const id = Number(pid);
                            if (players.has(id)) {
                                const p = players.get(id);
                                p.classType = pdata.classType;
                                p.character = pdata.character;
                                p.nickname = pdata.nickname;
                            } else {
                                players.set(id, { classType: pdata.classType, character: pdata.character, nickname: pdata.nickname });
                            }
                            list.push({ id, classType: pdata.classType, nickname: pdata.nickname });
                        });
                        setPlayersInfo(list);
                    }
                    break;
                case "CAST_SPELL":
                    switch (message?.payload?.type) {
                        case "fireball":
                            igniteHands(message.id, 1000);
                            castSphereOtherUser(message.payload);
                            break;
                        case "shadowbolt":
                            igniteHands(message.id, 1000);
                            castSphereOtherUser(message.payload);
                            break;
                        case "fire-barrier":
                            spawnFireBarrier(message.id);
                            break;
                        case "fireball-hit":
                            spawnProjectileExplosion(
                                message.payload.targetId,
                                0xff6600,
                                message.payload.position
                            );
                            break;
                        case "shield":
                            castShieldOtherUser(message.payload, message.id)
                            break;
                        case "corruption":
                            if (message.payload.targetId === myPlayerId) {
                                dispatch({
                                    type: "SEND_CHAT_MESSAGE",
                                    payload: "You are afflicted by corruption!",
                                });
                            }
                            break;
                        case "lifetap":
                            break;
                        case "lifedrain":
                            if (message.payload.targetId === myPlayerId) {
                                takeDamage(LIFEDRAIN_DAMAGE, message.id, 'lifedrain');
                            }
                            if (message.id === myPlayerId) {
                                hp = Math.min(MAX_HP, hp + LIFEDRAIN_DAMAGE);
                                updateHPBar();
                            }
                            break;
                        case "firering":
                            spawnFireRing(message.id);
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                const me = players.get(myPlayerId);
                                if (caster && me) {
                                    const myPos = me.model.position.clone();
                                    const casterPos = caster.model.position.clone();
                                    if (myPos && casterPos && myPos.distanceTo(casterPos) < FIRE_RING_RANGE) {
                                        const dir = myPos.clone().sub(casterPos).setY(0).normalize();
                                        playerVelocity.x += dir.x * KNOCKBACK_STRENGTH;
                                        playerVelocity.z += dir.z * KNOCKBACK_STRENGTH;
                                        takeDamage(FIRE_RING_DAMAGE, message.id, 'firering');
                                    }
                                }
                            }
                            break;
                        case "paladin-heal":
                            if (message.id === myPlayerId) {
                                dispatch({ type: "SEND_CHAT_MESSAGE", payload: "You are healed!" });
                            }
                            break;
                        case "divine-speed":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 5000, 2);
                                spawnSprintTrail(myPlayerId, 5000);
                            }
                            break;
                        case "blood-strike":
                            if (message.id !== myPlayerId) {
                                lightSword(message.id, 500);
                                if (sounds.sinisterStrike) {
                                    sounds.sinisterStrike.currentTime = 0;
                                    sounds.sinisterStrike.volume = 0.5;
                                    sounds.sinisterStrike.play();
                                }
                            }
                            break;
                        case "eviscerate":
                            break;
                        case "kidney-strike":
                            if (message.payload.targetId === myPlayerId) {
                                const caster = players.get(message.id);
                                const me = players.get(myPlayerId);
                                if (caster && me) {
                                    const origin = caster.model.position.clone();
                                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(caster.model.quaternion);
                                    const toMe = me.model.position.clone().sub(origin);
                                    const distance = toMe.length();
                                    if (distance < MELEE_RANGE_ATTACK && forward.angleTo(toMe.normalize()) < MELEE_ANGLE) {
                                        applyStunEffect(message.payload.targetId, 2000);
                                    }
                                }
                            }
                            break;
                        case "sprint":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 4000, 2);
                                spawnSprintTrail(myPlayerId, 4000);
                            }
                            break;
                        case "stun":
                            if (message.payload.targetId === myPlayerId) {
                                const caster = players.get(message.id);
                                const me = players.get(myPlayerId);
                                if (caster && me) {
                                    const origin = caster.model.position.clone();
                                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(caster.model.quaternion);
                                    const toMe = me.model.position.clone().sub(origin);
                                    const distance = toMe.length();
                                    if (distance < MELEE_RANGE_ATTACK && forward.angleTo(toMe.normalize()) < MELEE_ANGLE) {
                                        applyStunEffect(message.payload.targetId, 3000);
                                    }
                                }
                            }
                            break;
                        case "warbringer":
                            if (sounds.charge) {
                                sounds.charge.currentTime = 0;
                                sounds.charge.volume = 0.5;
                                sounds.charge.play();
                            }
                            break;
                        case "savage-blow":
                            if (message.id !== myPlayerId) {
                                lightSword(message.id, 500);
                                if (sounds.mortalStrike) {
                                    sounds.mortalStrike.currentTime = 0;
                                    sounds.mortalStrike.volume = 0.5;
                                    sounds.mortalStrike.play();
                                }
                            }
                            break;
                        case "hook":
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                const me = players.get(myPlayerId);
                                if (caster && me) {
                                    const origin = caster.model.position.clone();
                                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(caster.model.quaternion);
                                    const toMe = me.model.position.clone().sub(origin);
                                    const distance = toMe.length();
                                    if (distance < MELEE_RANGE_ATTACK && forward.angleTo(toMe.normalize()) < MELEE_ANGLE) {
                                        applySlowEffect(myPlayerId, 3000, 0.3);
                                    }
                                }
                            }
                            break;
                        case "bladestorm":
                            startBladestorm(message.id);
                            if (message.id === myPlayerId) {
                                applyFreedomEffect(myPlayerId, 5000);
                            }
                            break;
                        case "lightstrike":
                            if (message.id !== myPlayerId) {
                                lightSword(message.id, 500);
                            }
                            break;
                    }

                    break;
                case "SEND_CHAT_MESSAGE":
                    dispatch({
                        type: "SEND_CHAT_MESSAGE",
                        payload: `${message?.character?.name} say: ${message.payload}`,
                    });
                    break;
                case "UPDATE_STATS":
                    if (message.playerId === myPlayerId) {
                        hp = message.hp;
                        armor = message.armor;
                        maxHp = message.maxHp || maxHp;
                        maxArmor = message.maxArmor || maxArmor;
                        mana = message.mana;
                        if (message.maxMana !== undefined) maxMana = message.maxMana;
                        updateHPBar();
                        updateManaBar();
                        dispatch({type: 'SET_BUFFS', payload: message.buffs || []});
                        dispatch({type: 'SET_DEBUFFS', payload: message.debuffs || []});
                        if (hp <= 0) {
                            // waiting for server respawn
                        }
                    } else if (players.has(message.playerId)) {
                        const p = players.get(message.playerId);
                        p.hp = message.hp;
                        p.armor = message.armor;
                        if (message.maxHp !== undefined) p.maxHp = message.maxHp;
                        if (message.maxArmor !== undefined) p.maxArmor = message.maxArmor;
                        if (message.maxMana !== undefined) p.maxMana = message.maxMana;
                        p.mana = message.mana;
                        p.buffs = message.buffs || [];
                        p.debuffs = message.debuffs || [];
                        if (message.playerId === targetedPlayerId) {
                            dispatchTargetUpdate();
                        }
                    }
                    break;
                case "KILL": {
                    const killer = players.get(message.killerId);
                    const victim = players.get(message.victimId);
                    const killerName = killer?.address || `Player ${message.killerId}`;
                    const victimName = victim?.address || `Player ${message.victimId}`;

                    dispatch({
                        type: "SEND_CHAT_MESSAGE",
                        payload: `${killerName} killed ${victimName}`,
                    });

                    if (message.killerId === myPlayerId) {
                        dispatch({
                            type: "SEND_CHAT_MESSAGE",
                            payload: `+1 $MetaWars$ Gold for kill ${victimName}!`,
                        });
                        dispatchEvent('player-kill');
                        setTimeout(() => {
                            refetchCoins();
                        }, 500);
                    }
                    break;
                }
                case "DAMAGE":
                    if (
                        message.targetId &&
                        (message.targetId === myPlayerId || message.dealerId === myPlayerId)
                    ) {
                        if (message.targetId !== myPlayerId) {
                            showDamage(message.targetId, message.amount, message.spellType);
                        }
                        if (message.targetId === myPlayerId) {
                            showSelfDamage(message.amount);
                            sounds.damage.volume = 0.5;
                            sounds.damage.currentTime = 0;
                            sounds.damage.play();
                        }
                    }
                    break;
                case "RUNE_PICKED":
                    if (message.runeType === 'xp') {
                        removeXpRune(message.runeId);
                    } else {
                        removeRune(message.runeId);
                    }
                    if (message.runeType === 'damage') {
                        applyDamageRuneEffect(message.playerId);
                    }
                    if (message.playerId === myPlayerId) {
                        let text = '';
                        switch (message.runeType) {
                            case 'heal':
                                text = 'Picked heal rune!';
                                break;
                            case 'mana':
                                text = 'Picked mana rune!';
                                break;
                            case 'damage':
                                text = 'Damage buff for 60s!';
                                break;
                            case 'xp':
                                text = 'Gained experience!';
                                break;
                        }
                        if (message.runeType === 'xp' && sounds?.xpRune) {
                            sounds.xpRune.currentTime = 0;
                            sounds.xpRune.volume = 0.5;
                            sounds.xpRune.play();
                        }
                        if (message.runeType === 'heal' && sounds?.healRune) {
                            sounds.healRune.currentTime = 0;
                            sounds.healRune.volume = 0.5;
                            sounds.healRune.play();
                        }
                        if (message.runeType === 'mana' && sounds?.manaRune) {
                            sounds.manaRune.currentTime = 0;
                            sounds.manaRune.volume = 0.5;
                            sounds.manaRune.play();
                        }
                        if (message.runeType === 'damage' && sounds?.damageRune) {
                            sounds.damageRune.currentTime = 0;
                            sounds.damageRune.volume = 0.5;
                            sounds.damageRune.play();
                        }
                        if (text) {
                            dispatch({type: 'SEND_CHAT_MESSAGE', payload: text});
                        }
                    }
                    break;
                case "PLAYER_RESPAWN":
                    if (players.has(message.playerId)) {
                        const p = players.get(message.playerId);
                        p.position = message.position;
                        if (message.rotation) {
                            p.rotation = message.rotation;
                        }
                        if (message.playerId === myPlayerId) {
                            const pos = {
                                ...message.position,
                                rotation: message.rotation,
                            };
                            respawnPlayer(pos);
                        }
                    }
                    break;
                case "PULL_PLAYER":
                    if (players.has(message.playerId)) {
                        const p = players.get(message.playerId);
                        p.position = message.position;
                        if (message.playerId === myPlayerId) {
                            teleportTo(message.position);
                        }
                    }
                    break;
                case "UPDATE_MATCH":
                    // const match = message.payload;
                    for (const [id, player] of Object.entries(message.players)) {
                        const numId = Number(id);
                        if (numId !== myPlayerId) {
                            updatePlayer(numId, player);
                        } else {
                            hp = player.hp;
                            mana = player.mana;
                            points = player.points;
                            if (player.level > prevLevel) {
                                if (sounds.levelUp) {
                                    sounds.levelUp.currentTime = 0;
                                    sounds.levelUp.volume = 0.5;
                                    sounds.levelUp.play();
                                }
                            }
                            prevLevel = player.level;
                            level = player.level;
                            skillPoints = player.skillPoints || skillPoints;
                            learnedSkills = player.learnedSkills || learnedSkills;
                            updateHPBar();
                            updateManaBar();
                            dispatch({type: 'SET_BUFFS', payload: player.buffs || []});
                            dispatch({type: 'SET_DEBUFFS', payload: player.debuffs || []});
                        }

                        if (numId === targetedPlayerId) {
                            dispatchTargetUpdate();
                        }

                    }

                    const boardData = Object.entries(message.players).map(([id, p]) => ({
                        id: Number(id),
                        kills: p.kills,
                        deaths: p.deaths,
                        assists: p.assists,
                        damage: Math.floor(p.damage || 0),
                        points: p.points,
                        level: p.level,
                    }));
                    dispatch({type: 'SET_SCOREBOARD_DATA', payload: boardData});

                    const runeIds = new Set();
                    const xpRuneIds = new Set();
                    if (Array.isArray(message.runes)) {
                        message.runes.forEach(r => {
                            runeIds.add(r.id);
                            if (!runes.has(r.id)) {
                                createRune(r);
                            } else {
                                const obj = runes.get(r.id);
                                obj.position.set(r.position.x, r.position.y, r.position.z);
                            }
                        });
                    }
                    if (Array.isArray(message.xpRunes)) {
                        message.xpRunes.forEach(r => {
                            xpRuneIds.add(r.id);
                            if (!xpRunes.has(r.id)) {
                                createXpRune(r);
                            } else {
                                const obj = xpRunes.get(r.id);
                                obj.position.set(r.position.x, r.position.y, r.position.z);
                            }
                        });
                    }
                    if (Array.isArray(message.projectiles)) {
                        syncProjectiles(message.projectiles);
                    }
                    Array.from(runes.keys()).forEach(id => {
                        if (!runeIds.has(id)) {
                            removeRune(id);
                        }
                    });
                    Array.from(xpRunes.keys()).forEach(id => {
                        if (!xpRuneIds.has(id)) {
                            removeXpRune(id);
                        }
                    });

                    break;
                case "removePlayer":
                    removePlayer(message.id);
                    break;
                case "MATCH_FINISHED":
                    router.push(`/matches/${matchId}/summary`);
                    break;
                case "MATCH_READY":
                    setIsReadyToPlay(true);
                    appendRenderer();

                    for (const [id] of players) {
                        removePlayer(id);
                    }

                    myPlayerId = message.myPlayerId;
                    message.players.forEach(([playerId, playerOptions]) => {
                        const cls = playerOptions?.classType || "";
                        const charModel = playerOptions?.character || CLASS_MODELS[cls] || 'vampir';
                        createPlayer(Number(playerId), String(playerId), String(playerId), cls, charModel);
                        if (Number(playerId) === myPlayerId) {
                            learnedSkills = playerOptions.learnedSkills || learnedSkills;
                            skillPoints = playerOptions.skillPoints ?? skillPoints;
                            hp = playerOptions.hp ?? hp;
                            maxHp = playerOptions.maxHp ?? maxHp;
                            armor = playerOptions.armor ?? armor;
                            maxArmor = playerOptions.maxArmor ?? maxArmor;
                            mana = playerOptions.mana ?? mana;
                            maxMana = playerOptions.maxMana ?? maxMana;
                        }
                    })
                    updateHPBar();
                    updateManaBar();
                    startCountdown();
                    break;
            }
        };

        socket.addEventListener('message', handleMessage);

        sendToSocket({
            type: 'GET_MATCH'
        });
        sendToSocket({
            type: 'READY_FOR_MATCH'
        });
        return () => {
            window.removeEventListener('DEV_SCALE_CHANGE', handleScaleChange);
            window.removeEventListener('DEV_MODEL_CHANGE', handleModelChange);
            socket.removeEventListener('message', handleMessage);
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            if (cameraLogInterval) {
                clearInterval(cameraLogInterval);
            }
        };
    }, []);
    return (
        <div ref={containerRef} id="game-container" className="w-full h-full">
            <Interface/>
            {countdown > 0 && <Countdown seconds={countdown} onComplete={() => setCountdown(0)} />}
            {!isReadyToPlay && (<MatchLoading players={playersInfo} />)}
        </div>
    );
}
