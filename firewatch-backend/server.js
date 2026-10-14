require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const startMqtt = require('./mqtt/subscriber');

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await connectDB();
        startMqtt();
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start: ', err.message);
        process.exit(1);
    }
}

start();