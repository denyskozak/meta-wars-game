import React, {useLayoutEffect, useRef, useState} from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import Stats from "three/examples/jsm/libs/stats.module";
import {Octree} from "three/examples/jsm/math/Octree";
import {OctreeHelper} from "three/examples/jsm/helpers/OctreeHelper";
import {Capsule} from "three/examples/jsm/math/Capsule";
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {useCurrentAccount} from "@mysten/dapp-kit";

import {useCoins} from "../hooks/useCoins";
import {useInterface} from "../context/inteface";
import {useWS} from "../hooks/useWS";
import {world} from "../worlds/main/data";


import {Interface} from "@/components/layout/Interface";

const USER_DEFAULT_POSITION = [
    -36.198117096583466, 0.22499999997500564, -11.704829764915257,
];

const spawns = [
    {x: -17.12683322968667, y: 0.34999999995822706, z: -12.781498582746165},
    {x: -28.60683425667782, y: 0.3499999999897787, z: 9.049836139148344},
    {x: -53.86411418000327, y: 0.3499999999897787, z: -17.914153181078696},
    {x: -15.911929442319186, y: 0.35000000000000003, z: -11.362410041589836},
    {x: 18.036347505858117, y: 0.35000000000000003, z: -23.924371817675073},
];

function getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error("Invalid array: must be a non-empty array.");
    }
    const randomIndex = Math.floor(Math.random() * array.length);

    return array[randomIndex];
}

