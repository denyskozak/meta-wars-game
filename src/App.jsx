import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ZKLoginProvider} from "react-sui-zk-login-kit";
import {SuiClient} from "@mysten/sui/client";
// import {Auth} from "./Auth.jsx";
import {Content} from "./Content.jsx";
const queryClient = new QueryClient()

const FULLNODE_URL = "https://fullnode.devnet.sui.io/";
const suiClient = new SuiClient({url: FULLNODE_URL});

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ZKLoginProvider client={suiClient}>
                {/*<Auth>*/}
                    <Content />
                {/*</Auth>*/}
            </ZKLoginProvider>
        </QueryClientProvider>
    );
}

