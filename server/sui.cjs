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
const LOOTBOX_CAP_OBJECT_ID = '0x0123456789abcdef';
const ADMIN_CAP_OBJECT_ID = '0xabcdef0123456789';

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

async function mintChest(recipientAddress, type) {
    try {
        const tx = new Transaction();
        const fn = `create_${type}`;
        const [box] = tx.moveCall({
            target: `${PACKAGE_ID}::lootbox::${fn}`,
            arguments: [
                tx.object(LOOTBOX_CAP_OBJECT_ID),
                tx.object(TREASURY_CAP_OBJECT_ID),
            ],
        });
        tx.transferObjects([box], tx.pure.address(recipientAddress));
        tx.setGasBudget(10000000);
        tx.setSender(keypair.toSuiAddress());
        const bytes = await tx.build({ client });
        const { signature, bytes: signed } = await keypair.signTransaction(bytes);
        await client.executeTransactionBlock({ transactionBlock: signed, signature });
    } catch (error) {
        console.error('mintChest failed:', error);
    }
}

async function mintItem(recipientAddress, itemType) {
    try {
        const tx = new Transaction();
        const [it] = tx.moveCall({
            target: `${PACKAGE_ID}::item::create_item`,
            arguments: [
                tx.object(ADMIN_CAP_OBJECT_ID),
                tx.pure.string(itemType),
            ],
        });
        tx.transferObjects([it], tx.pure.address(recipientAddress));
        tx.setGasBudget(10000000);
        tx.setSender(keypair.toSuiAddress());
        const bytes = await tx.build({ client });
        const { signature, bytes: signed } = await keypair.signTransaction(bytes);
        await client.executeTransactionBlock({ transactionBlock: signed, signature });
    } catch (error) {
        console.error('mintItem failed:', error);
    }
}

async function mintItemWithOptions(recipientAddress, itemType, opts = {}) {
    try {
        const tx = new Transaction();

        const [table] = tx.moveCall({
            target: '0x2::table::new',
            typeArguments: ['0x1::string::String', '0x1::string::String'],
            arguments: [],
        });

        if (opts.class) {
            tx.moveCall({
                target: '0x2::table::add',
                typeArguments: ['0x1::string::String', '0x1::string::String'],
                arguments: [table, tx.pure.string('class'), tx.pure.string(opts.class)],
            });
        }

        if (opts.skin) {
            tx.moveCall({
                target: '0x2::table::add',
                typeArguments: ['0x1::string::String', '0x1::string::String'],
                arguments: [table, tx.pure.string('skin'), tx.pure.string(opts.skin)],
            });
        }

        const [it] = tx.moveCall({
            target: `${PACKAGE_ID}::item::create_item_with_options`,
            arguments: [
                tx.object(ADMIN_CAP_OBJECT_ID),
                tx.pure.string(itemType),
                table,
            ],
        });
        tx.transferObjects([it], tx.pure.address(recipientAddress));
        tx.setGasBudget(10000000);
        tx.setSender(keypair.toSuiAddress());
        const bytes = await tx.build({client});
        const {signature, bytes: signed} = await keypair.signTransaction(bytes);
        await client.executeTransactionBlock({transactionBlock: signed, signature});
    } catch (error) {
        console.error('mintItemWithOptions failed:', error);
    }
}

async function createProfile(recipientAddress, nickname) {
    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::profile::mint_profile`,
            arguments: [tx.pure.string(nickname), tx.pure.address(recipientAddress)],
        });
        tx.setGasBudget(10000000);
        tx.setSender(keypair.toSuiAddress());
        const bytes = await tx.build({ client });
        const { signature, bytes: signed } = await keypair.signTransaction(bytes);
        await client.executeTransactionBlock({ transactionBlock: signed, signature });
    } catch (error) {
        console.error('createProfile failed:', error);
    }
}

module.exports = {
    mintCoins,
    mintChest,
    mintItem,
    mintItemWithOptions,
    createProfile,
};
