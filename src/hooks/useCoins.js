import {PACKAGE_ID} from "../consts.js";
import {useLayoutEffect, useState} from "react";
import {useZKLogin} from "react-sui-zk-login-kit";

export const useCoins = () => {
    const [coins, setCoins] = useState(0);
    const { address, client} = useZKLogin();

    useLayoutEffect(() => {
        client.getCoins({
            owner: address,
            coinType: `${PACKAGE_ID}::coin::COIN`
        })
            .then(response => {
                if (response?.data?.[0]?.balance) {
                    const numberCoins = Number(response?.data?.[0]?.balance);
                    setCoins(numberCoins / 1000000);
                }
            });
    }, [address]);

    return coins;
}