const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const missionRoutes = require('./routes/missions');
const detectionRoutes = require('./routes/detections');
const droneRoutes = require('./routes/drones');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/drones', droneRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
});

module.exports = app;