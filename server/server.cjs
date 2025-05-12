const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
// const { // const { mintCoins } = require('./sui.cjs');mintCoins } = require('./sui.cjs');

const clients = new Map();

// Prod
const server = http.createServer();
const ws = new WebSocket.Server({ server });


// Dev
// const ws = new WebSocket.Server({port: 8080});

ws.on('connection', (socket) => {
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
            case 'KILL':
                const { killerId } = message;

                // Mint coins for the killer using a Move smart contract
                // mintCoins(killerId, 1) // Example: Award 10 coins to the killer
                //     .then((txHash) => {
                //         console.log(`Minted coins for Player ${killerId}. Transaction Hash: ${txHash}`);
                //
                //         // Broadcast the kill event and reward info
                //         broadcastIt({
                //             ...message,
                //             killerId,
                //             txHash,
                //         });
                //     })
                //     .catch((err) => {
                //         console.error(`Failed to mint coins for Player ${killerId}:`, err);
                //     });
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


server.listen(4000, () => {
    console.log('Secure WebSocket server is running on wss://your-domain.com:8080');
});