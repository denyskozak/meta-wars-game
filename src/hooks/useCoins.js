import {PACKAGE_ID} from "../consts.js";
import {useZKLogin} from "react-sui-zk-login-kit";
import {useSuiClientQuery} from "@mysten/dapp-kit";

export const useCoins = () => {
    const {address} = useZKLogin();

    const {data, refetch} = useSuiClientQuery(
        'getCoins',
        {owner: address, coinType: `${PACKAGE_ID}::coin::COIN`},
        {
            gcTime: 10000,
        },
    );

    const coins = Array.isArray(data?.data)
        ? (data?.data.reduce((acc, item) => acc + Number(item.balance), 0)) / 1000000
        : 0;

    return {coins, refetch};
}