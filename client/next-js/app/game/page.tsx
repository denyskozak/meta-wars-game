"use client";

import React, {useLayoutEffect, useState} from "react";

import {Game} from "@/components/game";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {useInterface} from "@/context/inteface";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

THREE.Cache.enabled = true;

const loader = new GLTFLoader().setPath('./models/');


export default function GamePage() {
    const account = useCurrentAccount();
    const [preloadedData, setPreloadedData] = useState({
        models: {},
        sounds: {}
    });
    const {state: {character}} = useInterface();

    const models = [
        {id: 'murloc', path: 'murloc_creature.glb'},
        {id: 'zone', path: 'zone2.glb'},
        {id: 'fireball', path: 'fireball2.glb'},
        {id: 'character', path: 'skins/mad.glb'},
        {id: 'heal-effect', path: 'heal-effect.glb'},
        {id: 'fire', path: 'stuff/fire.glb'},
        {id: 'arthas', path: 'arthas.glb'},
        {id: 'stormwind_guard', path: 'stormwind_guard.glb'},
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
            heal: new Audio('/sounds/heal.ogg'),
            spellCast: new Audio('/sounds/spell-cast.ogg'),
            background: new Audio('/sounds/Elwynn.mp3'),
            blink: new Audio('/sounds/blink.ogg'),
        }
        preloadModels(models)
            .then((loadedModels) => setPreloadedData({models: loadedModels, sounds}));
    }, []);

    // if (!account) return <Landing />
    console.log('character ', character)
    // if (!character) return <CharacterManager/>;

    console.log('Object.keys(preloadedData.models).length ', Object.keys(preloadedData.models).length)
    console.log('models.length ', models.length)
    if (Object.keys(preloadedData.models).length < models.length) {
        return (<span>Loading</span>)
    }

    return (
        <Game character={character} models={preloadedData.models} sounds={preloadedData.sounds} />
    );
}
