import React, {useLayoutEffect, useRef, useState, useEffect} from "react";
import {MAX_HP, MAX_MANA} from "../consts";
import { SPELL_COST } from '../consts';
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
import castDarkball, { meta as darkballMeta } from '../skills/warlock/darkball';
import castCorruption, { meta as corruptionMeta } from '../skills/warlock/corruption';
import castImmolate, { meta as immolateMeta } from '../skills/warlock/immolate';
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


import {Interface} from "@/components/layout/Interface";
import * as iceShieldMesh from "three/examples/jsm/utils/SkeletonUtils";
import {Loading} from "@/components/loading";
import { Countdown } from "./parts/Countdown";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const SPELL_ICONS = {
    [fireballMeta.id]: fireballMeta.icon,
    [iceballMeta.id]: iceballMeta.icon,
    [fireblastMeta.id]: fireblastMeta.icon,
    [pyroblastMeta.id]: pyroblastMeta.icon,
    [darkballMeta.id]: darkballMeta.icon,
    [corruptionMeta.id]: corruptionMeta.icon,
    [immolateMeta.id]: immolateMeta.icon,
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
    [frostNovaMeta.id]: frostNovaMeta.icon,
    [blinkMeta.id]: blinkMeta.icon,
};

const SPELL_META = {
    [fireballMeta.id]: fireballMeta,
    [iceballMeta.id]: iceballMeta,
    [fireblastMeta.id]: fireblastMeta,
    [pyroblastMeta.id]: pyroblastMeta,
    [darkballMeta.id]: darkballMeta,
    [corruptionMeta.id]: corruptionMeta,
    [immolateMeta.id]: immolateMeta,
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
    [frostNovaMeta.id]: frostNovaMeta,
    [blinkMeta.id]: blinkMeta,
};

const SPELL_SCALES = {
    fireball: 2.34, // increased by 30%
    iceball: 1.8,
    darkball: 1.68,
    pyroblast: 5,
    chaosBolt: 5.4,
};

const USER_DEFAULT_POSITION = [
    -36.198117096583466, 0.22499999997500564, -11.704829764915257,
];