export function Game({models, sounds, matchId, character}) {
    const containerRef = useRef(null);
    const {refetch: refetchCoins} = useCoins();
    const {dispatch} = useInterface();
    const {socket, sendToSocket} = useWS(matchId);
    const [isReadyToPlay, setIsReadyToPlay] = useState(false);

    const account = useCurrentAccount();
    const address = account?.address;

    useLayoutEffect(() => {
        // Store other players
        const players = {};

        // Character Model and Animation Variables
        let model = models["character"],
            mixer,
            idleAction,
            walkAction,
            castAction,
            jumpAction,
            runAction,
            camera;
        let hp = 100,
            mana = 100;
        let actions = [];
        let remoteMixers = [];
        let settings;
        let leftMouseButtonClicked = false;

        let movementSpeedModifier = 1; // Normal speed

        const hpBar = document.getElementById("hpBar");
        const damageBar = document.getElementById("damage");
        const manaBar = document.getElementById("manaBar");

        // Function to update the HP bar width
        function updateHPBar() {
            hpBar.style.width = `${hp}%`;
        }

        // Function to update the Mana bar width
        function updateManaBar() {
            manaBar.style.width = `${mana}%`;
        }

        // Function to handle damage and update health
        let takeDamage = (amount, userIdTouched) => {
            if (isShieldActive) {
                amount *= DAMAGE_REDUCTION; // Apply damage reduction
            }

            hp = Math.max(0, hp - amount); // Уменьшаем HP, но не ниже 0
            updateHPBar();
            dispatch({
                type: "SEND_CHAT_MESSAGE",
                payload: `You got ${amount} damage!`,
            });

            sendToSocket({
                type: "DAMAGED_ME",
                damageDealerId: userIdTouched,
                damage: amount,
                currentHP: hp,
            });

            if (hp <= 0) {
                dispatch({type: "SEND_CHAT_MESSAGE", payload: "You are dead :("});
                sendToSocket({type: "KILL", killerId: userIdTouched});
                document.getElementById("respawnButton").style.display = "block"; // Показываем кнопку
            }
        };

        const fireballGeometry = new THREE.CapsuleGeometry(
            0.15,   // radius  (0.12 → 0.15)
            0.32,   // length  (0.25 → 0.32)
            8,      // cap-seg (больше сегментов → плавнее)
            16      // radial-seg
        );
        const fireballMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                time: {value: 0},
                coreCol: {value: new THREE.Color(0xfff2ad)},
                flameCol: {value: new THREE.Color(0xff4400)},
            },
            vertexShader: /* glsl */`
                uniform float time;          // ←  добавили
                varying vec3 vPos;
            
                void main() {
                  vPos = position;
            
                  // «дыхание» поверхности
                  vec3 displaced = position + normal * 0.02 * sin((position.z + time) * 10.0);
            
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }`,
            fragmentShader: /* glsl */`
                float hash(vec2 p)  { return fract(sin(dot(p,vec2(41,289))) * 1e4); }
                float noise(vec2 p) {
                  vec2 i = floor(p); p -= i;
                  vec2 u = p * p * (3.0 - 2.0 * p);
                  return mix( mix(hash(i),             hash(i + vec2(1.0,0.0)), u.x),
                              mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
                              u.y );
                }
            
                uniform float time;
                uniform vec3  coreCol;
                uniform vec3  flameCol;
                varying vec3  vPos;
            
                void main() {
                  float r = length(vPos.xy) / 0.15;            // 0..1
                  float core  = smoothstep(0.3, 0.0,  r);
                  float flame = smoothstep(0.7, 0.25, r);
            
                  float flow = fract(vPos.z * 3.0 - time * 5.0);
                  float n    = noise(vPos.xy * 5.0 + time * 2.0);
            
                  core  *= 0.9 + 0.1 * n;
                  flame *= (0.7 + 0.3 * n) * flow;
            
                  vec3  col   = coreCol * core + flameCol * flame;
                  float alpha = core + flame * 0.9;
            
                  if (alpha < 0.03) discard;
                  gl_FragColor = vec4(col, alpha);
                }`
        });
        const fireballMesh = new THREE.Mesh(fireballGeometry, fireballMaterial);


        const iceballGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Ледяной шар

        const iceballMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: {value: 0.0},
                color: {value: new THREE.Color(0x66ccff)},     // Основной холодный синий
                glowColor: {value: new THREE.Color(0xccffff)}, // Голубовато-белое свечение
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform vec3 glowColor;
        varying vec2 vUv;
    
        void main() {
          float dist = distance(vUv, vec2(0.5));
    
          // Центральное ядро
          float core = smoothstep(0.4, 0.0, dist);
    
          // Пульсация похожа на кристаллизацию или мороз
          float glow = smoothstep(0.6, 0.2, dist) * (0.4 + 0.6 * abs(sin(time * 4.0)));
    
          // Холодное смешение
          vec3 finalColor = color * core + glowColor * glow;
    
          // Альфа прозрачность
          float alpha = clamp(core + glow * 0.7, 0.0, 1.0);
    
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const iceballMesh = new THREE.Mesh(iceballGeometry, iceballMaterial);


        const labelRenderer = new CSS2DRenderer();

        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = "absolute";
        labelRenderer.domElement.style.top = "0px";


        const clock = new THREE.Clock();

        const scene = new THREE.Scene();

        scene.background = new THREE.Color(0x88ccee);
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

        // Function to activate the cooldown
        function activateGlobalCooldown() {
            globalSkillCooldown = true;
            setTimeout(() => {
                globalSkillCooldown = false; // Reset the cooldown after the duration
            }, cooldownDuration);
        }

        const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);

        fillLight1.position.set(2, 1, 1);
        scene.add(fillLight1);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);

        directionalLight.position.set(-5, 25, -1);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.radius = 4;
        directionalLight.shadow.bias = -0.00006;
        scene.add(directionalLight);

        const renderer = new THREE.WebGLRenderer({antialias: true});

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setAnimationLoop(animate);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        const stats = new Stats();

        stats.domElement.style.position = "absolute";
        stats.domElement.style.top = "0px";


        const GRAVITY = 30;

        const NUM_SPHERES = 100;
        const SPHERE_RADIUS = 0.2;

        const STEPS_PER_FRAME = 30;

        const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
        const sphereMaterial = new THREE.MeshLambertMaterial({color: 0xdede8d});

        const spheres = [];
        let sphereIdx = 0;

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
        const SHIELD_MANA_COST = 40; // Mana cost for the shield
        const SHIELD_DURATION = 3; // Shield duration in seconds
        const DAMAGE_REDUCTION = 0.8; // Reduces damage by 50%
        // Activate shield
        let isShieldActive = false;
        let isChatActive = false;
        let isHealActive = false;

        // Function to adjust the FOV (zoom)
        const target = document.getElementById("target");
        let isFocused = false;

        const getTrailMaterial = (sphereType) => {
            const colors = {
                'fireball': 0xff0000,
                'iceball': 0x66ccff,
            }

           return new THREE.MeshBasicMaterial({
                color: colors[sphereType],
                transparent: true,
                opacity: 0.3,
                depthWrite: false,
            })
        }


        const trailGeometry = new THREE.SphereGeometry(0.05, 8, 8); // Маленький шар
        const TRAIL_INTERVAL = 5; // В мс, как часто добавлять точки
        const TRAIL_LIFETIME = 100; // Сколько живет одна точка

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

        function respawnPlayer() {
            hp = 100; // Восстанавливаем HP
            updateHPBar(); // Обновляем отображение HP
            teleportTo({
                x: USER_DEFAULT_POSITION[0],
                y: USER_DEFAULT_POSITION[1] + 0.75,
                z: USER_DEFAULT_POSITION[2],
            });
            document.getElementById("respawnButton").style.display = "none"; // Скрываем кнопку воскрешения
        }

        // Function to update the camera position and rotation
        function updateCameraPosition() {
            const playerPosition = new THREE.Vector3();

            playerCollider.getCenter(playerPosition); // Assuming `getCenter` exists

            // Calculate the offset from the player based on yaw and pitch
            const offset = new THREE.Vector3(
                Math.sin(yaw) * Math.cos(pitch),
                Math.sin(pitch),
                Math.cos(yaw) * Math.cos(pitch),
            ).multiplyScalar(1.2); // `distance` is the desired distance from the player

            // Set the camera's position relative to the player
            camera.position.copy(playerPosition).add(offset);

            // Set the cameraTarget position to player's position
            cameraTarget.position.copy(playerPosition);

            // Camera looks at the target object (which is at the player's position)
            camera.lookAt(cameraTarget.position);
        }

        // Event listener for mouse wheel scroll (for zooming in and out)
        window.addEventListener("wheel", (event) => {
            const delta = event.deltaY * 0.05; // Sensitivity adjustment

            adjustFOV(delta);
        });

        let jumpBlocked = false;
        const chatInputElement = document.getElementById("chat-input");

        document.addEventListener("keydown", (event) => {
            if (event.code === "Enter") {
                if (!isChatActive) {
                    chatInputElement.focus();
                } else {
                    chatInputElement.blur();
                }
                isChatActive = !isChatActive;
            }

            if (isChatActive) return;

            keyStates[event.code] = true;

            switch (event.code) {
                // case "KeyR": // Blink Skill
                //     castBlink();
                //     break;
                case "KeyW":
                    // Start the walk animation immediately
                    !isCasting && setAnimation("Walk");
                    break;
                case "KeyA":
                case "KeyD":
                    // Optional: Handle strafing or side movement animations
                    !isCasting && setAnimation("Walk");
                    break;
                case "KeyS":
                    // Optional: Set a backward movement animation
                    !isCasting && setAnimation("Idle");
                    break;
                case "KeyE":
                    castSpell('fireball');
                    break;
                case "KeyR":
                    castSpell('iceball');
                    break;
                case "KeyG":
                    leftMouseButtonClicked = true;
                    break;
                case "KeyF": // Press "H" to heal
                    castHeal();
                    break;
                case "Space": // Press "Q" to cast shield
                    // Space for jumping
                    if (playerOnFloor && !jumpBlocked) {
                        jumpBlocked = true;

                        controlAction({
                            action: jumpAction,
                            mixer: mixer,
                            loop: THREE.LoopOnce,
                            fadeIn: 0.1,
                            reset: true,
                            clampWhenFinished: true,
                            // onEnd: () => {
                            //     console.log("Jump animation finished!");
                            //     controlAction({action: idleAction, mixer: mixer, fadeIn: 0.5}); // Return to idle
                            // }
                        });
                        setTimeout(() => {
                            playerVelocity.y = 10;
                        }, 150);
                    }
                    break;
                case "KeyQ": // Press "Q" to cast shield
                    castShield();
                    break;
                case "Enter":
                    if (hp === 0) {
                        respawnPlayer();
                    }
                    break;
            }
        });

        document.addEventListener("keyup", (event) => {
            if (isChatActive) return;

            keyStates[event.code] = false;

            switch (event.code) {
                case "KeyG":
                    leftMouseButtonClicked = false;
                    break;
                case "Space": // Press "Q" to cast shield
                    setTimeout(() => {
                        jumpBlocked = false;
                    }, 2000);
                    break;
            }

            // // Check if no movement keys are active
            if (
                !isCasting &&
                !keyStates["KeyW"] &&
                !keyStates["KeyA"] &&
                !keyStates["KeyD"] &&
                !keyStates["KeyS"]
            ) {
                setAnimation("Idle"); // Return to idle animation
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
        };

        // chatch even
        document.addEventListener("mousedown", (event) => {
            if (event.button === 2) {
                // Right mouse button
                console.log("Right mouse button clicked!");
                // Add your logic for right-click actions here
                handleRightClick();
            }
        });

        // block mouse
        containerRef.current.addEventListener("mousedown", () => {
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

        function castShield() {
            if (globalSkillCooldown) {
                return;
            }

            // Check if enough mana is available
            if (mana < SHIELD_MANA_COST || isCasting) {
                return;
            }

            // Deduct mana
            mana = Math.max(0, mana - SHIELD_MANA_COST);
            updateManaBar();

            isCasting = true;

            const onCastEnd = () => {
                isCasting = false;
                isShieldActive = true;
                sounds.spellCast.pause();
                // Send the fireball data to the server
                sendToSocket({
                    type: "CAST_SPELL",
                    payload: {
                        type: "shield",
                    },
                });

                setTimeout(() => {
                    isShieldActive = false; // Deactivate shield
                }, SHIELD_DURATION * 1000);

                activateGlobalCooldown(); // Activate global cooldown
            };

            sounds.spellCast.volume = 0.3;
            sounds.spellCast.play();
            window.dispatchEvent(new CustomEvent('start-cast', {
                detail: {duration: 2000, onEnd: onCastEnd}
            }));
        }

        let skillsCDs = {
            blink: false,
        };

        function castBlink() {
            const BLINK_DISTANCE = 5; // Distance to teleport forward
            const BLINK_MANA_COST = 20; // Mana cost for blink
            const BLINK_COOLDOWN = 10000; // Cooldown in milliseconds

            if (globalSkillCooldown || isCasting || skillsCDs.blink) {
                return;
            }

            if (mana < BLINK_MANA_COST) {
                console.log("Not enough mana to blink!");

                return;
            }

            // Deduct mana
            mana = Math.max(0, mana - BLINK_MANA_COST);
            updateManaBar();

            sounds.blink.volume = 0.5;
            sounds.blink.play();

            skillsCDs.blink = true;
            setTimeout(() => (skillsCDs.blink = false), BLINK_COOLDOWN);

            const playerPosition = new THREE.Vector3();

            playerCollider.getCenter(playerPosition);

            // Teleport the player forward
            const forwardDirection = new THREE.Vector3();

            camera.getWorldDirection(forwardDirection);
            forwardDirection.y = 0; // Keep movement in the horizontal plane
            forwardDirection.normalize();

            const blinkTarget = playerPosition.addScaledVector(
                forwardDirection,
                BLINK_DISTANCE,
            );

            // Ensure no collisions at the blink target
            const result = worldOctree.capsuleIntersect(
                new Capsule(
                    blinkTarget,
                    blinkTarget.clone().add(new THREE.Vector3(0, 0.75, 0)),
                    0.35,
                ),
            );

            if (!result) {
                // If the target position is valid, teleport the player
                teleportTo(blinkTarget);
            } else {
                console.log("Blink target is obstructed!");
            }

            // Activate cooldown
            activateGlobalCooldown();
        }

        function castHeal() {
            const HEAL_AMOUNT = 20; // Amount of HP restored
            const HEAL_MANA_COST = 30; // Mana cost for healing

            if (globalSkillCooldown || isCasting) {
                return;
            }

            // Check if enough mana is available
            if (mana < HEAL_MANA_COST) {
                console.log("Not enough mana to heal!");

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

                // Deduct mana and restore health
                mana = Math.max(0, mana - HEAL_MANA_COST);
                hp = Math.min(100, hp + HEAL_AMOUNT);
                updateHPBar();
                updateManaBar();
                isHealActive = true;
                setTimeout(() => (isHealActive = false), 700);
                activateGlobalCooldown(); // Activate global cooldown
            };

            isCasting = true;
            movementSpeedModifier = 0.3;
            sounds.spellCast.volume = 0.3;
            sounds.spellCast.play();
            window.dispatchEvent(new CustomEvent('start-cast', {
                detail: {duration: 2000, onEnd: onCastEnd}
            }));
        }

        const CAST_MANA_PRICE = 25;

        function castSpell(spellType) {
            switch (spellType) {
                case "fireball":
                    const fireball = new THREE.Mesh(
                        fireballGeometry,
                        fireballMaterial.clone()      // свой экземпляр
                    );

                    castSphere(spellType, fireball, sounds.fireballCast, sounds.fireball);
                    break;
                case "iceball":
                    castSphere(spellType, iceballMesh, sounds.iceballCast, sounds.iceball);
                    break;
            }
        }

        function castSphere(type, sphereMesh, soundCast, soundCastEnd) {
            if (globalSkillCooldown) {
                return;
            }

            if (mana < CAST_MANA_PRICE || isCasting) return; // Ensure the fireball model is loaded

            const onCastEnd = () => {
                soundCast.pause();
                // Play fireball sound
                soundCastEnd.volume = 0.5; // Adjust volume if needed
                soundCastEnd.play();

                isCasting = false;


                // fireball.scale.set(0.015, 0.015, 0.015);
                // Rotate the fireball 45 degrees to the right on the X-axis
                sphereMesh.rotation.copy(model.rotation);
                // fireball.rotation.x += THREE.MathUtils.degToRad(90);

                scene.add(sphereMesh); // Add the sphereMesh to the scene

                // Set the initial position of the sphereMesh
                camera.getWorldDirection(playerDirection);
                // todo return if need
                // const initialPosition = playerCollider.end.clone().addScaledVector(playerDirection, playerCollider.radius * 1.5);
                const initialPosition = playerCollider.end
                    .clone()
                    .addScaledVector(playerDirection, playerCollider.radius * 2);

                sphereMesh.position.copy(initialPosition);

                // Set the velocity for the sphereMesh
                // Calculate smoother impulse using cubic easing
                const chargeTime = Math.min(performance.now() - mouseTime, 1000); // Cap charge time to 1 second
                const chargeFactor = chargeTime / 1000; // Normalize to range [0, 1]
                const impulse = THREE.MathUtils.lerp(
                    30,
                    60,
                    chargeFactor * chargeFactor * (3 - 2 * chargeFactor),
                ); // Smoothstep with more power

                const velocity = playerDirection.clone().multiplyScalar(impulse);

                // Send the fireball data to the server
                sendToSocket({
                    type: "CAST_SPELL",
                    payload: {
                        type,
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
                spheres[sphereIdx] = {
                    mesh: sphereMesh,
                    collider: new THREE.Sphere(
                        new THREE.Vector3().copy(sphereMesh.position),
                        SPHERE_RADIUS,
                    ),
                    velocity: velocity,
                    initialPosition: initialPosition,
                    type,

                    trail: [], // массив точек следа
                    lastTrailTime: performance.now(),
                };

                sphereIdx = (sphereIdx + 1) % spheres.length;
                mana = mana - CAST_MANA_PRICE;
                activateGlobalCooldown(); // Activate global cooldown
            };

            isCasting = true;

            controlAction({
                action: castAction,
                mixer: mixer,
                loop: THREE.LoopOnce,
                fadeIn: 0.1,
                reset: true,
                clampWhenFinished: true,
            });
            soundCast.volume = 0.5; // Adjust volume if needed
            soundCast.play();
            window.dispatchEvent(new CustomEvent('start-cast', {
                detail: {duration: 1000, onEnd: onCastEnd}
            }));
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

        function updatePlayer(deltaTime) {
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
                takeDamage(25, userIdTouched);
                if (sphere.type === 'iceball') {
                    movementSpeedModifier = 0.5;
                    setTimeout(() => (movementSpeedModifier = 1), 1000);
                }
            }
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

            if (sphere.trail) {
                for (const point of sphere.trail) {
                    scene.remove(point.mesh);
                    point.mesh.geometry.dispose();
                    point.mesh.material.dispose();
                }
                sphere.trail.length = 0;
            }
        };

        function updateSpheres(deltaTime) {
            const now = performance.now();

            spheres.forEach((sphere, index) => {
                if (!sphere.mesh) return;

                sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

                const result = worldOctree.sphereIntersect(sphere.collider);

                if (result) {
                    // Handle collision logic (e.g., explode fireball or bounce)
                    removeSphere(sphere, index);

                    // sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
                    // sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
                } else {
                    // Apply gravity to fireball
                    sphere.velocity.y -= GRAVITY * deltaTime;
                }

                // Check distance from initial position
                if (sphere.initialPosition) {
                    const traveledDistance = sphere.collider.center.distanceTo(
                        sphere.initialPosition,
                    );
                    const maxDistance = 30; // Maximum distance the fireball can travel

                    if (traveledDistance > maxDistance) {
                        scene.remove(sphere.mesh); // Remove the fireball from the scene
                        spheres.splice(index, 1); // Remove it from the array
                    }
                }

                playerSphereCollision(sphere, index);

                if (now - sphere.lastTrailTime > TRAIL_INTERVAL) {
                    const ghost = new THREE.Mesh(trailGeometry, getTrailMaterial(sphere.type).clone());
                    ghost.position.copy(sphere.mesh.position);
                    scene.add(ghost);

                    sphere.trail.push({mesh: ghost, birth: now});
                    sphere.lastTrailTime = now;
                }

                // Удаляем старые точки следа
                for (let i = sphere.trail.length - 1; i >= 0; i--) {
                    const age = now - sphere.trail[i].birth;
                    const fade = 1 - age / TRAIL_LIFETIME;
                    sphere.trail[i].mesh.material.opacity = 0.3 * fade;

                    if (age > TRAIL_LIFETIME) {
                        scene.remove(sphere.trail[i].mesh);
                        sphere.trail[i].mesh.geometry.dispose();
                        sphere.trail[i].mesh.material.dispose();
                        sphere.trail.splice(i, 1);
                    }
                }
            });

            // spheresCollisions(); // Handle collisions between spheres

            for (let sphere of spheres) {
                sphere.mesh.position.copy(sphere.collider.center);
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

            // Adjust walking and running speed
            const baseWalkSpeed = 8; // Base walking speed
            const speedDelta =
                deltaTime * (playerOnFloor ? baseWalkSpeed : 5) * movementSpeedModifier; // Apply speed modifier

            // Rotate playerVelocity when pressing A or D
            if (keyStates["KeyA"]) {
                playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
                if (!isAnyActionRunning()) setAnimation("Walk");
            }

            if (keyStates["KeyD"]) {
                playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("Walk");
            }

            if (keyStates["KeyW"]) {
                const forwardVector = new THREE.Vector3(
                    Math.sin(model.rotation.y),
                    0,
                    Math.cos(model.rotation.y),
                );

                playerVelocity.add(forwardVector.multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("Walk");
            }

            if (keyStates["KeyS"]) {
                const backwardVector = new THREE.Vector3(
                    -Math.sin(model.rotation.y),
                    0,
                    -Math.cos(model.rotation.y),
                );

                playerVelocity.add(backwardVector.multiplyScalar(speedDelta));
                if (!isAnyActionRunning()) setAnimation("Walk");
            }
        }

        // Play or pause animations
        // function playPause() {
        //     actions.forEach(action => settings.play ? action.play() : action.stop());
        // }

        // Show or hide model
        function showModel(visibility) {
            model.visible = visibility;
        }

        // Deactivate all actions
        function deactivateAllActions() {
            actions.forEach((action) => action.stop());
        }

        // Activate all actions
        function activateAllActions() {
            actions.forEach((action) => action.play());
        }

        // Modify time scale for animations
        function modifyTimeScale(speed) {
            mixer.timeScale = speed;
        }

        let isSomeActionRunning = false;

        function controlAction({
                                   action, // THREE.AnimationAction to control
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
            isSomeActionRunning = true;

            // Attach an event listener for when the animation ends
            if (loop === THREE.LoopOnce && onEnd) {
                const onAnimationEnd = (event) => {
                    if (event.action === action) {
                        mixer.removeEventListener("finished", onAnimationEnd); // Clean up listener
                        isSomeActionRunning = false;
                        onEnd(event);
                    }
                };

                mixer.addEventListener("finished", onAnimationEnd);
            }
        }

        function setAnimation(actionName) {
            switch (actionName) {
                case "Idle":
                    controlAction({action: idleAction, mixer: mixer, fadeIn: 0.5});
                    break;
                case "Walk":
                    controlAction({action: walkAction, mixer: mixer, fadeIn: 0.2});
                    break;
                case "Run":
                    controlAction({action: runAction, mixer: mixer, fadeIn: 0.2});
                    break;
            }
        }

        // init models
        // 1
        const modelMurloc = models["murloc"];

        modelMurloc.scale.set(0.2, 0.2, 0.2);
        modelMurloc.position.set(
            -0.35729391097157387,
            3.48741981278374,
            33.25421090119351,
        );

        scene.add(modelMurloc);
        worldOctree.fromGraphNode(modelMurloc);
        // camera.lookAt( modelMurloc.position )
        // playerCollider.lookAt(modelMurloc.position);

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


        model.traverse((object) => {
            if (object.isMesh) object.castShadow = true;
        });
        model.scale.set(0.4, 0.4, 0.4);

        // 4
        scene.add(model);

        // Create a DOM element for the player's name
        // const nameDiv = document.createElement('div');
        // nameDiv.className = 'name-label';
        // nameDiv.textContent = 'Me';
        // nameDiv.style.color = 'white';
        // nameDiv.style.fontSize = '12px';
        // nameDiv.style.textAlign = 'center';
        //
        // // Attach the name label to the player
        // const nameLabel = new CSS2DObject(nameDiv);
        // nameLabel.position.set(0, 1.6, 0); // Adjust position above the player model
        // model.add(nameLabel);

        playerCollider.start.set(...USER_DEFAULT_POSITION);
        playerCollider.end.set(
            USER_DEFAULT_POSITION[0],
            USER_DEFAULT_POSITION[1] + 0.75,
            USER_DEFAULT_POSITION[2],
        );
        playerCollider.radius = 0.35;
        mixer = new THREE.AnimationMixer(model);
        mixer.timeScale = 40;

        const animations = models["character_animations"];

        idleAction = mixer.clipAction(animations[2]);
        walkAction = mixer.clipAction(animations[6]);
        runAction = mixer.clipAction(animations[6]);
        jumpAction = mixer.clipAction(animations[3]);
        castAction = mixer.clipAction(animations[0]);

        setAnimation("Idle");

        actions = [idleAction, walkAction, runAction, castAction, jumpAction];

        function isAnyActionRunning(excludeActions = []) {
            if (!mixer) return false; // Ensure mixer exists

            return actions.some(
                (action) => action.isRunning() && !excludeActions.includes(action),
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

            // Update the model's position
            if (model) {
                model.position.set(position.x, position.y - 0.5, position.z); // Adjust for model offset
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
        let shieldEffectModel;

        // Create a bubble-like shield
        const bubbleGeometry = new THREE.SphereGeometry(1.5, 32, 32); // Reduced segments for better performance
        const bubbleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff, // Light blue
            opacity: 0.7,
            transparent: true,
        });

        const bubbleShield = new THREE.Mesh(bubbleGeometry, bubbleMaterial);

        bubbleShield.scale.set(0.4, 0.4, 0.4);
        scene.add(bubbleShield);

        function updateModel() {
            if (model) {
                const playerPosition = new THREE.Vector3();

                playerCollider.getCenter(playerPosition);

                // Update model position and height
                model.position.copy(playerPosition);
                // model.position.y += 0.5; // Adjust the height to keep the model slightly above ground
                model.position.y -= 0.5;
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

                if (isShieldActive) {
                    if (!shieldEffectModel) {
                        // If the shield model isn't already in the scene, add it
                        shieldEffectModel = bubbleShield;
                        scene.add(shieldEffectModel);
                    }

                    const playerPosition = new THREE.Vector3();

                    model.getWorldPosition(playerPosition); // Get the player's position
                    playerPosition.y += 0.2;
                    shieldEffectModel.position.copy(playerPosition);
                } else if (shieldEffectModel) {
                    // Remove the shield model if shield is no longer active
                    scene.remove(shieldEffectModel);
                    shieldEffectModel = null;
                }
            }
        }

        // Example function to send player position updates to the server
        function sendPositionUpdate() {
            if (!playerCollider.start) return;

            const position = {
                x: playerCollider.start.x,
                y: playerCollider.start.y,
                z: playerCollider.start.z,
            };

            const rotation = {
                y: model?.rotation?.y || 0, // Send only the Y-axis rotation
            };

            sendToSocket({type: "updatePosition", position, rotation});
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
                document.getElementById("respawnButton").style.display = "block"; // Показываем кнопку
                playerVelocity.set(0, 0, 0); // Останавливаем движение

                return; // Пропускаем обновления
            }

            const deltaTime = Math.min(0.04, delta) / STEPS_PER_FRAME;

            // Update the character model and animations
            if (mixer) mixer.update(deltaTime);
            remoteMixers.forEach(m => m.update(deltaTime));
            // we look for collisions in substeps to mitigate the risk of
            // an object traversing another too quickly for detection.

            for (let i = 0; i < STEPS_PER_FRAME; i++) {
                controls(deltaTime);

                updatePlayer(deltaTime);
                updateSpheres(deltaTime);

                updateModel();
                // renderCursor();
                updateCameraPosition();
            }

            teleportPlayerIfOob();

            updateHPBar();
            updateManaBar();
            sendPositionUpdate();

            renderer.render(scene, camera);
            labelRenderer.render(scene, camera); // Render labels

            stats.update();
        }

        // Function to create a new player in the scene
        function createPlayer(id, name = "") {
            if (model) {

                const player = SkeletonUtils.clone(model);

                player.position.set(...USER_DEFAULT_POSITION);


                player.rotation.set(0, 0, 0);
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

                const mixer = new THREE.AnimationMixer(player)
                const idle = mixer.clipAction(animations[2]).play();
                const walk = mixer.clipAction(animations[6]);


                scene.add(player);
                players[id] = {
                    model: player,
                    mixer: mixer,
                    idle: idle,
                    walk: walk,
                    prevPos: new THREE.Vector3().copy(player.position)
                }
                console.log("model: ", model);
                remoteMixers.push(mixer);   // массив всех чужих миксеров
            }
        }

        // Function to update a player's position
        function updatePlayerPosition(id, position, rotation) {
            const p = players[id];
            console.log("players: ", players, id);
            if (!p) return;
            console.log("p: ", p);
            p.model.position.set(position.x, position.y, position.z);
            p.model.rotation.y = rotation?.y;
            const moved = p.prevPos.distanceToSquared(p.model.position) > 0.0001;
            console.log("moved: ", moved);
            if (moved) {
                if (!p.walk.isRunning()) {      // включаем Walk
                    p.idle.fadeOut(0.1);
                    p.walk.reset().fadeIn(0.1).play();
                }
            } else {
                if (!p.idle.isRunning()) {      // включаем Idle
                    p.walk.fadeOut(0.2);
                    p.idle.reset().fadeIn(0.2).play();
                }
            }

            p.prevPos.copy(p.model.position);

        }

        // Function to remove a player from the scene
        function removePlayer(id) {
            if (players[id]) {
                scene.remove(players[id]);
                delete players[id];
            }
        }

        function castSphereOtherUser(data, ownerId) {
            const material = data.type === "fireball" ? fireballMaterial : iceballMaterial;
            const fireball = new THREE.Mesh(fireballGeometry, material.clone());

            fireball.position.set(
                data.position.x,
                data.position.y,
                data.position.z,
            );
            fireball.rotation.set(
                data.rotation.x,
                data.rotation.y,
                data.rotation.z,
            );

            scene.add(fireball);

            spheres.push({
                mesh: fireball,
                collider: new THREE.Sphere(
                    new THREE.Vector3().copy(fireball.position),
                    SPHERE_RADIUS,
                ),
                trail: [], // массив точек следа
                lastTrailTime: performance.now(),
                velocity: new THREE.Vector3(
                    data.velocity.x,
                    data.velocity.y,
                    data.velocity.z,
                ),
                type: data.type,
                ownerId,
            });
        }

        function castShieldOtherUser() {
        }

        // Handle incoming messages from the server
        socket.onmessage = async (event) => {
            let message = JSON.parse(event.data);

            switch (message.type) {
                case "CAST_SPELL":
                    switch (message?.payload?.type) {
                        case "fireball":
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "iceball":
                            castSphereOtherUser(message.payload, message.id);
                            break;
                        case "shield":
                            castShieldOtherUser(message.payload);
                            break;
                    }

                    break;
                case "SEND_CHAT_MESSAGE":
                    dispatch({
                        type: "SEND_CHAT_MESSAGE",
                        payload: `${message?.character?.name} say: ${message.payload}`,
                    });
                    break;
                case "DAMAGED_ME":
                    if (message.damageDealerId === address) {
                        dispatch({
                            type: "SEND_CHAT_MESSAGE",
                            payload: `You deal ${message.damage} to ${message?.character?.name} (current hp: ${message.currentHP})`,
                        });
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
                case "damage":
                    break;
                case "updatePosition":
                    updatePlayerPosition(
                        message.fromId,
                        message.position,
                        message.rotation,
                    );
                    break;
                case "removePlayer":
                    removePlayer(message.id);
                    break;
                case "MATCH_READY":
                    setIsReadyToPlay(true);
                    appendRenderer();

                    Object.keys(players).forEach((id) => {
                        removePlayer(id);
                    });

                    console.log("MATCH_READY: ",  message);
                    message.players.forEach((playerId) => {
                        if (playerId !== message.myPlayerId) {
                            createPlayer(playerId, String(playerId));
                        }
                    })
                    break;
            }
        };

        const manaInterval = setInterval(
            () => (mana = mana < 100 ? mana + 5 : mana),
            1000,
        );

        sendToSocket({
            type: 'READY_FOR_MATCH'
        });
        return () => {
            clearInterval(manaInterval);
        };
    }, []);

    return (
        <div ref={containerRef} id="game-container">
            <Interface/>
            {!isReadyToPlay && (<span>Wait Players</span>)}
        </div>
    );
}
