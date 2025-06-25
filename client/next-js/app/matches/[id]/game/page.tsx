"use client";

import React, { useLayoutEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { useParams } from "next/navigation";
import { CLASS_MODELS } from "@/consts";

import { useWS } from "@/hooks/useWS";
import { useInterface } from "@/context/inteface";
import { Game } from "@/components/game";
import { Loading } from "@/components/loading";
import { DeveloperPanel } from "@/components/DeveloperPanel";

interface Character {
  name?: string;
  classType?: string;
  skin?: string;
}

THREE.Cache.enabled = true;

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("/libs/draco/");

const loader = new GLTFLoader().setPath("/models/");

loader.setDRACOLoader(dracoLoader);
loader.setMeshoptDecoder(MeshoptDecoder);

export default function GamePage() {
  const account = useCurrentAccount();
  const params = useParams();
  const { socket, sendToSocket } = useWS(params?.id);

  const [preloadedData, setPreloadedData] = useState({
    models: {},
    sounds: {},
    textures: {},
  });
  const {
    state: { character },
  } = useInterface() as { state: { character: Character | null } };

  const charSkin = character?.name
    ? CLASS_MODELS[character.name as keyof typeof CLASS_MODELS] || "vampir"
    : "vampir";

  const models = [
    { id: "zone", path: "zone.glb" },
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
      fireball: new Audio("/sounds/fireball.ogg"),
      fireballCast: new Audio("/sounds/fireball-cast.ogg"),
      iceball: new Audio("/sounds/iceball.ogg"),
      iceballCast: new Audio("/sounds/iceball-cast.ogg"),
      heal: new Audio("/sounds/heal.ogg"),
      spellCast: new Audio("/sounds/spell-cast.ogg"),
      background: new Audio("/sounds/Elwynn.mp3"),
      blink: new Audio("/sounds/blink.ogg"),
      damage: new Audio("/sounds/damage.ogg"),
      noMana: new Audio("/sounds/no-mana.ogg"),
      noTarget: new Audio("/sounds/no-target.ogg"),
      cooldown: new Audio("/sounds/cooldown.ogg"),
      xpRune: new Audio("/sounds/xp-rune.ogg"),
      healRune: new Audio("/sounds/heal-rune.ogg"),
      manaRune: new Audio("/sounds/mana-rune.ogg"),
      damageRune: new Audio("/sounds/damage-rune.ogg"),
      sinisterStrike: new Audio("/sounds/sinister-strike.ogg"),
      mortalStrike: new Audio("/sounds/mortal-strike.ogg"),
      charge: new Audio("/sounds/charge.ogg"),
      shadowLeap: new Audio("/sounds/shadowleap.ogg"),
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
  }, []);

  if (
    Object.keys(preloadedData.models).length < models.length ||
    Object.keys(preloadedData.textures).length < 3
  ) {
    return <Loading text="Loading assets..." />;
  }

  return (
    <>
      <Game
        character={character}
        matchId={params?.id}
        models={preloadedData.models}
        sounds={preloadedData.sounds}
        textures={preloadedData.textures}
      />
      <DeveloperPanel models={preloadedData.models} />
    </>
  );
}
