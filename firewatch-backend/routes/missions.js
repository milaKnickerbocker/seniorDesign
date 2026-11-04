const express = require('express');
const Mission = require('../models/Mission');

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
    const mission = await Mission.create(req.body);
    req.app.get('io').emit('mission:updated', mission);
    res.status(201).json(mission);
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