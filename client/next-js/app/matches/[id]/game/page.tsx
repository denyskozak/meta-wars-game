"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { useParams } from "next/navigation";

import { CLASS_MODELS } from "@/consts";
import { assetUrl } from "@/utilities/assets";
import { useWS } from "@/hooks/useWS";
import { useInterface } from "@/context/inteface";
import { Game } from "@/components/game";
import { Loading } from "@/components/loading";

interface Character {
  name?: string;
  classType?: string;
  skin?: string;
}

THREE.Cache.enabled = true;

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("/libs/draco/");

const loader = new GLTFLoader().setPath(assetUrl("/models/"));

loader.setDRACOLoader(dracoLoader);
loader.setMeshoptDecoder(MeshoptDecoder);

export default function GamePage() {
  const account = useCurrentAccount();
  const params = useParams();

  const [preloadedData, setPreloadedData] = useState({
    models: {},
    sounds: {},
    textures: {},
  });
  const {
    state: { character },
    dispatch,
  } = useInterface() as {
    state: { character: Character | null };
    dispatch: React.Dispatch<any>;
  };

  // const [showReconnect, setShowReconnect] = useState(false);
  // const [joinError, setJoinError] = useState<string | null>(null);
  // const [joined, setJoined] = useState(false);

  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     const message = JSON.parse(event.data);
  //     const addr = account?.address;
  //
  //     switch (message.type) {
  //       case "GET_MATCH": {
  //         const match = message.match;
  //         if (!addr) break;
  //
  //         const inPlayers = (match.players as Array<[string, any]>).find(
  //           ([, p]) => p.address === addr,
  //         );
  //         console.log("inPlayers: ", inPlayers);
  //         if (inPlayers) {
  //           dispatch({
  //             type: "SET_CHARACTER",
  //             payload: {
  //               name: inPlayers[1].classType,
  //               classType: inPlayers[1].classType,
  //               skin: inPlayers[1].character,
  //             },
  //           });
  //           console.log("1: ", {
  //             type: "SET_CHARACTER",
  //             payload: {
  //               name: inPlayers[1].classType,
  //               classType: inPlayers[1].classType,
  //               skin: inPlayers[1].character,
  //             },
  //           });
  //           setJoined(true);
  //           setShowReconnect(false);
  //           break;
  //         }
  //
  //         const reserve = match.resorve || [];
  //         const maybe = reserve.find((p: any) => p.address === addr);
  //         if (maybe) {
  //           dispatch({
  //             type: "SET_CHARACTER",
  //             payload: {
  //               name: maybe.classType,
  //               classType: maybe.classType,
  //               skin: maybe.character,
  //             },
  //           });
  //           setShowReconnect(true);
  //         } else if (match.isFull) {
  //           setJoinError("Не можете войти");
  //         }
  //         break;
  //       }
  //       case "ME_JOINED_MATCH":
  //         setJoined(true);
  //         setShowReconnect(false);
  //         break;
  //       case "MATCH_JOIN_FAILED":
  //         setJoinError("Не можете войти");
  //         break;
  //     }
  //   };
  //
  //   socket.addEventListener("message", handleMessage);
  //   sendToSocket({ type: "GET_MATCH", matchId: params?.id });
  //   return () => {
  //     socket.removeEventListener("message", handleMessage);
  //   };
  // }, [account?.address, params?.id]);

  const charSkin = character?.classType
    ? CLASS_MODELS[character.classType as keyof typeof CLASS_MODELS] || "vampir"
    : "vampir";

  const models = [
    { id: "zone", path: "zone-fantasy-1.glb" },
    { id: "bolvar", path: "skins/bolvar.glb" },
    { id: "vampir", path: "skins/vampir.glb" },
    { id: "mad", path: "skins/mad.glb" },
    {
      id: "character",
      path: `skins/${charSkin}.glb`,
    },
    { id: "heal-effect", path: "heal-effect.glb" },
    { id: "bottle_magic", path: "bottle_magic.glb" },
    { id: "damage_rune", path: "damage_rune.glb" },
    { id: "heal_rune", path: "heal_rune.glb" },
    { id: "mana_rune", path: "mana_rune.glb" },
    { id: "xp_rune", path: "xp_rune.glb" },
    { id: "mage_staff", path: "skins/items/mage-staff.glb" },
    { id: "warlock_staff", path: "skins/items/warlock-staff.glb" },
    { id: "damage_effect", path: "ice-veins.glb" },
    { id: "shaman_totem", path: "shaman_totem.glb" },
  ];

  useLayoutEffect(() => {
    function preloadModels(modelPaths: any[]) {
      const loadedModels: any = {};

      const promises = modelPaths.map(
        (model) =>
          new Promise<void>((resolve, reject) => {
            loader.load(
              model.path,
              (gltf) => {
                loadedModels[model.id] = gltf.scene;
                if (gltf.animations) {
                  loadedModels[`${model.id}_animations`] = gltf.animations;
                }
                resolve();
              },
              undefined,
              (error) => reject(error),
            );
          }),
      );

      return Promise.all(promises).then(() => loadedModels);
    }

    function preloadTextures() {
      const textureLoader = new THREE.TextureLoader();
      const exrLoader = new EXRLoader();
      const textures: any = {};

      const tasks = [
        new Promise<void>((resolve) => {
          textureLoader.load("/textures/fire.jpg", (t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            textures.fire = t;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          textureLoader.load("/textures/ice.jpg", (t) => {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            textures.ice = t;
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          textureLoader.load(
            "/textures/noise9.jpg",
            (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              textures.noise = t;
              resolve();
            },
          );
        }),
        new Promise<void>((resolve) => {
          textureLoader.load(
            "/textures/sparklenoise.jpg",
            (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              textures.sparkle = t;
              resolve();
            },
          );
        }),
        new Promise<void>((resolve) => {
          exrLoader.load("/textures/world.exr", (t) => {
            textures.world = t;
            resolve();
          });
        }),
      ];

      return Promise.all(tasks).then(() => textures);
    }

    // init
    const sounds = {
      fireball: new Audio(assetUrl("/sounds/fireball.ogg")),
      fireballCast: new Audio(assetUrl("/sounds/fireball-cast.ogg")),
      iceball: new Audio(assetUrl("/sounds/iceball.ogg")),
      iceballCast: new Audio(assetUrl("/sounds/iceball-cast.ogg")),
      heal: new Audio(assetUrl("/sounds/heal.ogg")),
      spellCast: new Audio(assetUrl("/sounds/spell-cast.ogg")),
      background: new Audio(assetUrl("/sounds/Elwynn.mp3")),
      blink: new Audio(assetUrl("/sounds/blink.ogg")),
      damage: new Audio(assetUrl("/sounds/damage.ogg")),
      noMana: new Audio(assetUrl("/sounds/no-mana.ogg")),
      noTarget: new Audio(assetUrl("/sounds/no-target.ogg")),
      cooldown: new Audio(assetUrl("/sounds/cooldown.ogg")),
      xpRune: new Audio(assetUrl("/sounds/xp-rune.ogg")),
      healRune: new Audio(assetUrl("/sounds/heal-rune.ogg")),
      manaRune: new Audio(assetUrl("/sounds/mana-rune.ogg")),
      damageRune: new Audio(assetUrl("/sounds/damage-rune.ogg")),
      sinisterStrike: new Audio(assetUrl("/sounds/sinister-strike.ogg")),
      mortalStrike: new Audio(assetUrl("/sounds/mortal-strike.ogg")),
      charge: new Audio(assetUrl("/sounds/charge.ogg")),
      shadowLeap: new Audio(assetUrl("/sounds/shadowleap.ogg")),
      bladestorm: new Audio(assetUrl("/sounds/bladestorm.ogg")),
      levelUp: new Audio(assetUrl("/sounds/level-up.ogg")),
    };

    Promise.all([preloadModels(models), preloadTextures()]).then(
      ([loadedModels, loadedTextures]) => {
        setPreloadedData({
          models: loadedModels,
          sounds,
          textures: loadedTextures,
        });
      },
    );
  }, [charSkin]);

  if (
    Object.keys(preloadedData.models).length < models.length ||
    Object.keys(preloadedData.textures).length < 5
  ) {
    return <Loading text="Loading assets..." />;
  }

  // if (joinError) {
  //   return (
  //     <div className="h-full flex items-center justify-center text-red-500">
  //       {joinError}
  //     </div>
  //   );
  // }

  // if (!joined) {
  //   if (showReconnect) {
  //     return (
  //       <div className="h-full flex items-center justify-center">
  //         <button
  //           className="px-4 py-2 bg-blue-500 text-white rounded"
  //           onClick={() => sendToSocket({ type: "JOIN_MATCH", matchId: params?.id })}
  //         >
  //           Reconnect
  //         </button>
  //       </div>
  //     );
  //   }
  //   return <Loading text="Connecting..." />;
  // }

  return (
    <>
      <Game
        character={character}
        matchId={params?.id}
        models={preloadedData.models}
        sounds={preloadedData.sounds}
        textures={preloadedData.textures}
      />
      {/*<DeveloperPanel models={preloadedData.models} />*/}
    </>
  );
}
