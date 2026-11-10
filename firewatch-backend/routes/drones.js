const express = require('express');
const Telemetry = require('../models/Telemetry');

const router = express.Router();

// Latest telemetry record for each drone
router.get('/', async (req, res) => {
    const drones = await Telemetry.aggregate([
        { $sort: { droneId: 1, timestamp: -1 } },
        { $group: { _id: '$droneId', latest: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$latest' } },
    ]);
    res.json(drones);
});

module.exports = router;