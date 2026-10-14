const mongoose = require('mongoose');
const { Schema } = mongoose;

const detectionSchema = new Schema(
    {
        detectionId : { type: String, unique: true, sparse: true },
        droneId: { type: String, required: true, trim: true },
        missionId: { type: Schema.Types.ObjectId, ref: 'Mission' },

        timestamp: { type: Date, required: true },
        lat: { type: Number, required: true, min: -90, max: 90 },
        lon: { type: Number, required: true, min: -180, max: 180 },

        detectionType: { type: String, enum: ['fire', 'smoke'], required: true },
        confidence: { type: Number, required: true, min: 0, max: 1 },
        snapshotUrl: { type: String }, // reference to the image, not the image itself

        // The operator's decision
        decision: {
        type: String,
        enum: ['pending', 'confirmed', 'dismissed'],
        default: 'pending',
        },
        decidedAt: { type: Date },
        recheckRequested: { type: Boolean, default: false },
    },
    { timestamps: true }
);

detectionSchema.index({ missionId: 1, timestamp: -1 });
detectionSchema.index({ decision: 1 });

module.exports = mongoose.model('Detection', detectionSchema);