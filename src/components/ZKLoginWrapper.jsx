import {useSuiClient} from "@mysten/dapp-kit";
import {ZKLoginProvider} from "react-sui-zk-login-kit";

export const ZKLoginWrapper = ({ children }) => {

    const client = useSuiClient();

    return (
        <ZKLoginProvider client={client}>
            {children}
        </ZKLoginProvider>
    )
}