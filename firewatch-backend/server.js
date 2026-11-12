require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const startMqtt = require('./mqtt/subscriber');

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

async function start() {
    try {
        await connectDB();

        const server = http.createServer(app);
        const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });
        app.set('io', io);

        io.on('connection', (socket) => {
            console.log(` [ws] client connected: ${socket.id}`);
            socket.on('disconnect', () => console.log(` [ws] client disconnected: ${socket.id}`));
        });
        
        const mqttClient = startMqtt(io);
        app.set('mqtt', mqttClient);
        server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start: ', err.message);
        process.exit(1);
    }
}

start();