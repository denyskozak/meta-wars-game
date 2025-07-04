import React, {useLayoutEffect, useRef, useState, useEffect} from "react";
import gsap from "gsap";
import {
    MAX_HP,
    MAX_MANA,
    CLASS_MODELS,
    CLASS_STATS,
    MELEE_RANGE_ATTACK,
    MELEE_INDICATOR_RANGE,
    MELEE_ANGLE,
} from "../consts";
import { SPELL_COST, ASSET_BASE_URL } from '../consts';
import { assetUrl } from '../utilities/assets';
import * as THREE from "three";
import { Fire } from "../three/Fire";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import Stats from "three/examples/jsm/libs/stats.module";
import {Octree} from "three/examples/jsm/math/Octree";
import {OctreeHelper} from "three/examples/jsm/helpers/OctreeHelper";
import {Capsule} from "three/examples/jsm/math/Capsule";
import {CSS2DRenderer, CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {useRouter} from "next/navigation";

import {useCoins} from "../hooks/useCoins";
import {useInterface} from "../context/inteface";
import {useWS} from "../hooks/useWS";
import {world} from "../worlds/main/data";

// spell implementations
import castFireball, { meta as fireballMeta } from '../skills/mage/fireball';
import castIceball, { meta as iceballMeta } from '../skills/mage/iceball';
import castFireblast, { meta as fireblastMeta } from '../skills/mage/fireblast';
import castPyroblast, { meta as pyroblastMeta } from '../skills/mage/pyroblast';
import castFrostNova, { meta as frostNovaMeta } from '../skills/mage/frostNova';
import castBlink, { meta as blinkMeta } from '../skills/mage/blink';
import castShadowbolt, { meta as shadowboltMeta } from '../skills/warlock/shadowbolt';
import castCorruption, { meta as corruptionMeta } from '../skills/warlock/corruption';
import castLifeTap, { meta as lifeTapMeta } from '../skills/warlock/lifeTap';
import castChaosBolt, { meta as chaosBoltMeta } from '../skills/warlock/chaosBolt';
import castLifeDrain, { meta as lifeDrainMeta } from '../skills/warlock/lifeDrain';
import castFear, { meta as fearMeta } from '../skills/warlock/fear';
import { meta as lightStrikeMeta } from '../skills/paladin/lightStrike';
import castStun, { meta as stunMeta } from '../skills/paladin/stun';
import castPaladinHeal, { meta as paladinHealMeta } from '../skills/paladin/heal';
import { meta as lightWaveMeta } from '../skills/paladin/lightWave';
import castHandOfFreedom, { meta as handOfFreedomMeta } from '../skills/paladin/handFreedom';
import castDivineSpeed, { meta as divineSpeedMeta } from '../skills/paladin/divineSpeed';
import castBloodStrike, { meta as bloodStrikeMeta } from '../skills/rogue/bloodStrike';
import castEviscerate, { meta as eviscerateMeta } from '../skills/rogue/eviscerate';
import castKidneyStrike, { meta as kidneyStrikeMeta } from '../skills/rogue/kidneyStrike';
import castAdrenalineRush, { meta as adrenalineRushMeta } from '../skills/rogue/adrenalineRush';
import castSprint, { meta as sprintMeta } from '../skills/rogue/sprint';
import castShadowLeap, { meta as shadowLeapMeta } from '../skills/rogue/shadowLeap';
import castWarbringer, { meta as warbringerMeta } from '../skills/warrior/warbringer';
import { meta as savageBlowMeta } from '../skills/warrior/savageBlow';
import castHamstring, { meta as hamstringMeta } from '../skills/warrior/hamstring';
import castBladestorm, { meta as bladestormMeta } from '../skills/warrior/bladestorm';
import castBerserk, { meta as berserkMeta } from '../skills/warrior/berserk';
import castBloodthirst, { meta as bloodthirstMeta } from '../skills/warrior/bloodthirst';


import {Interface} from "@/components/layout/Interface";
import * as iceShieldMesh from "three/examples/jsm/utils/SkeletonUtils";
import {Loading} from "@/components/loading";
import { Countdown } from "./parts/Countdown.jsx";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const SPELL_ICONS = {
    [fireballMeta.id]: fireballMeta.icon,
    [iceballMeta.id]: iceballMeta.icon,
    [fireblastMeta.id]: fireblastMeta.icon,
    [pyroblastMeta.id]: pyroblastMeta.icon,
    [shadowboltMeta.id]: shadowboltMeta.icon,
    [corruptionMeta.id]: corruptionMeta.icon,
    [lifeTapMeta.id]: lifeTapMeta.icon,
    [chaosBoltMeta.id]: chaosBoltMeta.icon,
    [lifeDrainMeta.id]: lifeDrainMeta.icon,
    [fearMeta.id]: fearMeta.icon,
    [lightStrikeMeta.id]: lightStrikeMeta.icon,
    [stunMeta.id]: stunMeta.icon,
    [paladinHealMeta.id]: paladinHealMeta.icon,
    [lightWaveMeta.id]: lightWaveMeta.icon,
    [handOfFreedomMeta.id]: handOfFreedomMeta.icon,
    [divineSpeedMeta.id]: divineSpeedMeta.icon,
    [bloodStrikeMeta.id]: bloodStrikeMeta.icon,
    [eviscerateMeta.id]: eviscerateMeta.icon,
    [kidneyStrikeMeta.id]: kidneyStrikeMeta.icon,
    [adrenalineRushMeta.id]: adrenalineRushMeta.icon,
    [sprintMeta.id]: sprintMeta.icon,
    [shadowLeapMeta.id]: shadowLeapMeta.icon,
    [warbringerMeta.id]: warbringerMeta.icon,
    [savageBlowMeta.id]: savageBlowMeta.icon,
    [hamstringMeta.id]: hamstringMeta.icon,
    [bladestormMeta.id]: bladestormMeta.icon,
    [berserkMeta.id]: berserkMeta.icon,
    [bloodthirstMeta.id]: bloodthirstMeta.icon,
    [frostNovaMeta.id]: frostNovaMeta.icon,
    [blinkMeta.id]: blinkMeta.icon,
};

const SPELL_META = {
    [fireballMeta.id]: fireballMeta,
    [iceballMeta.id]: iceballMeta,
    [fireblastMeta.id]: fireblastMeta,
    [pyroblastMeta.id]: pyroblastMeta,
    [shadowboltMeta.id]: shadowboltMeta,
    [corruptionMeta.id]: corruptionMeta,
    [lifeTapMeta.id]: lifeTapMeta,
    [chaosBoltMeta.id]: chaosBoltMeta,
    [lifeDrainMeta.id]: lifeDrainMeta,
    [fearMeta.id]: fearMeta,
    [lightStrikeMeta.id]: lightStrikeMeta,
    [stunMeta.id]: stunMeta,
    [paladinHealMeta.id]: paladinHealMeta,
    [lightWaveMeta.id]: lightWaveMeta,
    [handOfFreedomMeta.id]: handOfFreedomMeta,
    [divineSpeedMeta.id]: divineSpeedMeta,
    [bloodStrikeMeta.id]: bloodStrikeMeta,
    [eviscerateMeta.id]: eviscerateMeta,
    [kidneyStrikeMeta.id]: kidneyStrikeMeta,
    [adrenalineRushMeta.id]: adrenalineRushMeta,
    [sprintMeta.id]: sprintMeta,
    [shadowLeapMeta.id]: shadowLeapMeta,
    [warbringerMeta.id]: warbringerMeta,
    [savageBlowMeta.id]: savageBlowMeta,
    [hamstringMeta.id]: hamstringMeta,
    [bladestormMeta.id]: bladestormMeta,
    [berserkMeta.id]: berserkMeta,
    [bloodthirstMeta.id]: bloodthirstMeta,
    [frostNovaMeta.id]: frostNovaMeta,
    [blinkMeta.id]: blinkMeta,
};

const SPELL_SCALES = {
    // fireball enlarged for better visuals
    fireball: 3,
    iceball: 1.8,
    shadowbolt: 1.68,
    pyroblast: 5,
    chaosBolt: 5.4,
};

const USER_DEFAULT_POSITION = [
    -36.198117096583466, 0.22499999997500564, -11.704829764915257,
];

const spawns = [
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
        let actions = [];
        let playerMixers = [];
        let settings;

        let meleeRangeIndicator = null;
        const MELEE_INDICATOR_OPACITY = 0.2; // transparency for the auto attack indicator
        const TARGET_INDICATOR_OPACITY = 0.4; // transparency for target highlight
        let targetIndicator = null;

        const createTargetIndicator = () => {
            const geometry = new THREE.RingGeometry(0.55, 0.7, 32);
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

        const damageBar = document.getElementById("damage");
        const selfDamage = document.getElementById("selfDamage");
        let targetedPlayerId = null;

        // Developer panel helpers
        const devDraco = new DRACOLoader();
        devDraco.setDecoderPath('/libs/draco/');
        const devLoader = new GLTFLoader().setPath(assetUrl('/models/'));
        devLoader.setDRACOLoader(devDraco);
        devLoader.setMeshoptDecoder(MeshoptDecoder);
        let currentScale = 0.4;

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
            const newModel = models[newModelName].clone();
            newModel.position.copy(oldModel.position);
            newModel.rotation.copy(oldModel.rotation);
            newModel.scale.set(currentScale, currentScale, currentScale);
            newModel.traverse((obj) => { if (obj.isMesh) obj.castShadow = true; });
            scene.remove(oldModel);
            scene.add(newModel);
            playerData.model = newModel;
            const cls = playerData.classType;
            const allowed = ['paladin', 'warrior', 'rogue'];
            if (allowed.includes(cls)) {
                if (!meleeRangeIndicator) {
                    meleeRangeIndicator = createMeleeIndicator();
                }
                newModel.add(meleeRangeIndicator);
                meleeRangeIndicator.scale.setScalar(1 / currentScale);
            } else if (meleeRangeIndicator) {
                meleeRangeIndicator.parent?.remove(meleeRangeIndicator);
                meleeRangeIndicator = null;
            }
        };

        window.addEventListener('DEV_SCALE_CHANGE', handleScaleChange);
        window.addEventListener('DEV_MODEL_CHANGE', handleModelChange);

        const activeShields = new Map(); // key = playerId
        const activeHandEffects = new Map(); // key = playerId -> { effectKey: {left, right} }
        const activeDamageEffects = new Map(); // key = playerId -> effect mesh
        const activeImmolation = new Map(); // key = playerId -> effect mesh
        const activeStunEffects = new Map(); // key = playerId -> {group, timeout}
        const activeFearEffects = new Map(); // key = playerId -> {group, timeout}
        const activeSlowEffects = new Map(); // key = playerId -> {mesh, timeout}
        const activeSprintTrails = new Map(); // key = playerId -> {mesh, start, duration, timeout}
        const activeBladestorms = new Map(); // key = playerId -> {start, duration, sound}
        const fearTexture = new THREE.TextureLoader().load(assetUrl('/icons/classes/warlock/possession.jpg'));

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
        const fireballMaterial = new THREE.ShaderMaterial({
            transparent: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                time: {value: 0},
                coreCol: {value: new THREE.Color(0xfff8d0)},
                flameCol: {value: new THREE.Color(0xff5500)},
                fireTex: {value: fireTexture},
            },
            vertexShader: /* glsl */`
                uniform float time;
                varying vec3 vPos;
                varying float vNoise;
                varying vec2 vUv;

                float hash(vec2 p){ return fract(sin(dot(p, vec2(41.0,289.0))) * 1e4); }
                float noise(vec2 p){
                  vec2 i = floor(p); p -= i;
                  vec2 u = p * p * (3.0 - 2.0 * p);
                  return mix( mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
                              mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x),
                              u.y );
                }

                void main(){
                  vPos = position;
                  vUv  = uv;
                  float n = noise(position.xy * 4.0 + time*2.0);
                  vNoise = n;
                  // keep sphere size static during flight
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: /* glsl */`
                uniform float time;
                uniform vec3  coreCol;
                uniform vec3  flameCol;
                uniform sampler2D fireTex;
                varying vec3  vPos;
                varying float vNoise;
                varying vec2  vUv;

                void main(){
                  float r = length(vPos.xy) / 0.15;
                  float core  = smoothstep(0.35, 0.0, r);
                  float flame = smoothstep(0.8, 0.2, r);

                  float flow = fract(vPos.z * 6.0 - time * 5.0);
                  float flicker = 0.5 + 0.5 * sin(time * 20.0 + vNoise * 6.283);
                  core  *= 0.9 + 0.1 * vNoise;
                  flame *= flow * flicker;

                  vec2 uv = vUv + vec2(0.0, time * -2.0);
                  vec3 texCol = texture2D(fireTex, uv).rgb;

                  vec3  col   = (coreCol * core + flameCol * flame) * texCol * 1.5;
                  float alpha = core + flame;

                if (alpha < 0.05) discard;
                gl_FragColor = vec4(col, alpha);
              }`
        });


        const fireballMesh = new THREE.Mesh(
            fireballGeometry,
            fireballMaterial
        );
        fireballMesh.scale.set(
            SPELL_SCALES.fireball,
            SPELL_SCALES.fireball,
            SPELL_SCALES.fireball * 1.3,
        );

        const pyroblastMesh = new THREE.Mesh(
            fireballGeometry,
            fireballMaterial.clone()
        );
        pyroblastMesh.scale.set(
            SPELL_SCALES.pyroblast,
            SPELL_SCALES.pyroblast,
            SPELL_SCALES.pyroblast,
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
        const darkballMesh = new THREE.Mesh(
            fireballGeometry,
            darkballMaterial
        );
        darkballMesh.scale.set(
            SPELL_SCALES.shadowbolt,
            SPELL_SCALES.shadowbolt,
            SPELL_SCALES.shadowbolt,
        );

        const chaosBoltMesh = new THREE.Mesh(
            fireballGeometry,
            darkballMaterial.clone()
        );
        chaosBoltMesh.scale.set(
            SPELL_SCALES.chaosBolt,
            SPELL_SCALES.chaosBolt,
            SPELL_SCALES.chaosBolt,
        );

        const iceballGeometry = new THREE.SphereGeometry(0.13, 16, 16); // Ледяной шар (увеличен на 30%)

        const iceTexture = textures.ice;
        iceTexture.wrapS = iceTexture.wrapT = THREE.RepeatWrapping;

        const iceballMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: {value: 0.0},
                color: {value: new THREE.Color(0x88ddff)},     // Более яркий синий
                glowColor: {value: new THREE.Color(0xffffff)}, // Усиленное свечение
                iceTex: {value: iceTexture},
            },
            vertexShader: `
    uniform float time;
    varying vec2 vUv;
    varying float vNoise;
    float noise3(vec3 p){
      return sin(p.x)*sin(p.y)*sin(p.z);
    }
    void main(){
      vUv = uv;
      float n = noise3(position*10.0 + time*2.0);
      vNoise = n;
      // keep sphere size static during flight
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
            fragmentShader: `
    uniform float time;
    uniform vec3 color;
    uniform vec3 glowColor;
    uniform sampler2D iceTex;
    varying vec2 vUv;
    varying float vNoise;

    void main(){
      float dist = distance(vUv, vec2(0.5));

      float core = smoothstep(0.45, 0.0, dist);
      float glow = smoothstep(0.75, 0.25, dist) *
                   (0.5 + 0.5 * abs(sin(time * 4.0 + vNoise * 3.1415)));

      vec2 uv = vUv * 2.0 + vec2(time * -0.5, 0.0);
      vec3 texCol = texture2D(iceTex, uv).rgb;
      vec3 finalColor = (color * core + glowColor * glow) * texCol * 1.5;

      float alpha = clamp(core + glow * 0.8, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
            transparent: false,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const iceballMesh = new THREE.Mesh(iceballGeometry, iceballMaterial.clone());
        iceballMesh.scale.set(
            SPELL_SCALES.iceball,
            SPELL_SCALES.iceball,
            SPELL_SCALES.iceball * 1.3,
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
            iceball: 3000,
            fireblast: 6000,
            chaosbolt: 6000,
            lifedrain: 0,
            fear: 45000,
            'ice-shield': 30000,
            pyroblast: 15000,
            blink: 10000,
            heal: 0,
            lightstrike: 2000,
            stun: 50000,
            'paladin-heal': 20000,
            lightwave: 5000,
            frostnova: 15000,
            'hand-of-freedom': 15000,
            'divine-speed': 20000,
            'blood-strike': 1000,
            eviscerate: 10000,
            'kidney-strike': 15000,
            'adrenaline-rush': 45000,
            sprint: 20000,
            'shadow-leap': 12000,
            'warbringer': 10000,
            'savage-blow': 0,
            'hamstring': 10000,
            'bladestorm': 40000,
            'berserk': 45000,
            'bloodthirst': 30000,
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

        // const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);

        // fillLight1.position.set(2, 1, 1);
        // scene.add(fillLight1);

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
            const light = new THREE.PointLight(color, 1, 5);
            temp.add(light);
            scene.add(temp);
            renderer.compile(scene, camera);
            scene.remove(temp);
        }

        preloadMesh(fireballMesh, 0xffaa33);
        preloadMesh(pyroblastMesh, 0xffaa33);
        preloadMesh(chaosBoltMesh, 0x8a2be2);
        preloadMesh(darkballMesh, 0x8a2be2);
        preloadMesh(iceballMesh, 0x88ddff);

        const stats = new Stats();

        stats.domElement.style.position = "absolute";
        stats.domElement.style.top = "0px";


        const GRAVITY = 20;

        const NUM_SPHERES = 100;
        const BASE_SPHERE_RADIUS = 0.26;
        const SPHERE_RADIUS = BASE_SPHERE_RADIUS * SPELL_SCALES.fireball;
        const SPHERE_SPAWN_OFFSET = playerCollider.radius + SPHERE_RADIUS;

        const FIREBLAST_RANGE = 20;
        const FIREBLAST_DAMAGE = 33;

        const FIREBALL_DAMAGE = 40;
        const PYROBLAST_DAMAGE = FIREBALL_DAMAGE * 1.4;
        const CHAOSBOLT_DAMAGE = FIREBALL_DAMAGE * 2;
        const ICEBALL_DAMAGE = 35;
        const DARKBALL_DAMAGE = 30;
        const LIFEDRAIN_DAMAGE = 30;
        const FROSTNOVA_DAMAGE = 20;
        const FROSTNOVA_RANGE = MELEE_RANGE_ATTACK;
        const FROSTNOVA_RING_DURATION = 500; // ms, faster nova
        const LIGHTWAVE_RING_DURATION = 1000; // ms
        const LIGHTWAVE_RANGE = MELEE_RANGE_ATTACK;
        const LIGHTSTRIKE_DAMAGE = 35; // reduced by 15%
        const LIGHTWAVE_DAMAGE = 40;
        const STUN_SPIN_SPEED = 2;
        const FEAR_SPIN_SPEED = 1.5;
        const SLOW_SPIN_SPEED = 1;
        const BLADESTORM_DAMAGE = 10;

        // Медленнее пускаем сферы как настоящие заклинания
        const MIN_SPHERE_IMPULSE = 6;
        const MAX_SPHERE_IMPULSE = 12;

        // Maximum distance any sphere can travel
        // Use the same range as fireblast for consistency
        const SPHERE_MAX_DISTANCE = FIREBLAST_RANGE / 2;

        // Number of sprites used for the fireball tail
        const FIREBALL_TAIL_SEGMENTS = 8;

        const SPELL_TAIL_COLORS = {
            fireball: 0xff6600,
            iceball: 0x88ddff,
            pyroblast: 0xff6600,
            shadowbolt: 0xb84dff,
            chaosbolt: 0xb84dff,
        };

        const STEPS_PER_FRAME = 30;

        const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
        const sphereMaterial = new THREE.MeshLambertMaterial({color: 0xdede8d});

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

        const worldOctree = new Octree();

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
        const frostNovaRings = [];
        const lightWaveRings = [];

        // Crosshair elements
        const target = document.getElementById("target");
        const targetImage = document.getElementById("targetImage");
        let isFocused = false;
        let isCameraDragging = false;

        const AIM_BEAM_OPACITY = 0.5;
        const AIM_BEAM_LENGTH = SPHERE_MAX_DISTANCE * 1.5;
        let aimBeam = null;

        function createAimBeam() {
            const material = new THREE.LineBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: AIM_BEAM_OPACITY,
                depthWrite: false,
            });
            const geometry = new THREE.BufferGeometry();
            geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
            return new THREE.Line(geometry, material);
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
            const positions = aimBeam.geometry.attributes.position.array;
            positions[0] = start.x;
            positions[1] = start.y;
            positions[2] = start.z;
            positions[3] = end.x;
            positions[4] = end.y;
            positions[5] = end.z;
            aimBeam.geometry.attributes.position.needsUpdate = true;
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
        let yaw = 3;
        let pitch = 0;
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
            ).multiplyScalar(1.2);

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
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) && setAnimation("walk");
        }
        function handleKeyA() {
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) && setAnimation("walk");
        }
        function handleKeyD() {
            !isCasting && !isActionRunning(PRIORITY_ACTIONS) && setAnimation("walk");
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
            else castSpell('iceball');
        }
        function handleKeyF() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('chaosbolt');
            else if (className === 'paladin') castSpell('lightwave');
            else if (className === 'rogue') castSpell('kidney-strike');
            else if (className === 'warrior') castSpell('hamstring');
            else castSpell('blink');
        }
        function handleDigit3() {
            const className = character?.name?.toLowerCase();
            if (className === 'mage') castSpell('fireblast');
            else if (className === 'paladin') castSpell('hand-of-freedom');
            else if (className === 'warlock') castSpell('fear');
            else if (className === 'rogue') castSpell('sprint');
            else if (className === 'warrior') castSpell('bloodthirst');

        }
        function handleDigit2() {
            const className = character?.name?.toLowerCase();
            if (className === 'mage') castSpell('pyroblast');
            else if (className === 'paladin') castSpell('divine-speed');
            else if (className === 'warlock') castSpell('lifedrain');
            else if (className === 'rogue') castSpell('adrenaline-rush');
            else if (className === 'warrior') castSpell('berserk');

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
            else if (className === 'rogue') castSpell('shadow-leap');
            else if (className === 'warrior') castSpell('bladestorm');
            else castSpell('frostnova');
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
            Digit3: handleDigit3,
            Digit2: handleDigit2,
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
            'Digit3',
            'Digit2',
            'KeyQ',
        ]);

        document.addEventListener("keydown", (event) => {
            if (event.code === "Escape") {
                handleEscape();
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
                if (!isFocused && document.pointerLockElement !== containerRef.current) {
                    isCameraDragging = true;
                }
                // const id = getTargetPlayer();
                // if (id) {
                //     targetedPlayerId = id;
                //     dispatchTargetUpdate();
                // } else {
                //     targetedPlayerId = null;
                //     dispatchTargetUpdate();
                // }

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
            if (!locked && !isCameraDragging) return;

            yaw -= event.movementX / 500;
            pitch = Math.max(
                -Math.PI / 2,
                Math.min(Math.PI / 2, pitch + event.movementY / 500),
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

            // When aiming down sights, align projectiles with the on screen crosshair
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
                const dir = new THREE.Vector3(
                    Math.sin(player.model.rotation.y),
                    0,
                    Math.cos(player.model.rotation.y),
                );
                return dir.normalize();
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
                targetImage.src = assetUrl('/icons/target.svg');
                return;
            }
            const id = getTargetPlayer();
            if (id && players.has(id) && hasLineOfSight(id)) {
                const start = playerCollider.start
                    .clone()
                    .add(playerCollider.end)
                    .multiplyScalar(0.5);
                const targetPos = players.get(id).model.position.clone();
                const dist = start.distanceTo(targetPos);
                if (dist <= FIREBLAST_RANGE) {
                    targetImage.src = assetUrl('/icons/target-green.svg');
                } else {
                    targetImage.src = assetUrl('/icons/target.svg');
                }
            } else {
                targetImage.src = assetUrl('/icons/target.svg');
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
                    castDarkball({
                        playerId,
                        castSpellImpl,
                        igniteHands: darkHands,
                        castSphere,
                        darkballMesh,
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
                case "chaosbolt":
                    castChaosBolt({
                        playerId,
                        castSpellImpl,
                        igniteHands: darkHands,
                        castSphere,
                        chaosBoltMesh,
                        sounds,
                        damage: CHAOSBOLT_DAMAGE,
                    });
                    break;
                case "fear":
                    castFear({
                        playerId,
                        castSpellImpl,
                        mana,
                        getTargetPlayer,
                        dispatch,
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
                case "shadowbolt":
                    darkHands(playerId, 1000);
                    castSpellImpl(
                        playerId,
                        30,
                        1000,
                        (model) => castSphere(model, darkballMesh.clone(), spellType, DARKBALL_DAMAGE),
                        sounds.fireballCast,
                        sounds.fireball,
                        'shadowbolt',
                        false
                    )
                    break;
                case "fireblast":
                    castFireblast({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        getTargetPlayer,
                        dispatch,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        FIREBLAST_DAMAGE,
                        sounds,
                    });
                    break;
                case "iceball":
                    castIceball({
                        playerId,
                        castSpellImpl,
                        freezeHands,
                        castSphere,
                        iceballMesh,
                        sounds,
                        damage: ICEBALL_DAMAGE,
                    });
                    break;
                case "pyroblast":
                    castPyroblast({
                        playerId,
                        castSpellImpl,
                        igniteHands,
                        castSphere,
                        pyroblastMesh,
                        sounds,
                        damage: PYROBLAST_DAMAGE,
                    });
                    break;
                case "frostnova":
                    castFrostNova({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    spawnFrostNovaRing(playerId);
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
                case "chaosbolt":
                    castChaosBolt({
                        playerId,
                        castSpellImpl,
                        igniteHands: darkHands,
                        castSphere,
                        chaosBoltMesh,
                        sounds,
                        damage: CHAOSBOLT_DAMAGE,
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
                case "hand-of-freedom":
                    castHandOfFreedom({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
                    applyFreedomEffect(playerId, 5000);
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
                case "adrenaline-rush":
                    castAdrenalineRush({
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        sounds,
                    });
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
                case "shadow-leap":
                    castShadowLeap({
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
                        players,
                        teleportTo,
                        playerCollider,
                        worldOctree,
                        FIREBLAST_RANGE,
                    });
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
                case "hamstring":
                    castHamstring({
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
                case "berserk":
                    castBerserk({
                        playerId,
                        globalSkillCooldown,
                        isCasting,
                        mana,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                        igniteHands,
                        sounds,
                    });
                    applySpeedEffect(playerId, 6000, 1.5);
                    applyFreedomEffect(playerId, 6000);
                    spawnSprintTrail(playerId, 6000);
                    break;
                case "bloodthirst":
                    castBloodthirst({
                        globalSkillCooldown,
                        isCasting,
                        sendToSocket,
                        activateGlobalCooldown,
                        startSkillCooldown,
                    });
                    break;
                case "lightwave":
                    performLightWave();
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

            controlAction({
                action: actions['attack'],
                actionName: 'attack',
                mixer,
                loop: THREE.LoopOnce,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
            });

            sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightstrike' } });
            activateGlobalCooldown();
            startSkillCooldown('lightstrike');
        }

        function performLightWave() {
            const playerData = players.get(myPlayerId);
            if (!playerData) return;
            const { mixer, actions } = playerData;

            spawnLightWaveRing(myPlayerId);

            controlAction({
                action: actions['attack360'] || actions['attack'],
                actionName: 'attack360',
                mixer,
                loop: THREE.LoopOnce,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
            });

            sendToSocket({ type: 'CAST_SPELL', payload: { type: 'lightwave' } });
            activateGlobalCooldown();
            startSkillCooldown('lightwave');
        }


        function performSavageBlow() {
            const playerData = players.get(myPlayerId);
            if (!playerData) return;
            const { mixer, actions } = playerData;


            lightSword(myPlayerId, 500);

            controlAction({
                action: actions['attack'],
                actionName: 'attack',
                mixer,
                loop: THREE.LoopOnce,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
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


        function createSphereTail(color) {
            const tailSprites = [];
            const tailPositions = [];
            for (let i = 0; i < FIREBALL_TAIL_SEGMENTS; i++) {
                const scale = 0.15 * (1 - i / FIREBALL_TAIL_SEGMENTS);
                const sprite = makeGlowSprite(color, scale);
                sprite.visible = false;
                scene.add(sprite);
                tailSprites.push(sprite);
            }
            return { tailSprites, tailPositions };
        }


        function castSphere(model, sphereMesh, type, damage) {
            sphereMesh.rotation.copy(model.rotation);

            if (sphereMesh instanceof Fire) {
                sphereMesh.lookAt(camera.position);
            }

            let tailSprites = null;
            let tailPositions = null;
            const tailColor = SPELL_TAIL_COLORS[type];
            if (tailColor !== undefined) {
                ({ tailSprites, tailPositions } = createSphereTail(tailColor));
            }

            scene.add(sphereMesh); // Add the sphereMesh to the scene


            // Compute aim direction based on camera ray and player position
            const aimDir = getAimDirection();

            const initialPosition = playerCollider.start
                .clone()
                .add(playerCollider.end)
                .multiplyScalar(0.5)
                .addScaledVector(aimDir, SPHERE_SPAWN_OFFSET);

            sphereMesh.position.copy(initialPosition);

            // Calculate smoother impulse using cubic easing
            const chargeTime = Math.min(performance.now() - mouseTime, 1000); // Cap charge time to 1 second
            const chargeFactor = chargeTime / 1000; // Normalize to range [0, 1]
            const impulse = THREE.MathUtils.lerp(
                MIN_SPHERE_IMPULSE,
                MAX_SPHERE_IMPULSE,
                chargeFactor * chargeFactor * (3 - 2 * chargeFactor),
            ); // Smoothstep with more power

            const velocity = aimDir.clone().multiplyScalar(impulse);

            // Send the fireball data to the server
            sendToSocket({
                type: "CAST_SPELL",
                payload: {
                    type,
                    damage,
                    position: {
                        x: sphereMesh.position.x,
                        y: sphereMesh.position.y,
                        z: sphereMesh.position.z,
                    },
                    rotation: {
                        x: sphereMesh.rotation.x,
                        y: sphereMesh.rotation.y,
                        z: sphereMesh.rotation.z,
                    },
                    velocity: {x: velocity.x, y: velocity.y, z: velocity.z},
                },
            });

            // Store velocity and collider information for the fireball
            spheres.push({
                mesh: sphereMesh,
                collider: new THREE.Sphere(
                    new THREE.Vector3().copy(sphereMesh.position),
                    SPHERE_RADIUS,
                ),
                velocity: velocity,
                initialPosition: initialPosition,
                type,
                damage,
                ownerId: myPlayerId,
                tailSprites,
                tailPositions,
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
                soundCast.pause();
                isCasting = false;
                hideAimBeam();
                execute();
            };

            isCasting = true;
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
            setTimeout(() => {
                const actionName = 'castEnd';
                controlAction({
                    action: actions['castEnd'],
                    actionName,
                    mixer: mixer,
                    loop: THREE.LoopOnce,
                    fadeIn: 0.1,
                    reset: true,
                    clampWhenFinished: true,
                });
            }, duration * 0.5);
            dispatchEvent('start-cast', { duration, onEnd: onCastEnd, icon: SPELL_META[spellType]?.icon, name: spellType });
        }

        function playerCollisions() {
            const result = worldOctree.capsuleIntersect(playerCollider);

            playerOnFloor = false;

            if (result) {
                playerOnFloor = result.normal.y > 0;

                if (!playerOnFloor) {
                    playerVelocity.addScaledVector(
                        result.normal,
                        -result.normal.dot(playerVelocity),
                    );
                }

                if (result.depth >= 1e-10) {
                    playerCollider.translate(result.normal.multiplyScalar(result.depth));
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

            playerCollisions();
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
                const damage = sphere.damage;
                if (sphere.type === 'fireball') {
                    applyImmolationEffect(myPlayerId, 1000);
                } else if (sphere.type === 'iceball') {
                    applySlowEffect(myPlayerId, 3000);
                }
                takeDamage(damage, userIdTouched, sphere.type);
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
            if (sphere.tailSprites) {
                sphere.tailSprites.forEach((s) => scene.remove(s));
            }
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

                if (sphere.tailSprites) {
                    sphere.tailPositions.unshift(sphere.collider.center.clone());
                    if (sphere.tailPositions.length > FIREBALL_TAIL_SEGMENTS) {
                        sphere.tailPositions.pop();
                    }
                    sphere.tailSprites.forEach((s, i) => {
                        const pos = sphere.tailPositions[i];
                        if (pos) {
                            s.visible = true;
                            s.position.copy(pos);
                            s.lookAt(camera.position);
                            s.material.opacity = 1 - i / FIREBALL_TAIL_SEGMENTS;
                        } else {
                            s.visible = false;
                        }
                    });
                }
            }

            // spheresCollisions(); // Handle collisions between spheres

           for (let sphere of spheres) {
                sphere.mesh?.position.copy(sphere.collider?.center); // TODO fix
                if (sphere.type === 'pyroblast') {
                    sphere.mesh.lookAt(camera.position);
                }
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
                if (!isAnyActionRunning()) setAnimation("walk");
            }

            if (keyStates["KeyD"]) {
                playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("walk");
            }

            if (keyStates["KeyW"]) {
                let y = 0;

                if (document.pointerLockElement !== containerRef.current) {
                    y = model.rotation.y;
                } else {
                    const cameraDirection = new THREE.Vector3();

                    camera.getWorldDirection(cameraDirection);

                    // Calculate the direction the player is moving (opposite to camera's forward)
                    y = Math.atan2(
                        cameraDirection.x,
                        cameraDirection.z,
                    );
                }


                const forwardVector = new THREE.Vector3(
                    Math.sin(y),
                    0,
                    Math.cos(y),
                );
                playerVelocity.add(forwardVector.multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("walk");
            }

            if (keyStates["KeyS"]) {
                const backwardVector = new THREE.Vector3(
                    -Math.sin(model.rotation.y),
                    0,
                    -Math.cos(model.rotation.y),
                );

                playerVelocity.add(backwardVector.multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("walk");
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

        const helper = new OctreeHelper(worldOctree);

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

        function freezeHands(playerId, duration = 1000) {
            applyHandEffect(playerId, 'ice', () => {
                const left = new THREE.Mesh(iceballGeometry, iceballMaterial.clone());
                const right = new THREE.Mesh(iceballGeometry, iceballMaterial.clone());
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
            console.log("activeImmolation: after update ", activeImmolation);
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
                setTimeout(() => (movementSpeedModifier = 1), duration);
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

        function applyFearEffect(playerId, duration = 3000) {
            const existing = activeFearEffects.get(playerId);
            if (existing) {
                existing.group.parent?.remove(existing.group);
                clearTimeout(existing.timeout);
            }

            const group = new THREE.Group();
            const count = 3;
            for (let i = 0; i < count; i++) {
                const material = new THREE.SpriteMaterial({
                    map: fearTexture,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                });
                const sprite = new THREE.Sprite(material);
                sprite.scale.set(1, 1, 1);
                const angle = (i / count) * Math.PI * 2;
                sprite.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
                group.add(sprite);
            }

            scene.add(group);

            const timeout = setTimeout(() => {
                group.parent?.remove(group);
                activeFearEffects.delete(playerId);
            }, duration);

            activeFearEffects.set(playerId, { group, timeout });
        }

        function spawnFrostNovaRing(playerId, duration = FROSTNOVA_RING_DURATION) {
            const player = players.get(playerId)?.model;
            if (!player) return;

            const position = new THREE.Vector3();
            player.getWorldPosition(position);
            position.y += 0.1;

            const geometry = new THREE.RingGeometry(0.5, 1.0, 64);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    tex: { value: textures.ice },
                },
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                vertexShader: `
                    varying vec2 vUv;
                    void main(){
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform sampler2D tex;
                    varying vec2 vUv;
                    void main(){
                        vec2 uv = vUv - 0.5;
                        float angle = atan(uv.y, uv.x) + time * 2.0;
                        float radius = length(uv);
                        uv = vec2(cos(angle), sin(angle)) * radius + 0.5;
                        vec4 col = texture2D(tex, uv);
                        float alpha = smoothstep(0.1, 0.2, radius) * (1.0 - smoothstep(0.7, 0.9, radius));
                        gl_FragColor = vec4(col.rgb, col.a * alpha);
                    }
                `,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.copy(position);
            // begin at scale 0 so the nova expands from the player
            mesh.scale.setScalar(0);

            scene.add(mesh);
            frostNovaRings.push({ mesh, start: performance.now(), duration });
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

            controlAction({
                action: actions['attack360'] || actions['attack'],
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
                // Rotate the model to match the camera direction
                const locked = document.pointerLockElement === containerRef.current;
                if (locked || !isCameraDragging) {
                    model.rotation.y = yaw + Math.PI;
                }
                // Get the camera's forward direction

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
            spheres.forEach(s => {
                if (s.mesh?.material?.uniforms?.time) {
                    s.mesh.material.uniforms.time.value += delta;
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
                    updateSpheres(deltaTime);

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

                   activeFearEffects.forEach((obj, id) => {
                       const target = players.get(id)?.model;
                       if (!target) return;
                       target.getWorldPosition(obj.group.position);
                       obj.group.position.y += 2;
                       obj.group.rotation.y += delta * FEAR_SPIN_SPEED;
                   });

                    activeSlowEffects.forEach((obj, id) => {
                        const target = players.get(id)?.model;
                        if (!target) return;
                        target.getWorldPosition(obj.mesh.position);
                        obj.mesh.position.y += 0.1;
                        obj.mesh.rotation.z += delta * SLOW_SPIN_SPEED;
                    });

                    for (let i = frostNovaRings.length - 1; i >= 0; i--) {
                        const effect = frostNovaRings[i];
                        const elapsed = performance.now() - effect.start;
                        const progress = elapsed / effect.duration;
                        // expand from the player out to the melee range
                        effect.mesh.scale.setScalar(FROSTNOVA_RANGE * progress);
                        effect.mesh.material.opacity = 0.8 * (1 - progress);
                        if (effect.mesh.material.uniforms?.time) {
                            effect.mesh.material.uniforms.time.value += delta;
                        }
                        if (progress >= 1) {
                            scene.remove(effect.mesh);
                            frostNovaRings.splice(i, 1);
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

                    runes.forEach(r => {
                        const speed = r.userData.type === 'damage' ? 0.025 : 0.1;
                        r.rotation.y += delta * speed;
                    });

                    xpRunes.forEach(r => {
                        r.rotation.y += delta * 0.1;
                    });

                    // renderCursor();
                    updateCameraPosition();
                    highlightCrosshair();
                    if (aimBeam) updateAimBeam();
                }

                teleportPlayerIfOob();

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
        function buildActions(mixer, animations) {
            const get = (...names) => {
                const lowerNames = names.map(n => n.toLowerCase());
                const clip = animations.find(c => lowerNames.includes(c.name.toLowerCase()));
                return clip ? mixer.clipAction(clip) : null;
            };

            const actions = {
                idle: get('idle'),
                walk: get('walk'),
                run: get('run', 'walk'),
                jump: get('jump'),
                casting: get('casting'),
                castEnd: get('cast_end', 'castEnd'),
                cast: get('cast'),
                dying: get('dying'),
                hitReaction: get('hit_reaction'),
                attack: get('attack'),
                attack360: get('attack_360'),
            };

            // Speed up attack animations
            if (actions.attack) actions.attack.timeScale *= 2;
            if (actions.attack360) actions.attack360.timeScale *= 2;

            return actions;
        }

        function createPlayer(id, name = "", address = "", classType = "", characterModel = "vampir") {
            const baseModel = models[characterModel] || models['character'];
            if (baseModel) {
                const player = SkeletonUtils.clone(baseModel);
                player.position.set(...USER_DEFAULT_POSITION);

                player.scale.set(currentScale, currentScale, currentScale);
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
                // Create a DOM element for the player's name
                // const nameDiv = document.createElement('div');
                // nameDiv.className = 'name-label';
                // nameDiv.textContent = name;
                // nameDiv.style.color = 'white';
                // nameDiv.style.fontSize = '12px';
                // nameDiv.style.textAlign = 'center';
                //
                // // Attach the name label to the player
                // const nameLabel = new CSS2DObject(nameDiv);
                // nameLabel.position.set(0, 2, 0); // Adjust position above the player model
                // player.add(nameLabel);

                const mixer = new THREE.AnimationMixer(player);
                mixer.timeScale = 40;
                // const idle = mixer.clipAction(animations[2]).play();
                // const walk = mixer.clipAction(animations[6]);
                console.log("animations: ", animations);
                const actions = buildActions(mixer, animations);


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
            const {model, position, rotation} = p;
            model.position.set(position.x, position.y, position.z);
            model.rotation.y = rotation?.y;
        }

        function createRune(data) {
            const modelId = `${data.type}_rune`;
            const base = models[modelId];
            if (!base) return;
            const rune = SkeletonUtils.clone(base);
            rune.position.set(data.position.x, data.position.y, data.position.z);
            // Scale runes down by 30%
            rune.scale.multiplyScalar(0.14);
            // lower the rune slightly so it sits closer to the ground
            rune.position.y -= 0.2;
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
            rune.scale.multiplyScalar(0.028);
            rune.position.y -= 0.2;
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

        // Function to remove a player from the scene
        function removePlayer(id) {
            if (players.has(id)) {
                const data = players.get(id);
                if (data.model) scene.remove(data.model);
                players.delete(id);
                if (id === myPlayerId && meleeRangeIndicator) {
                    meleeRangeIndicator.parent?.remove(meleeRangeIndicator);
                    meleeRangeIndicator = null;
                }
                if (id === targetedPlayerId) {
                    targetedPlayerId = null;
                    dispatchTargetUpdate();
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

        function castSphereOtherUser(data, ownerId) {
            let sphere;
            if (data.type === "fireball") {
                sphere = fireballMesh.clone();
            } else if (data.type === "shadowbolt") {
                sphere = darkballMesh.clone();
            } else if (data.type === "pyroblast") {
                sphere = pyroblastMesh.clone();
            } else if (data.type === "chaosbolt") {
                sphere = chaosBoltMesh.clone();
            } else if (data.type === "iceball") {
                sphere = iceballMesh.clone();
            } else {
                sphere = new THREE.Mesh(fireballGeometry, iceballMaterial.clone());
            }

            sphere.position.set(
                data.position.x,
                data.position.y,
                data.position.z,
            );
            sphere.rotation.set(
                data.rotation.x,
                data.rotation.y,
                data.rotation.z,
            );

            let tailSprites = null;
            let tailPositions = null;
            const tailColor = SPELL_TAIL_COLORS[data.type];
            if (tailColor !== undefined) {
                ({ tailSprites, tailPositions } = createSphereTail(tailColor));
            }

            scene.add(sphere);

            spheres.push({
                mesh: sphere,
                collider: new THREE.Sphere(
                    new THREE.Vector3().copy(sphere.position),
                    SPHERE_RADIUS,
                ),
                velocity: new THREE.Vector3(
                    data.velocity.x,
                    data.velocity.y,
                    data.velocity.z,
                ),
                type: data.type,
                damage: data.damage,
                ownerId,
                tailSprites,
                tailPositions,
            });
        }

        function castShieldOtherUser() {
        }

        // Handle incoming messages from the server
        const handleMessage = async (event) => {
            let message = JSON.parse(event.data);

            switch (message.type) {
                case "GET_MATCH":
                    if (message.match && Array.isArray(message.match.players)) {
                        message.match.players.forEach(([pid, pdata]) => {
                            const id = Number(pid);
                            if (players.has(id)) {
                                players.get(id).classType = pdata.classType;
                                players.get(id).character = pdata.character;
                            } else {
                                players.set(id, { classType: pdata.classType, character: pdata.character });
                            }
                        });
                    }
                    break;
                case "CAST_SPELL":
                    switch (message?.payload?.type) {
                        case "fireball":
                            igniteHands(message.id, 1000);
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "shadowbolt":
                            igniteHands(message.id, 1000);
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "iceball":
                            freezeHands(message.id, 1000);
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "iceball-hit":
                            if (message.payload.targetId === myPlayerId) {
                                applySlowEffect(myPlayerId, 3000);
                            }
                            break;
                        case "shield":
                            castShieldOtherUser(message.payload, message.id)
                            break;
                        case "fireblast":
                            if (message.payload.targetId === myPlayerId) {
                                takeDamage(message.payload.damage, message.id, 'fireblast');
                            }
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
                        case "fear":
                            if (message.payload.targetId === myPlayerId) {
                                applyRootEffect(myPlayerId, 3000);
                            }
                            if (message.payload.targetId) {
                                applyFearEffect(message.payload.targetId, 3000);
                            }
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
                        case "chaosbolt":
                            igniteHands(message.id, 1000);
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "pyroblast":
                            igniteHands(message.id, 1000);
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "frostnova":
                            spawnFrostNovaRing(message.id);
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                if (caster) {
                                    const myPos = players.get(myPlayerId)?.model.position.clone();
                                    const casterPos = caster.model.position.clone();
                                    if (myPos && casterPos && myPos.distanceTo(casterPos) < FROSTNOVA_RANGE) {
                                        applyRootEffect(myPlayerId, 3000);
                                        takeDamage(FROSTNOVA_DAMAGE, message.id, 'frostnova');
                                    }
                                }
                            }
                            break;
                        case "paladin-heal":
                            if (message.id === myPlayerId) {
                                dispatch({ type: "SEND_CHAT_MESSAGE", payload: "You are healed!" });
                            }
                            break;
                        case "hand-of-freedom":
                            if (message.id === myPlayerId) {
                                applyFreedomEffect(myPlayerId, 5000);
                            }
                            break;
                        case "divine-speed":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 5000, 2);
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
                        case "adrenaline-rush":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 8000);
                            }
                            break;
                        case "sprint":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 4000, 2);
                                spawnSprintTrail(myPlayerId, 4000);
                            }
                            break;
                        case "shadow-leap":
                            if (sounds.shadowLeap) {
                                sounds.shadowLeap.currentTime = 0;
                                sounds.shadowLeap.volume = 0.5;
                                sounds.shadowLeap.play();
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
                        case "hamstring":
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                const me = players.get(myPlayerId);
                                if (caster && me) {
                                    const origin = caster.model.position.clone();
                                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(caster.model.quaternion);
                                    const toMe = me.model.position.clone().sub(origin);
                                    const distance = toMe.length();
                                    if (distance < MELEE_RANGE_ATTACK && forward.angleTo(toMe.normalize()) < MELEE_ANGLE) {
                                        applySlowEffect(myPlayerId, 5000, 0.3);
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
                        case "berserk":
                            igniteHands(message.id, 1000);
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 6000, 1.5);
                                applyFreedomEffect(myPlayerId, 6000);
                                spawnSprintTrail(myPlayerId, 6000);
                            }
                            break;
                        case "bloodthirst":
                            break;
                        case "lightwave":
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                if (caster) {
                                    spawnLightWaveRing(message.id);
                                    const myPos = players.get(myPlayerId)?.model.position.clone();
                                    const casterPos = caster.model.position.clone();
                                    if (myPos && casterPos && myPos.distanceTo(casterPos) < MELEE_RANGE_ATTACK) {
                                        takeDamage(LIGHTWAVE_DAMAGE, message.id, 'lightwave');
                                    }
                                }
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
                    if (message.targetId && (message.targetId === myPlayerId || message.dealerId === myPlayerId)) {
                        showDamage(message.targetId, message.amount, message.spellType);
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

                    console.log("MATCH_READY: ", message);
                    myPlayerId = message.myPlayerId;
                    message.players.forEach(([playerId, playerOptions]) => {
                        const cls = playerOptions?.classType || "";
                        const charModel = playerOptions?.character || CLASS_MODELS[cls] || 'vampir';
                        createPlayer(Number(playerId), String(playerId), String(playerId), cls, charModel);
                    })
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
        };
    }, []);
    return (
        <div ref={containerRef} id="game-container" className="w-full h-full">
            <Interface/>
            {countdown > 0 && <Countdown seconds={countdown} onComplete={() => setCountdown(0)} />}
            {!isReadyToPlay && (<Loading text="Wait Other Players ..."/>)}
        </div>
    );
}
