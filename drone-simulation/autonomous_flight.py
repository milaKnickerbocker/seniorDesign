
import asyncio
import time
from datetime import datetime
from pathlib import Path

from mavsdk_grpc import System


# Mission configuration
TARGET_ALTITUDE = 10.0
ALTITUDE_TOLERANCE = 0.5
HOVER_SECONDS = 10
CONNECT_TIMEOUT = 30
READY_TIMEOUT = 60
TAKEOFF_TIMEOUT = 60
LANDING_TIMEOUT = 90
DISARM_TIMEOUT = 30


def log(message):
    """Print and save mission information."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line, flush=True)

    with open("flight_log.txt", "a") as file:
        file.write(line + "\n")


async def wait_for_connection(drone):
    async for state in drone.core.connection_state():
        if state.is_connected:
            return


async def wait_for_health(drone):
    async for health in drone.telemetry.health():
        if (
            health.is_global_position_ok
            and health.is_home_position_ok
        ):
            return


async def wait_for_altitude(drone):
    async for position in drone.telemetry.position():
        if position.relative_altitude_m >= (
            TARGET_ALTITUDE - ALTITUDE_TOLERANCE
        ):
            return position.relative_altitude_m


async def wait_for_landing(drone):
    # Only call after confirmed takeoff.
    async for in_air in drone.telemetry.in_air():
        if not in_air:
            return


async def wait_for_disarm(drone):
    async for armed in drone.telemetry.armed():
        if not armed:
            return


async def collect_position(drone, data):
    async for position in drone.telemetry.position():
        data["position"] = position


async def collect_battery(drone, data):
    async for battery in drone.telemetry.battery():
        data["battery"] = battery


async def print_telemetry(data):
    while True:
        position = data.get("position")
        battery = data.get("battery")

        if position is not None:
            message = (
                f"POSITION | "
                f"Lat: {position.latitude_deg:.6f} | "
                f"Lon: {position.longitude_deg:.6f} | "
                f"Altitude: "
                f"{position.relative_altitude_m:.2f} m"
            )

            if battery is not None:
                message += (
                    f" | Battery: "
                    f"{battery.remaining_percent:.1f}%"
                )

            log(message)

        await asyncio.sleep(1)


async def main():
    Path("flight_log.txt").write_text("")

    log("FIREWATCH AUTONOMOUS FLIGHT TEST")
    log("Connecting to PX4 SITL...")

    drone = System()
    await drone.connect(
        system_address="udpin://0.0.0.0:14540"
    )

    await asyncio.wait_for(
        wait_for_connection(drone),
        timeout=CONNECT_TIMEOUT
    )

    log("Connected to PX4!")

    telemetry_data = {}
    tasks = [
        asyncio.create_task(
            collect_position(drone, telemetry_data)
        ),
        asyncio.create_task(
            collect_battery(drone, telemetry_data)
        ),
        asyncio.create_task(
            print_telemetry(telemetry_data)
        ),
    ]

    arm_succeeded = False
    landing_complete = False

    try:
        log("Waiting for valid position and home...")
        await asyncio.wait_for(
            wait_for_health(drone),
            timeout=READY_TIMEOUT
        )
        log("Position and home checks passed.")

        log("Setting takeoff altitude to 10 m...")
        await drone.action.set_takeoff_altitude(
            TARGET_ALTITUDE
        )

        log("Arming...")
        await drone.action.arm()
        arm_succeeded = True
        log("Arm command successful.")

        log("Taking off...")
        await drone.action.takeoff()

        altitude = await asyncio.wait_for(
            wait_for_altitude(drone),
            timeout=TAKEOFF_TIMEOUT
        )
        log(f"Target altitude reached: {altitude:.2f} m")

        log("Hovering for 10 seconds...")
        start = time.monotonic()

        await asyncio.sleep(HOVER_SECONDS)

        elapsed = time.monotonic() - start
        log(f"Hover period complete: {elapsed:.1f} s")

        log("Landing...")
        await drone.action.land()

        await asyncio.wait_for(
            wait_for_landing(drone),
            timeout=LANDING_TIMEOUT
        )
        landing_complete = True
        log("Landing confirmed.")

        log("Waiting for automatic disarm...")
        await asyncio.wait_for(
            wait_for_disarm(drone),
            timeout=DISARM_TIMEOUT
        )

        log("Drone disarmed.")
        log("MISSION COMPLETE: SUCCESS")

    except Exception as error:
        log(f"MISSION ERROR: {error}")

        if arm_succeeded and not landing_complete:
            log("Attempting recovery landing...")
            try:
                await asyncio.wait_for(
                    drone.action.land(), timeout=10
                )
                log("Recovery land command sent.")
            except Exception as landing_error:
                log(
                    f"Recovery land command failed: "
                    f"{landing_error}"
                )

        raise

    finally:
        for task in tasks:
            task.cancel()

        await asyncio.gather(
            *tasks, return_exceptions=True
        )

        log("Telemetry monitoring stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as error:
        print(f"Flight test ended with error: {error}")