const spawns = [
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

        let hp = MAX_HP,
            mana = MAX_MANA,
            points = 0,
            level = 1;
        let actions = [];
        let playerMixers = [];
        let settings;
        let leftMouseButtonClicked = false;

        let movementSpeedModifier = 1; // Normal speed

        const damageBar = document.getElementById("damage");
        const selfDamage = document.getElementById("selfDamage");
        let targetedPlayerId = null;

        // Developer panel helpers
        const devDraco = new DRACOLoader();
        devDraco.setDecoderPath('/libs/draco/');
        const devLoader = new GLTFLoader().setPath('/models/');
        devLoader.setDRACOLoader(devDraco);
        devLoader.setMeshoptDecoder(MeshoptDecoder);
        let currentScale = 0.4;

        const handleScaleChange = (e) => {
            currentScale = e.detail.scale;
            if (players.has(myPlayerId)) {
                const m = players.get(myPlayerId).model;
                m.scale.set(currentScale, currentScale, currentScale);
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
        };

        window.addEventListener('DEV_SCALE_CHANGE', handleScaleChange);
        window.addEventListener('DEV_MODEL_CHANGE', handleModelChange);

        const activeShields = new Map(); // key = playerId
        const activeHandEffects = new Map(); // key = playerId -> { effectKey: {left, right} }
        const activeDamageEffects = new Map(); // key = playerId -> effect mesh
        const activeImmolation = new Map(); // key = playerId -> effect mesh
        const activeStunEffects = new Map(); // key = playerId -> {group, timeout}
        const activeFearEffects = new Map(); // key = playerId -> {sprite, timeout}
        const activeSprintTrails = new Map(); // key = playerId -> {mesh, start, duration, timeout}
        const fearTexture = new THREE.TextureLoader().load('/icons/classes/warlock/possession.jpg');

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
            dispatchEvent('self-update', { hp, mana, points, level });
        }

        // Function to update the Mana bar width
        function updateManaBar() {
            dispatchEvent('self-update', { hp, mana, points, level });
        }

        function dispatchTargetUpdate() {
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
                mana: p.mana,
                address: p.address || `Player ${targetedPlayerId}`,
                classType: p.classType
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

        const fireballGeometry = new THREE.CapsuleGeometry(
            0.195,   // radius 30% larger
            0.416,   // length 30% larger
            8,      // cap-seg (больше сегментов → плавнее)
            16      // radial-seg
        );

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

                  float flow = fract(vPos.z * 4.0 - time * 5.0);
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
            fireballMaterial     // own instance
        );
        fireballMesh.scale.set(
            SPELL_SCALES.fireball,
            SPELL_SCALES.fireball,
            SPELL_SCALES.fireball,
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
            SPELL_SCALES.darkball,
            SPELL_SCALES.darkball,
            SPELL_SCALES.darkball,
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
            SPELL_SCALES.iceball,
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
            darkball: 0,
            corruption: 10000,
            immolate: 10000,
            iceball: 5000,
            fireblast: 5000,
            chaosbolt: 6000,
            lifedrain: 0,
            fear: 40000,
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
            'divine-speed': 30000,
            'blood-strike': 1000,
            eviscerate: 10000,
            'kidney-strike': 20000,
            'adrenaline-rush': 45000,
            sprint: 30000,
            'shadow-leap': 12000,
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

        const FIREBLAST_RANGE = 20;
        const FIREBLAST_DAMAGE = 25;

        const FIREBALL_DAMAGE = 40;
        const PYROBLAST_DAMAGE = FIREBALL_DAMAGE * 1.4;
        const CHAOSBOLT_DAMAGE = FIREBALL_DAMAGE * 2;
        const ICEBALL_DAMAGE = 25;
        const DARKBALL_DAMAGE = 30;
        const LIFEDRAIN_DAMAGE = 30;
        const FROSTNOVA_DAMAGE = 20;
        const FROSTNOVA_RANGE = FIREBLAST_RANGE / 2;
        const FROSTNOVA_RING_DURATION = 1000; // ms
        const LIGHTWAVE_RING_DURATION = 1000; // ms
        const LIGHTSTRIKE_DAMAGE = 28; // 30% less damage
        const LIGHTSTRIKE_RANGE = 0.8; // melee range
        const LIGHTSTRIKE_ANGLE = Math.PI / 4;
        const LIGHTWAVE_DAMAGE = 40;
        const STUN_SPIN_SPEED = 2;

        // Медленнее пускаем сферы как настоящие заклинания
        const MIN_SPHERE_IMPULSE = 6;
        const MAX_SPHERE_IMPULSE = 12;

        // Maximum distance any sphere can travel
        // Use the same range as fireblast for consistency
        const SPHERE_MAX_DISTANCE = FIREBLAST_RANGE / 2;

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
        // Rotation speed for the damage rune effect attached to players
        const DAMAGE_EFFECT_ROT_SPEED = 0.4;
        const DAMAGE_EFFECT_MAP_SPEED = 0.1;
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
            !isCasting && setAnimation("walk");
        }
        function handleKeyA() {
            !isCasting && setAnimation("walk");
        }
        function handleKeyD() {
            !isCasting && setAnimation("walk");
        }
        function handleKeyS() {
            !isCasting && setAnimation("idle");
        }
        function handleKeyE() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('darkball');
            else if (className === 'paladin') castSpell('lightstrike');
            else if (className === 'rogue') castSpell('blood-strike');
            else castSpell('fireball');
        }
        function handleKeyR() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('corruption');
            else if (className === 'paladin') castSpell('stun');
            else if (className === 'rogue') castSpell('eviscerate');
            else castSpell('iceball');
        }
        function handleKeyF() {
            const className = character?.name?.toLowerCase();
            if (className === 'warlock') castSpell('chaosbolt');
            else if (className === 'paladin') castSpell('lightwave');
            else if (className === 'rogue') castSpell('kidney-strike');
            else castSpell('blink');
        }
        function handleDigit3() {
            const className = character?.name?.toLowerCase();
            if (className === 'mage') castSpell('fireblast');
            else if (className === 'paladin') castSpell('hand-of-freedom');
            else if (className === 'warlock') castSpell('fear');
            else if (className === 'rogue') castSpell('sprint');

        }
        function handleDigit2() {
            const className = character?.name?.toLowerCase();
            if (className === 'mage') castSpell('pyroblast');
            else if (className === 'paladin') castSpell('divine-speed');
            else if (className === 'warlock') castSpell('lifedrain');
            else if (className === 'rogue') castSpell('adrenaline-rush');

        }
        function handleKeyG() {
            leftMouseButtonClicked = true;
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
        function handleSpace() {
            if (playerOnFloor && !jumpBlocked) {
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
            if (className === 'warlock') castSpell('immolate');
            else if (className === 'paladin') castSpell('paladin-heal');
            else if (className === 'rogue') castSpell('shadow-leap');
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
            KeyG: handleKeyG,
            KeyJ: handleKeyJ,
            KeyT: handleKeyT,
            Space: handleSpace,
            KeyQ: handleKeyQ,
        };

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

        function handleKeyUpG() {
            leftMouseButtonClicked = false;
        }
        function handleKeyUpT() {
            dispatch({type: 'SET_SCOREBOARD_VISIBLE', payload: false});
        }
        function handleKeyUpSpace() {
            setTimeout(() => {
                jumpBlocked = false;
            }, 2000);
        }

        const keyUpHandlers = {
            KeyG: handleKeyUpG,
            KeyT: handleKeyUpT,
            Space: handleKeyUpSpace,
        };

        document.addEventListener("keyup", (event) => {
            if (isChatActive) return;

            if (!controlsEnabled || debuffsRef.current.some(d => d.type === 'stun') || menuVisibleRef.current) return;

            keyStates[event.code] = false;

            const handler = keyUpHandlers[event.code];
            if (handler) handler();

            // // Check if no movement keys are active
            if (
                !isCasting &&
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

        // chatch even
        document.addEventListener("mousedown", (event) => {
            if (!controlsEnabled || debuffsRef.current.some(d => d.type === 'stun')) return;
            if (event.button === 2) {
                // Right mouse button
                handleRightClick();
            }
            if (event.button === 0) {
                // Left mouse button
                const id = getTargetPlayer();
                if (id) {
                    targetedPlayerId = id;
                    dispatchTargetUpdate();
                } else {
                    targetedPlayerId = null;
                    dispatchTargetUpdate();
                }
            }
        });

        // block mouse
        containerRef.current.addEventListener("mousedown", () => {
            if (debuffsRef.current.some(d => d.type === 'stun')) return;
            document.body.requestPointerLock();
            mouseTime = performance.now();

            sounds.background.volume = 0.1;
            sounds.background.play();
        });

        document.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Prevent the context menu from showing
        });

        document.body.addEventListener("mousemove", (event) => {
            if (document.pointerLockElement === document.body) {
                // Update yaw (horizontal rotation) normally
                yaw -= event.movementX / 500;

                // Update pitch (vertical rotation) with reversed movement for regular behavior
                pitch = Math.max(
                    -Math.PI / 2,
                    Math.min(Math.PI / 2, pitch + event.movementY / 500),
                );
            }
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
            dispatchEvent('start-cast', {duration: 2000, onEnd: onCastEnd})
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

            // Default behaviour - fire in the camera direction
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
                targetImage.src = '/icons/target.svg';
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
                    targetImage.src = '/icons/target-green.svg';
                } else {
                    targetImage.src = '/icons/target.svg';
                }
            } else {
                targetImage.src = '/icons/target.svg';
            }
        }


        function castSpell(spellType, playerId = myPlayerId) {
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

            if (globalSkillCooldown || isCasting) {
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
                case "darkball":
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
                case "immolate":
                    castImmolate({
                        playerId,
                        castSpellImpl,
                        igniteHands,
                        mana,
                        getTargetPlayer,
                        dispatch,
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
                case "darkball":
                    darkHands(playerId, 1000);
                    castSpellImpl(
                        playerId,
                        30,
                        1000,
                        (model) => castSphere(model, darkballMesh.clone(), spellType, DARKBALL_DAMAGE),
                        sounds.fireballCast,
                        sounds.fireball,
                        'darkball',
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
                    applySpeedEffect(playerId, 5000);
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
                        playerId,
                        getTargetPlayer,
                        dispatch,
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
                    applySpeedEffect(playerId, 6000);
                    spawnSprintTrail(playerId, 6000);
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
                actionName: 'attack_360',
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


       function castSphere(model, sphereMesh, type, damage) {
            sphereMesh.rotation.copy(model.rotation);

            if (sphereMesh instanceof Fire) {
                sphereMesh.lookAt(camera.position);
            }

            scene.add(sphereMesh); // Add the sphereMesh to the scene


            // Compute aim direction based on camera ray and player position
            const aimDir = getAimDirection();

            const initialPosition = playerCollider.start
                .clone()
                .add(playerCollider.end)
                .multiplyScalar(0.5)
                .addScaledVector(aimDir, playerCollider.radius * 2);

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
                execute();
            };

            isCasting = true;

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
            dispatchEvent('start-cast', { duration, onEnd: onCastEnd });
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

                // Хвосты отключены
            }

            // spheresCollisions(); // Handle collisions between spheres

           for (let sphere of spheres) {
                sphere.mesh?.position.copy(sphere.collider?.center); // TODO fix
                if (sphere.type === 'pyroblast') {
                    sphere.mesh.lookAt(camera.position);
                }
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
            const baseWalkSpeed = 7.2; // Increased running speed by 20%
            const speedDelta =
                deltaTime * (playerOnFloor ? baseWalkSpeed : 5) * movementSpeedModifier; // Apply speed modifier

            // Rotate playerVelocity when pressing A or D
            if (keyStates["KeyA"]) {
                playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
                if (!isAnyActionRunning()) setAnimation("walk");
            }

            if (keyStates["KeyD"]) {
                playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("walk");
            }

            if (keyStates["KeyW"]) {
                const forwardVector = new THREE.Vector3(
                    Math.sin(model.rotation.y),
                    0,
                    Math.cos(model.rotation.y),
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

        // Show or hide model
        function showModel(visibility) {
            if (players.has(myPlayerId)) {
                players.get(myPlayerId).model.visible = visibility;
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
                sendToSocket({type: "UPDATE_ANIMATION", actionName, fadeIn});
            }

            // Attach an event listener for when the animation ends
            if (loop === THREE.LoopOnce && onEnd) {
                const onAnimationEnd = (event) => {
                    if (event.action === action) {
                        mixer.removeEventListener("finished", onAnimationEnd); // Clean up listener
                        onEnd(event);
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

            console.log("error check actions: ", actions);
            return Object.values(actions).some(
                (action) => action && action.isRunning() && !excludeActions.includes(action),
            );
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
                    yaw = rotY;
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


        function applyDamageRuneEffect(playerId, duration = 60000) {
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

        function applySlowEffect(playerId, duration = 3000) {
            if (playerId === myPlayerId) {
                if (freedomActive) return;
                movementSpeedModifier = 0.6;
                setTimeout(() => (movementSpeedModifier = 1), duration);
            }
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

        function applySpeedEffect(playerId, duration = 5000) {
            if (playerId === myPlayerId) {
                movementSpeedModifier = 1.4;
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
                existing.sprite.parent?.remove(existing.sprite);
                clearTimeout(existing.timeout);
            }

            const material = new THREE.SpriteMaterial({
                map: fearTexture,
                transparent: true,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(1, 1, 1);
            sprite.renderOrder = 999;
            scene.add(sprite);

            const timeout = setTimeout(() => {
                sprite.parent?.remove(sprite);
                activeFearEffects.delete(playerId);
            }, duration);

            activeFearEffects.set(playerId, { sprite, timeout });
        }

        function spawnFrostNovaRing(playerId, duration = FROSTNOVA_RING_DURATION) {
            const player = players.get(playerId)?.model;
            if (!player) return;

            const position = new THREE.Vector3();
            player.getWorldPosition(position);
            position.y += 0.1;

            const geometry = new THREE.RingGeometry(1, 1.5, 32);
            const material = new THREE.MeshBasicMaterial({
                map: textures.ice,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.copy(position);

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
                // Get the camera's forward direction
                const cameraDirection = new THREE.Vector3();

                camera.getWorldDirection(cameraDirection);

                if (leftMouseButtonClicked) return;

                // Calculate the direction the player is moving (opposite to camera's forward)
                const targetRotationY = Math.atan2(
                    cameraDirection.x,
                    cameraDirection.z,
                );

                // Rotate the model to face the opposite direction
                model.rotation.y = THREE.MathUtils.lerp(
                    model.rotation.y,
                    targetRotationY,
                    0.1,
                );

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
                        target.getWorldPosition(obj.sprite.position);
                        obj.sprite.position.y += 2;
                    });

                    for (let i = frostNovaRings.length - 1; i >= 0; i--) {
                        const effect = frostNovaRings[i];
                        const elapsed = performance.now() - effect.start;
                        const progress = elapsed / effect.duration;
                        effect.mesh.scale.setScalar(1 + progress * 2);
                        effect.mesh.material.opacity = 0.8 * (1 - progress);
                        if (progress >= 1) {
                            scene.remove(effect.mesh);
                            frostNovaRings.splice(i, 1);
                        }
                    }

                    for (let i = lightWaveRings.length - 1; i >= 0; i--) {
                        const effect = lightWaveRings[i];
                        const elapsed = performance.now() - effect.start;
                        const progress = elapsed / effect.duration;
                        effect.mesh.scale.setScalar(0.1 + progress * 3);
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

                    runes.forEach(r => {
                        const speed = r.userData.type === 'damage' ? 0.05 : 0.1;
                        r.rotation.y += delta * speed;
                    });

                    xpRunes.forEach(r => {
                        r.rotation.y += delta * 0.1;
                    });

                    // renderCursor();
                    updateCameraPosition();
                    highlightCrosshair();
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
                    if (object.isMesh) object.castShadow = true;
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
                if (action && message.animationAction !== playerData.currentAction) {
                    controlAction({
                        action,
                        mixer,
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
                scene.remove(players.get(id));
                delete players.get(id);
                if (id === targetedPlayerId) {
                    targetedPlayerId = null;
                    dispatchTargetUpdate();
                }
            }
        }

        function showDamage(playerId, amount, spellType) {
            const player = players.get(playerId)?.model;
            if (!player) return;

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
            } else if (data.type === "darkball") {
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
                        case "darkball":
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
                        case "immolate":
                            applyImmolationEffect(message.payload.targetId);
                            if (message.payload.targetId === myPlayerId) {
                                dispatch({
                                    type: "SEND_CHAT_MESSAGE",
                                    payload: "You are burning!",
                                });
                            }
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
                                applySpeedEffect(myPlayerId, 5000);
                            }
                            break;
                        case "blood-strike":
                            // melee swing effect placeholder
                            break;
                        case "eviscerate":
                            break;
                        case "kidney-strike":
                            if (message.payload.targetId) {
                                applyStunEffect(message.payload.targetId, 2000);
                            }
                            break;
                        case "adrenaline-rush":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 8000);
                            }
                            break;
                        case "sprint":
                            if (message.id === myPlayerId) {
                                applySpeedEffect(myPlayerId, 6000);
                                spawnSprintTrail(myPlayerId, 6000);
                            }
                            break;
                        case "shadow-leap":
                            break;
                        case "stun":
                            if (message.payload.targetId) {
                                applyStunEffect(message.payload.targetId, 3000);
                            }
                            break;
                        case "lightwave":
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                if (caster) {
                                    spawnLightWaveRing(message.id);
                                    const myPos = players.get(myPlayerId)?.model.position.clone();
                                    const casterPos = caster.model.position.clone();
                                    if (myPos && casterPos && myPos.distanceTo(casterPos) < FIREBLAST_RANGE) {
                                        takeDamage(LIGHTWAVE_DAMAGE, message.id, 'lightwave');
                                    }
                                }
                            }
                            break;
                        case "lightstrike":
                            if (message.id !== myPlayerId) {
                                const caster = players.get(message.id);
                                const me = players.get(myPlayerId);
                                if (caster && me) {
                                    const origin = caster.model.position.clone();
                                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(caster.model.quaternion);
                                    const toMe = me.model.position.clone().sub(origin);
                                    const distance = toMe.length();
                                    if (distance < LIGHTSTRIKE_RANGE && forward.angleTo(toMe.normalize()) < LIGHTSTRIKE_ANGLE) {
                                        takeDamage(LIGHTSTRIKE_DAMAGE, message.id, 'lightstrike');
                                    }
                                }
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
                        mana = message.mana;
                        updateHPBar();
                        updateManaBar();
                        if (hp <= 0) {
                            // waiting for server respawn
                        }
                    } else if (players.has(message.playerId)) {
                        const p = players.get(message.playerId);
                        p.hp = message.hp;
                        p.mana = message.mana;
                        if (message.playerId === targetedPlayerId) {
                            dispatchTargetUpdate();
                        }
                    }
                    break;
                case "KILL":
                    if (message.killerId === address) {
                        dispatch({
                            type: "SEND_CHAT_MESSAGE",
                            payload: `+1 $MetaWars$ Gold for kill ${message?.character?.name}!`,
                        });
                        setTimeout(() => {
                            refetchCoins();
                        }, 500);
                    }
                    break;
                case "DAMAGE":
                    if (message.targetId) {
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
                            level = player.level;
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
                    message.players.forEach((playerId) => {
                        const p = players.get(Number(playerId));
                        const cls = p?.classType || "";
                        const charModel = p?.character || (cls === 'paladin' ? 'bolvar' : 'vampir');
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
            {!isReadyToPlay && (<Loading text="Loading Players ..."/>)}
        </div>
    );
}
