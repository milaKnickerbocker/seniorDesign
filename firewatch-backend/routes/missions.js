const express = require('express');
const Mission = require('../models/Mission');

const { splitIntoZones } = require('../utils/zones');
const topics = require('../mqtt/topics');

const router = express.Router();

router.get('/', async (req, res) => {
    res.json(await Mission.find().sort({ createdAt: -1 }));
});

router.get('/:id', async (req, res) => {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
});

router.post('/', async (req, res) => {
    const { boundary } = req.body;
    const n = Number(req.body.droneCount);

    if (!Array.isArray(boundary) || boundary.length < 3 || !Number.isInteger(n) || n < 1 || n > 10) {
        return res.status(400).json({ error: 'Need a boundary of at least 3 points and 1 to 10 drones' });
    }

    const zones = splitIntoZones(boundary, n);
    if (zones.some((z) => z.length < 3)) {
        return res.status(400).json({ error: 'Area is too narrow to split between that many drones' });
    }

    const mission = await Mission.create({
        boundary,
        droneCount: n,
        drones: zones.map((zone, i) => ({ droneId: `drone-${i + 1}`, zone })),
    });

    // Send each drone its zone
    const mqttClient = req.app.get('mqtt');
    let dispatched = 0;
    if (mqttClient?.connected) {
        for (const d of mission.drones) {
            const payload = {
                command: 'start_mission',
                missionId: mission._id,
                droneId: d.droneId,
                timestamp: new Date().toISOString(),
                zone: d.zone,
            };
            await new Promise((resolve) =>
                mqttClient.publish(topics.commandFor(d.droneId), JSON.stringify(payload), { qos: 1 }, (err) => {
                    if (!err) dispatched++;
                    resolve();
                })
            );
        }
    }

    req.app.get('io').emit('mission:updated', mission);
    res.status(201).json({ ...mission.toObject(), dispatched });
});

// Complete or abort a mission
router.patch('/:id', async (req, res) => {
    const update = {};
    if (req.body.status !== undefined) update.status = req.body.status;
    if (['completed', 'aborted'].includes(req.body.status)) update.endTime = new Date();

    const mission = await Mission.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
    });
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    req.app.get('io').emit('mission:updated', mission);
    res.json(mission);
});

module.exports = router;