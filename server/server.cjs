const WebSocket = require('ws');
const { mintCoins } = require('./sui.cjs');

const server = new WebSocket.Server({port: 8080});
const clients = new Map();

server.on('connection', (socket) => {
    console.log('New client connected.');
    // Assign a unique ID to the new client
    const id = Date.now();
    clients.set(id, socket);

    const broadcastIt = (message = {}) => {
        clients.forEach((client, clientId) => {
            if (clientId !== id) {
                client.send( JSON.stringify({...message, fromId: id, toId: clientId}));
            }
        });
    }

    // Broadcast new player info to all clients
    const joinMessage = {type: 'newPlayer', id};
    broadcastIt(joinMessage);

    // Handle incoming messages from a client
    socket.on('message', (data) => {
        let message = {};

        try {
            message = JSON.parse(data);
        } catch (e) {}
        // Broadcast the message to all other clients

        switch (message.type) {
            case 'kill':
                const { killerId, id: victimId } = message;
                console.log('message ', message)

                // Mint coins for the killer using a Move smart contract
                mintCoins(killerId, 1) // Example: Award 10 coins to the killer
                    .then((txHash) => {
                        console.log(`Minted coins for Player ${killerId}. Transaction Hash: ${txHash}`);

                        // Broadcast the kill event and reward info
                        broadcastIt({
                            type: 'kill',
                            killerId,
                            victimId,
                            reward: 10, // Example reward
                            txHash,
                        });
                    })
                    .catch((err) => {
                        console.error(`Failed to mint coins for Player ${killerId}:`, err);
                    });
                break;
            default:
                broadcastIt(message);
        }
    });

    // Handle client disconnect
    socket.on('close', () => {
        console.log(`Client ${id} disconnected.`);
        clients.delete(id);

        // Notify all clients about the disconnection
        const disconnectMessage = JSON.stringify({type: 'removePlayer', id});
        clients.forEach((client) => {
            client.send(disconnectMessage);
        });
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
