import {useCurrentAccount, useSuiClientQuery} from "@mysten/dapp-kit";
import {PACKAGE_ID} from "@/consts";

export const useCoins = () => {
    const account = useCurrentAccount();

    const {data, refetch} = useSuiClientQuery(
        'getCoins',
        {owner: account?.address, coinType: `${PACKAGE_ID}::coin::COIN`},
        {
            gcTime: 10000,
        },
    );

    const coins = Array.isArray(data?.data)
        ? (data?.data.reduce((acc, item) => acc + Number(item.balance), 0)) / 1000000
        : 0;

    return {coins, refetch};
}