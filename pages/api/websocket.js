import { Server } from 'ws';
import axios from 'axios';

let wsServer;

const handler = (req, res) => {
    if (!wsServer) {
        wsServer = new Server({ noServer: true });

        wsServer.on('connection', (socket) => {
            socket.on('message', async (message) => {
                const data = JSON.parse(message);
                if (data.action === 'trade') {
                    try {
                        // 1. Ping Lambda function to get master trade details
                        const lambdaResponse = await axios.get('https://pdzsl5xw2kwfmvauo5g77wok3q0yffpl.lambda-url.us-east-2.on.aws/');
                        const masterTrade = lambdaResponse.data;

                        // 2. Login to MT4 API to get a Connection ID
                        const connectResponse = await axios.get('https://mt4.mtapi.io/Connect', {
                            params: {
                                user: '44712225',
                                password: 'tfkp48',
                                host: '18.209.126.198',
                                port: 443
                            }
                        });
                        const connectionID = connectResponse.data.id;

                        // 3. Replicate trade using the Connection ID
                        const tradeResponse = await axios.get('https://mt4.mtapi.io/OrderSend', {
                            params: {
                                id: connectionID,
                                symbol: masterTrade.symbol,
                                operation: masterTrade.operation,
                                volume: masterTrade.volume,
                                takeprofit: masterTrade.takeprofit,
                                comment: masterTrade.comment
                            }
                        });

                        // 4. Send trade details back to frontend
                        socket.send(JSON.stringify(tradeResponse.data));
                    } catch (error) {
                        console.error('Error replicating trade:', error);
                        socket.send(JSON.stringify({ error: 'Trade replication failed' }));
                    }
                }
            });

            socket.send(JSON.stringify({ message: 'Connection established' }));
        });

        res.socket.server.on('upgrade', (request, socket, head) => {
            wsServer.handleUpgrade(request, socket, head, (ws) => {
                wsServer.emit('connection', ws, request);
            });
        });
    }

    res.status(200).json({ message: 'WebSocket server is running' });
};

export default handler;
