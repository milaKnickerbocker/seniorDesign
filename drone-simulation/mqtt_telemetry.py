
import asyncio
import json
import math
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "home/drone/telemetry"
DRONE_ID = "drone-01"
PUBLISH_INTERVAL = 0.5  # 2 Hz


async def collect_stream(stream, data, name):
    """Continuously store the newest MAVSDK reading."""
    async for value in stream:
        data[name] = value


async def publish_telemetry(drone, stop_event):
    """Publish live PX4 telemetry to the FireWatch MQTT topic."""

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )

    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()

    data = {}

    collectors = [
        asyncio.create_task(
            collect_stream(drone.telemetry.position(), data, "position")
        ),
        asyncio.create_task(
            collect_stream(drone.telemetry.battery(), data, "battery")
        ),
        asyncio.create_task(
            collect_stream(drone.telemetry.heading(), data, "heading")
        ),
        asyncio.create_task(
            collect_stream(drone.telemetry.velocity_ned(), data, "velocity")
        ),
        asyncio.create_task(
            collect_stream(drone.telemetry.in_air(), data, "in_air")
        ),
    ]

    required = {
        "position", "battery", "heading", "velocity", "in_air"
    }

    try:
        print("[FIREWATCH MQTT] Waiting for telemetry...")

        # Allow time for initial sensor readings.
        for _ in range(100):
            if required.issubset(data):
                break
            await asyncio.sleep(0.1)
        else:
            raise RuntimeError("Required telemetry was not received")

        print("[FIREWATCH MQTT] Publishing live telemetry at 2 Hz")

        while not stop_event.is_set():
            position = data["position"]
            battery = data["battery"]
            heading = data["heading"]
            velocity = data["velocity"]

            ground_speed = math.hypot(
                velocity.north_m_s,
                velocity.east_m_s
            )

            message = {
                "droneId": DRONE_ID,
                "timestamp": datetime.now(timezone.utc)
                    .isoformat(timespec="milliseconds")
                    .replace("+00:00", "Z"),
                "lat": position.latitude_deg,
                "lon": position.longitude_deg,
                "altitude": round(position.relative_altitude_m, 2),
                "heading": round(heading.heading_deg, 2),
                "groundSpeed": round(ground_speed, 2),
                "battery": round(battery.remaining_percent),
                "status": (
                    "active" if data["in_air"] else "idle"
                ),
            }

            # Reject incomplete or invalid numeric telemetry.
            numeric_fields = (
                "lat", "lon", "altitude", "heading",
                "groundSpeed", "battery"
            )

            if not all(
                math.isfinite(message[field])
                for field in numeric_fields
            ):
                print("[FIREWATCH MQTT] Invalid reading, skipping")
                await asyncio.sleep(PUBLISH_INTERVAL)
                continue

            payload = json.dumps(message, allow_nan=False)

            result = client.publish(
                MQTT_TOPIC,
                payload,
                qos=1
            )

            if result.rc != mqtt.MQTT_ERR_SUCCESS:
                print("[FIREWATCH MQTT] Publish failed:", result.rc)
            else:
                print("[FIREWATCH MQTT]", payload)

            await asyncio.sleep(PUBLISH_INTERVAL)

    finally:
        for task in collectors:
            task.cancel()

        await asyncio.gather(
            *collectors, return_exceptions=True
        )

        client.disconnect()
        client.loop_stop()

        print("[FIREWATCH MQTT] Publisher stopped")
