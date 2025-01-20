import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ZKLoginProvider} from "react-sui-zk-login-kit";
import {SuiClient} from "@mysten/sui/client";
import {Auth} from "./Auth.jsx";
import {Content} from "./Content.jsx";
import CharacterManager from "./components/Character.jsx";
import {SuiClientProvider} from "@mysten/dapp-kit";
import {getFullnodeUrl} from "@mysten/sui/client";
import {useState} from "react";
import {InterfaceProvider} from "./context/inteface.jsx";

const queryClient = new QueryClient();

const suiClient = new SuiClient({url: getFullnodeUrl('devnet')});

const networks = {
    devnet: {url: getFullnodeUrl('devnet')},
};

export function App() {
    return (
        <div className="container">
            <ZKLoginProvider client={suiClient}>
                <QueryClientProvider client={queryClient}>
                    <SuiClientProvider networks={networks} defaultNetwork="devnet">
                        <Auth>
                            <InterfaceProvider>
                                <Content/>
                            </InterfaceProvider>
                        </Auth>
                    </SuiClientProvider>
                </QueryClientProvider>
            </ZKLoginProvider>
        </div>
    );
}

