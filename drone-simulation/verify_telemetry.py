
import json
import math
import re
import time
from datetime import datetime

import paho.mqtt.client as mqtt


# FireWatch MQTT configuration
BROKER = "localhost"
PORT = 1883
TOPIC = "home/drone/telemetry"

# Test configuration
REQUIRED_MESSAGES = 20
TIMEOUT_SECONDS = 40

REQUIRED_FIELDS = {
    "droneId",
    "timestamp",
    "lat",
    "lon",
    "altitude",
    "heading",
    "groundSpeed",
    "battery",
    "status",
}

messages = []
errors = []


def valid_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def validate_message(data):
    problems = []

    missing = REQUIRED_FIELDS - data.keys()

    if missing:
        problems.append(f"Missing fields: {sorted(missing)}")

    if not isinstance(data.get("droneId"), str) or not data.get("droneId"):
        problems.append("Invalid droneId")

    timestamp = data.get("timestamp")

    if not isinstance(timestamp, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T"
        r"\d{2}:\d{2}:\d{2}"
        r"(?:\.\d+)?Z",
        timestamp,
    ):
        problems.append("Invalid UTC timestamp")
    else:
        try:
            datetime.fromisoformat(
                timestamp.replace("Z", "+00:00")
            )
        except ValueError:
            problems.append("Invalid timestamp date")

    for field in (
        "lat", "lon", "altitude",
        "heading", "groundSpeed", "battery"
    ):
        if not valid_number(data.get(field)):
            problems.append(f"Invalid numeric field: {field}")

    for field, low, high in (
        ("lat", -90, 90),
        ("lon", -180, 180),
        ("heading", 0, 360),
        ("battery", 0, 100),
    ):
        value = data.get(field)
        if valid_number(value) and not low <= value <= high:
            problems.append(f"{field} outside valid range")

    speed = data.get("groundSpeed")

    if valid_number(speed) and speed < 0:
        problems.append("Negative ground speed")

    if not isinstance(data.get("status"), str) or not data.get("status"):
        problems.append("Invalid status")

    if data.get("battery") is not None and type(data["battery"]) is not int:
        problems.append("Battery must be an integer percentage")

    return problems


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("[VERIFY] Connected to MQTT broker")
        client.subscribe(TOPIC, qos=1)
    else:
        errors.append(f"MQTT connection failed: {reason_code}")


def on_message(client, userdata, msg):
    received_at = time.monotonic()

    try:
        data = json.loads(msg.payload.decode("utf-8"))

        if not isinstance(data, dict):
            raise ValueError("Payload must be a JSON object")

        problems = validate_message(data)

        for problem in problems:
            errors.append(problem)

        messages.append(received_at)

        count = len(messages)
        print(
            f"[VERIFY] Message {count}/{REQUIRED_MESSAGES}: "
            f"{'PASS' if not problems else 'FAIL'}"
        )

    except (ValueError, UnicodeDecodeError) as error:
        errors.append(str(error))
        print(f"[VERIFY] Invalid message: {error}")


def main():
    print("=" * 45)
    print("FIREWATCH MQTT TELEMETRY VERIFICATION")
    print("=" * 45)

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2
    )

    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER, PORT, 60)
    client.loop_start()

    try:
        deadline = time.monotonic() + TIMEOUT_SECONDS

        while (
            len(messages) < REQUIRED_MESSAGES
            and time.monotonic() < deadline
        ):
            time.sleep(0.1)

    finally:
        client.disconnect()
        client.loop_stop()

    print("\n" + "=" * 45)
    print("VERIFICATION RESULTS")
    print("=" * 45)

    print(f"Messages received: {len(messages)}")

    enough_messages = len(messages) >= REQUIRED_MESSAGES
    valid_format = enough_messages and not errors

    if len(messages) >= 2:
        intervals = [
            b - a for a, b in zip(messages, messages[1:])
        ]

        average_interval = sum(intervals) / len(intervals)
        frequency = 1 / average_interval

        print(f"Average interval: {average_interval:.3f} s")
        print(f"Measured frequency: {frequency:.2f} Hz")

        # Allow a small margin for WSL scheduling jitter.
        rate_ok = 0.95 <= frequency <= 2.05

    else:
        rate_ok = False
        print("Not enough messages to calculate frequency")

    print(
        "JSON contract: ",
        "PASS" if valid_format else "FAIL"
    )
    print(
        "Publishing rate: ",
        "PASS" if rate_ok else "FAIL"
    )

    if errors:
        print("\nErrors:")
        for error in sorted(set(errors)):
            print("-", error)

    overall = valid_format and rate_ok

    print("\nOVERALL RESULT:", "PASS" if overall else "FAIL")

    if not overall:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
