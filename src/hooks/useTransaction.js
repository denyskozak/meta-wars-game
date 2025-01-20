import {Transaction} from "@mysten/sui/transactions";
import {useZKLogin} from "react-sui-zk-login-kit";

export const useTransaction = (packageId) => {
    const {address} = useZKLogin();
    return {
        createNewCharacter(name, charClass) {
            const tx = new Transaction();

            const [character] = tx.moveCall({
                target: `${packageId}::character::create_character`,
                arguments: [tx.pure.string(name), tx.pure.string(charClass)],
            });

            tx.transferObjects([character], tx.pure.address(address));
            tx.setSender(address);
            return tx;
        },
        removeCharacter(id) {
            const tx = new Transaction();

            tx.moveCall({
                target: `${packageId}::character::delete`,
                arguments: [tx.object(id)],
            });

            tx.setSender(address);

            return tx;
        }
    }
}