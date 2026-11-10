const mongoose = require('mongoose');
const { Schema } = mongoose;

const pointSchema = new Schema(
    {
        lat: { type: Number, required: true, min: -90, max: 90},
        lon: { type: Number, required: true, min: -180, max: 180},
    },
    { _id: false }
);

const droneZoneSchema = new Schema(
    {
        droneId: { type: String, required: true, trim: true },
        zone: { type: [pointSchema], default: [] } // drone's patrol zone
    },
    { _id: false } 
);

const missionSchema = new Schema(
    {
        boundary: {
            type: [pointSchema],
            required: true,
            validate: {
                validator: (points) => points.length >= 3,
                message: 'boundary needs at least 3 points',
            },
        },
        droneCount: { type: Number, required: true, min: 1 },
        drones: { type: [droneZoneSchema], defaule: [] },
        status: {
            type: String,
            enum: ['active', 'completed', 'aborted'],
            default: 'active',
        },
        startTime: { type: Date, default: Date.now},
        endTime: {type: Date},
    },
    { timestamps: true }
);

module.exports = mongoose.model('Mission', missionSchema);