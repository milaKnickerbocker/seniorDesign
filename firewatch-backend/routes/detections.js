const express = require('express');
const Detection = require('../models/Detection');

const router = express.Router();

// Optional filters: ?missionId=...&decision=pending
router.get('/', async (req, res) => {
    const filter = {};
    if (req.query.missionId) filter.missionId = req.query.missionId;
    if (req.query.decision) filter.decision = req.query.decision;
    res.json(await Detection.find(filter).sort({ timestamp: -1 }).limit(200));
});

// Record the operator's decision
router.patch('/:id', async (req, res) => {
    const update = {};
    if (req.body.decision !== undefined) {
        update.decision = req.body.decision;
        update.decidedAt = new Date();
    }
    if (req.body.recheckRequested !== undefined) {
        update.recheckRequested = req.body.recheckRequested;
    }

    const detection = await Detection.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
    });
    if (!detection) return res.status(404).json({ error: 'Detection not found' });
    res.json(detection);
});

module.exports = router;