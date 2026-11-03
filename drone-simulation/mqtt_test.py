
import json
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "home/drone/telemetry"

client = mqtt.Client(
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2
)

client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()

try:
    for i in range(10):
        telemetry = {
            "droneId": "drone-01",
            "timestamp": datetime.now(timezone.utc)
                .isoformat(timespec="milliseconds")
                .replace("+00:00", "Z"),
            "lat": 47.397971,
            "lon": 8.546164,
            "altitude": 10.0,
            "heading": 270.0,
            "groundSpeed": 5.0,
            "battery": 100,
            "status": "active"
        }

        payload = json.dumps(telemetry)

        result = client.publish(
            MQTT_TOPIC,
            payload,
            qos=1
        )

        result.wait_for_publish()

        print(f"[FIREWATCH MQTT] Published {i + 1}/10")
        print(payload)

        time.sleep(0.5)

finally:
    client.disconnect()
    client.loop_stop()
