const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
    {
        droneId: { type: String, required: true, trim: true },
        missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },

        timestamp: { type: Date, required: true }, // ISO 8601 UTC from drone
        lat: { type: Number, required: true, min: -90, max: 90 },
        lon: { type: Number, required: true, min: -180, max: 180 },
        altitude: { type: Number }, // meters
        heading: { type: Number, min: 0, max: 360 }, // degrees
        groundSpeed: { type: Number, min: 0, max: 100 }, // meters per second
        battery: { type: Number, min: 0, max: 100 }, // percent
        status: { type: String, required: true, trim: true, lowercase: true },
    },
    {
        timestamps: { createdAt: 'recievedAt', updatedAt: false },
        versionKey: false,
    }

);

telemetrySchema.index({ droneId: 1, timestamp: -1 });
telemetrySchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7});

module.exports = mongoose.model('Telemetry', telemetrySchema);