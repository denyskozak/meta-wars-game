import {useZKLogin, ZKLogin} from "react-sui-zk-login-kit";
import {Box} from "@mui/material";
import {useEffect} from "react";
import {generateRandomness} from "@mysten/sui/zklogin";
import "react-sui-zk-login-kit"
// Example configuration
const SUI_PROVER_ENDPOINT = 'https://prover-dev.mystenlabs.com/v1';

const providers = {
    google: {
        clientId: "648851101099-uit5tqa2gf0nr1vvpjorc87k2u4minip.apps.googleusercontent.com",
        // redirectURI: "https://meta-wars.react-sui-zk-login.com",
        redirectURI: "http://localhost:5173",
    },
    twitch: {
        clientId: "ltu7mhvfj4l04maulcjcqx1wm5e5zh",
        // redirectURI: "https://meta-wars.react-sui-zk-login.com",
        redirectURI: "http://localhost:5173",
    }
}

export const Auth = ({children}) => {

    const {encodedJwt, setUserSalt, address, logout} = useZKLogin();

    useEffect(() => {
        // if we have jwt we can do request on your server
        // for generate user salt and associate user jwt with salt for login later
        if (encodedJwt) {
            // in real scenario
            // we can request server with jwt to generate user salt based on this jwt
            // and associate jwt with user salt in a database
            // bonus - send user salt to user email on your server for safe
            const requestMock = new Promise(
                (resolve) =>
                    resolve(localStorage.getItem("userSalt") || generateRandomness() // fake user salt for test
                    )
            );

            // set userSalt for start auth process
            requestMock.then(salt => setUserSalt(String(salt)))
        }
    }, [setUserSalt, encodedJwt]);

    if (!address) return (
        <Box width={320}>
            <ZKLogin providers={providers} proverProvider={SUI_PROVER_ENDPOINT}/>
        </Box>
    );

    return children;
};
