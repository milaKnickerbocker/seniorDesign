const mqtt = require('mqtt');
const topics = require('./topics');
const Telemetry = require('../models/Telemetry');
const Detection = require('../models/Detection');

// Returns the parsed JSON, or null if the payload isn't valid JSON
function parseJson(payload) {
  try {
    return JSON.parse(payload.toString());
  } catch {
    return null;
  }
}

async function handleTelemetry(data) {
  const doc = await Telemetry.create(data);
  console.log(`[mqtt] telemetry saved: ${doc.droneId} @ ${doc.timestamp.toISOString()}`);
}

async function handleDetection(data) {
  try {
    const doc = await Detection.create(data);
    console.log(`[mqtt] detection saved: ${doc._id} (${doc.detectionType}, confidence ${doc.confidence})`);
  } catch (err) {
    if (err.code === 11000) {
      console.log('[mqtt] duplicate detection ignored');
      return;
    }
    throw err;
  }
}

const handlers = {
  [topics.TELEMETRY]: handleTelemetry,
  [topics.DETECTION]: handleDetection,
};

function startMqtt() {
  const client = mqtt.connect(process.env.MQTT_URL || 'mqtt://localhost:1883');

  client.on('connect', () => {
    console.log('[mqtt] connected to broker');
    // QoS 0 for frequent telemetry, QoS 1 for detections
    client.subscribe(topics.TELEMETRY, { qos: 0 });
    client.subscribe(topics.DETECTION, { qos: 1 });
  });

  client.on('message', async (topic, payload) => {
    const handler = handlers[topic];
    if (!handler) return;

    const data = parseJson(payload);
    if (!data) {
      console.warn(`[mqtt] ignored non-JSON message on ${topic}`);
      return;
    }

    try {
      await handler(data);
    } catch (err) {
      // Bad data from one drone should never crash the server
      console.warn(`[mqtt] rejected message on ${topic}: ${err.message}`);
    }
  });

  client.on('error', (err) => console.error('[mqtt] error:', err.message));
  client.on('reconnect', () => console.log('[mqtt] reconnecting...'));

  return client;
}

module.exports = startMqtt;