"use client";

import React, {useLayoutEffect, useState} from "react";

import {Game} from "@/components/game";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {useInterface} from "@/context/inteface";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {useParams} from "next/navigation";
import {useWS} from "@/hooks/useWS";
import Image from "next/image";
import {Loading} from "@/components/loading";

THREE.Cache.enabled = true;

const loader = new GLTFLoader().setPath('/models/');


export default function GamePage() {
    const account = useCurrentAccount();
    const params = useParams();
    const {socket, sendToSocket} = useWS(params?.id);

    const [preloadedData, setPreloadedData] = useState({
        models: {},
        sounds: {}
    });
    const {state: {character}} = useInterface();

    const models = [
        {id: 'zone', path: 'zone2.glb'},
        {id: 'fireball', path: 'fireball2.glb'},
        {id: 'character', path: 'skins/vampir.glb'},
        {id: 'heal-effect', path: 'heal-effect.glb'},
        {id: 'fire', path: 'stuff/fire.glb'},
        {id: 'bottle_magic', path: 'bottle_magic.glb'},
        {id: 'damage_rune', path: 'damage_rune.glb'},
        {id: 'heal_rune', path: 'heal_rune.glb'},
        {id: 'mana_rune', path: 'mana_rune.glb'},
    ];

    useLayoutEffect(() => {
        function preloadModels(modelPaths: any[]) {
            const loadedModels: any = {};

            const promises = modelPaths.map((model) =>
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
                        (error) => reject(error)
                    );
                })
            );

            return Promise.all(promises).then(() => loadedModels);
        }

        // init
        const sounds = {
            fireball: new Audio('/sounds/fireball.ogg'),
            fireballCast: new Audio('/sounds/fireball-cast.ogg'),
            iceball: new Audio('/sounds/iceball.ogg'),
            iceballCast: new Audio('/sounds/iceball-cast.ogg'),
            heal: new Audio('/sounds/heal.ogg'),
            spellCast: new Audio('/sounds/spell-cast.ogg'),
            background: new Audio('/sounds/Elwynn.mp3'),
            blink: new Audio('/sounds/blink.ogg'),
            damage: new Audio('/sounds/damage.ogg'),
            noTarget: new Audio('/sounds/no-target.ogg'),
        }
        preloadModels(models)
            .then((loadedModels) => {

                setPreloadedData({models: loadedModels, sounds});
            });
    }, []);


    if (Object.keys(preloadedData.models).length < models.length) {
        return (<Loading text="Loading models..."/>)
    }

    return (
        <Game
            matchId={params.id}
            character={character}
            models={preloadedData.models}
            sounds={preloadedData.sounds}
        />
    );
}
