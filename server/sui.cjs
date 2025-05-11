const {SuiClient,} = require('@mysten/sui/client');
const {Ed25519Keypair} = require('@mysten/sui/keypairs/ed25519');
const {Transaction} = require('@mysten/sui/transactions');

const PRIVATE_KEY = 'suiprivkey1qr9pudpqlzhaa30h8p86ekte6dcjmpuft48s64m2gq69248afpnhw4sckev'; // Private key (Hex string)

const keypair = Ed25519Keypair.fromSecretKey(PRIVATE_KEY);
const client = new SuiClient({
    url: 'https://fullnode.devnet.sui.io', // Change to the appropriate endpoint
});

const PACKAGE_ID = '0x9747359e604b83d72dbaaa05ec39558a390138f656085d7abf6604e1805c3546';
const TREASURY_CAP_OBJECT_ID = '0xa39d534ad0acc77b4d83f099a556d88ac11745c4d4d395b00d99217d9d22ff13';

// Function to send a mint transaction
async function mintCoins(recipientAddress, amount) {
    try {
        // Create a new TransactionBlock
        const tx = new Transaction();

        // Add a move call to the transaction
        tx.moveCall({
            target: `${PACKAGE_ID}::coin::mint`, // Replace with your package, module, and function name
            arguments: [
                tx.object(TREASURY_CAP_OBJECT_ID), // Replace with your treasury cap object ID
                tx.pure.u64(amount * 1000000), // Amount to mint
                tx.pure.address(recipientAddress), // Recipient's address
            ],
        });

        tx.setGasBudget(10000000);
        tx.setSender(keypair.toSuiAddress());

        const transactionBytes = await tx.build({ client });
        const { signature, bytes } = await keypair.signTransaction(transactionBytes);
        client.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
        });

        // const result = await client.signAndExecuteTransaction({
        //     signer: keypair,
        //     transactionBlock: tx,
        // });


        console.log('Transaction succeeded:');
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

module.exports = {
    mintCoins
}