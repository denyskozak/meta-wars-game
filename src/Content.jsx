import {Game} from "./components/Game";
import {Loading} from "./components/Loading";
import {useLayoutEffect, useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/addons";

THREE.Cache.enabled = true;

const loader = new GLTFLoader().setPath('./models/');

export const Content = () => {
    const [preloadedData, setPreloadedData] = useState({
        models: {},
        sounds: {}
    });

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
            fireball: new Audio('/sounds/fireball.MP3'),
            background: new Audio('/sounds/Elwynn.mp3'),
        }
        preloadModels([
            {id: 'murloc', path: 'murloc_creature.glb'},
            {id: 'zone', path: 'zone2.glb'},
            {id: 'fireball', path: 'fireball.glb'},
            {id: 'character', path: 'skins/mad.glb'},
            {id: 'heal-effect', path: 'heal-effect.glb'},
            {id: 'shield-effect', path: 'shield-effect.glb'},
        ])
            .then((loadedModels) => setPreloadedData({models: loadedModels, sounds}));
    }, []);

    return Object.keys(preloadedData.models).length > 5 ? <Game models={preloadedData.models} sounds={preloadedData.sounds}/> : <Loading/>
};
