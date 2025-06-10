import {Transaction} from "@mysten/sui/transactions";
import {useCurrentAccount, useSignTransaction, useSuiClient} from "@mysten/dapp-kit";
import {PACKAGE_ID, TREASURY_CAP_ID} from "@/consts";

export const useTransaction = () => {
    const account = useCurrentAccount();
    const client = useSuiClient();

    const { mutateAsync: signTransaction } = useSignTransaction();

    const execTransaction = async (tx) => {
        const { bytes, signature, reportTransactionEffects } =
            await signTransaction({
                transaction: tx,
                chain: `sui:devnet`,
            });

        const executeResult = await client.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
            options: {
                showRawEffects: true,
            },
        });
        await client.waitForTransaction({ digest: executeResult.digest });
        reportTransactionEffects(String(executeResult.rawEffects));

    }
    return {
        createNewCharacter(name, charClass) {
            const tx = new Transaction();

            const [character] = tx.moveCall({
                target: `${PACKAGE_ID}::character::create_character`,
                arguments: [tx.pure.string(name), tx.pure.string(charClass)],
            });

            tx.transferObjects([character], tx.pure.address(account?.address));
            tx.setSender(account?.address);
            return execTransaction(tx);
        },
        removeCharacter(id) {
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::character::delete`,
                arguments: [tx.object(id)],
            });

            tx.setSender(account?.address);

            return execTransaction(tx);
        },
        openLootBox(id) {
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::lootbox::open`,
                arguments: [
                    tx.object(id),
                    tx.object(TREASURY_CAP_ID),
                    tx.pure([], 'vector<u8>'),
                ],
            });

            tx.setSender(account?.address);

            return execTransaction(tx);
        }
    }
}