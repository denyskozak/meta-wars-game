import {Game} from "./components/Game";
import {Loading} from "./components/Loading";
import {useLayoutEffect, useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/addons";
import {useInterface} from "./context/inteface.jsx";
import CharacterManager from "./components/Character.jsx";

THREE.Cache.enabled = true;

const loader = new GLTFLoader().setPath('./models/');

export const Content = () => {
    const [preloadedData, setPreloadedData] = useState({
        models: {},
        sounds: {}
    });
    const {state: {character}} = useInterface();

    useLayoutEffect(() => {
        function preloadModels(modelPaths) {
            const loadedModels = {};

            const promises = modelPaths.map((model) =>
                new Promise((resolve, reject) => {
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
        preloadModels([
            {id: 'murloc', path: 'murloc_creature.glb'},
            {id: 'zone', path: 'zone2.glb'},
            {id: 'fireball', path: 'fireball2.glb'},
            {id: 'character', path: 'skins/mad.glb'},
            {id: 'heal-effect', path: 'heal-effect.glb'},
            {id: 'fire', path: 'stuff/fire.glb'},
            {id: 'arthas', path: 'arthas.glb'},
            {id: 'stormwind_guard', path: 'stormwind_guard.glb'},
        ])
            .then((loadedModels) => setPreloadedData({models: loadedModels, sounds}));
    }, []);

    if (!character) return <CharacterManager/>;
    return Object.keys(preloadedData.models).length > 5 ?
        <Game character={character} models={preloadedData.models} sounds={preloadedData.sounds}/> : <Loading/>
};
