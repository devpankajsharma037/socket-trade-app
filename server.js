
const express = require('express');
const next = require('next');
const axios = require('axios');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const http = require('http');
const socketIO = require('socket.io');

app.prepare().then(async () => {
    const server = express();
    const httpServer = http.createServer(server);
    const io = socketIO(httpServer);

    io.on('connection', (socket) => {
        console.log('Client connected');
        socket.on('message', async (message) => {
            console.log(message)
            const data = JSON.parse(message);
            if (data.action === 'trade') {
                try {

                    // 1. Ping Lambda function to get master trade details
                    const lambdaResponse = await axios.get('https://pdzsl5xw2kwfmvauo5g77wok3q0yffpl.lambda-url.us-east-2.on.aws/');
                    const masterTrade = lambdaResponse.data;
                    // console.log(lambdaResponse);
                    // 2. Login to MT4 API to get a Connection ID
                    const connectResponse = await axios.get('https://mt4.mtapi.io/Connect?user=44712225&password=tfkp48&host=18.209.126.198&port=443');
                    const connectionID = connectResponse.data;
                    console.log("🚀 ~ socket.on ~ connectResponse.data:", connectResponse.data)

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
                    console.log("🚀 ~ socket.on ~ tradeResponse:", tradeResponse.data)

                    // 4. Send trade details back to frontend
                    socket.emit("message2", JSON.stringify(tradeResponse.data));
                    // console.log(tradeResponse.data);
                    //io.emit('response', JSON.stringify(connectResponse.data));

                } catch (error) {
                    console.error('Error replicating trade:', error);
                    socket.send(JSON.stringify({ error: 'Trade replication failed' }));
                }
            }
        });
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
