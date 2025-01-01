
import {SuiClientProvider, WalletProvider, createNetworkConfig} from '@mysten/dapp-kit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {getFullnodeUrl} from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';
import {useLayoutEffect, useState} from "react";
import {Game} from "./components/Game";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader";
import {Loading} from "./components/Loading";

const {networkConfig} = createNetworkConfig({
    devnet: {url: getFullnodeUrl('devnet')},
});
const queryClient = new QueryClient()
const loader = new GLTFLoader().setPath('./models/');

export function App() {
    const [models, setModels] = useState({});


    useLayoutEffect(() => {
        function preloadModels(modelPaths) {
            const loadedModels = {};

            const promises = modelPaths.map((model) =>
                new Promise((resolve, reject) => {
                    loader.load(
                        model.path,
                        (gltf) => {
                            loadedModels[model.id] = gltf.scene;
                            resolve();
                        },
                        undefined,
                        (error) => reject(error)
                    );
                })
            );

            return Promise.all(promises).then(() => loadedModels);
        }

        preloadModels([
            {id: 'murloc', path: 'murloc_creature.glb'},
            {id: 'zone', path: 'swamp_location.glb'},
            {id: 'fireball', path: 'fireball.glb'},
            {id: 'character', path: 'judgement_armor.glb'},
        ]).then((loadedModels) => setModels(loadedModels));
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
                <WalletProvider>
                    {/*<AuthLayout>*/}
                    {Object.keys(models).length ? <Game models={models}/> : <Loading />}
                    {/*{<Loading />}*/}
                    {/*</AuthLayout>*/}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}