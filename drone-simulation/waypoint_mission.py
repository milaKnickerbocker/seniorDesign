
import asyncio

from mavsdk_grpc import System
from mavsdk_grpc.mission import MissionItem, MissionPlan

from mqtt_telemetry import publish_telemetry


# --------------------------------------------------
# FIREWATCH CONFIGURATION
# --------------------------------------------------

# Waypoint coordinates near the default PX4 SITL location.
WAYPOINTS = [
    (47.39803986, 8.54557254),
    (47.39803622, 8.54501464),
    (47.39782562, 8.54500928),
]

ALTITUDE = 10.0  # Meters above takeoff
SPEED = 5.0      # Meters per second


# --------------------------------------------------
# MAIN WAYPOINT MISSION
# --------------------------------------------------

async def run():

    print("[FIREWATCH] Starting waypoint mission...")

    # Connect to simulated drone
    drone = System()

    print("[FIREWATCH] Connecting to PX4 SITL...")

    await drone.connect(
        system_address="udpin://0.0.0.0:14540"
    )

    # Wait for connection
    async for state in drone.core.connection_state():
        if state.is_connected:
            print("[FIREWATCH] Drone connected!")
            break

    # Wait for GPS readiness
    print("[FIREWATCH] Waiting for GPS readiness...")

    async for health in drone.telemetry.health():
        if (
            health.is_global_position_ok
            and health.is_home_position_ok
        ):
            print("[FIREWATCH] GPS position ready!")
            break

    # --------------------------------------------------
    # CREATE WAYPOINT MISSION
    # --------------------------------------------------

    mission_items = []

    for lat, lon in WAYPOINTS:

        mission_item = MissionItem(
            latitude_deg=lat,
            longitude_deg=lon,
            relative_altitude_m=ALTITUDE,
            speed_m_s=SPEED,
            is_fly_through=True,
            gimbal_pitch_deg=float("nan"),
            gimbal_yaw_deg=float("nan"),
            camera_action=MissionItem.CameraAction.NONE,
            loiter_time_s=float("nan"),
            camera_photo_interval_s=float("nan"),
            acceptance_radius_m=float("nan"),
            yaw_deg=float("nan"),
            camera_photo_distance_m=float("nan"),
            vehicle_action=MissionItem.VehicleAction.NONE,
        )

        mission_items.append(mission_item)

    mission_plan = MissionPlan(mission_items)

    # Upload mission to PX4
    print("[FIREWATCH] Uploading waypoint mission...")

    await drone.mission.set_return_to_launch_after_mission(
        True
    )

    await drone.mission.upload_mission(mission_plan)

    print("[FIREWATCH] Mission uploaded successfully!")

    # --------------------------------------------------
    # START MQTT TELEMETRY
    # --------------------------------------------------

    print("[FIREWATCH] Initializing MQTT telemetry...")

    stop_telemetry = asyncio.Event()

    telemetry_task = asyncio.create_task(
        publish_telemetry(drone, stop_telemetry)
    )

    try:

        # Give telemetry streams time to initialize.
        await asyncio.sleep(2)

        # Check for MQTT startup failures.
        if telemetry_task.done():
            await telemetry_task
            raise RuntimeError(
                "MQTT telemetry stopped unexpectedly"
            )

        print("[FIREWATCH] MQTT telemetry task started!")

        # --------------------------------------------------
        # ARM AND START MISSION
        # --------------------------------------------------

        print("[FIREWATCH] Arming drone...")

        await drone.action.arm()

        print("[FIREWATCH] Starting waypoint navigation...")

        await drone.mission.start_mission()

        # --------------------------------------------------
        # MONITOR WAYPOINT PROGRESS
        # --------------------------------------------------

        async for progress in drone.mission.mission_progress():

            print(
                "[FIREWATCH] Waypoint progress: "
                f"{progress.current}/{progress.total}"
            )

            if progress.current == progress.total:

                print(
                    "[FIREWATCH] All waypoints completed!"
                )

                print(
                    "[FIREWATCH] Returning to launch..."
                )

                break

        # --------------------------------------------------
        # WAIT FOR LANDING
        # --------------------------------------------------

        print("[FIREWATCH] Waiting for drone to land...")

        # The mission was already started, so wait until
        # the drone reports that it is no longer airborne.
        async for in_air in drone.telemetry.in_air():

            if not in_air:

                print("[FIREWATCH] Drone landed!")
                break

        # Allow one final post-landing telemetry reading.
        await asyncio.sleep(1)

        print("[FIREWATCH] Mission complete!")

    finally:

        # --------------------------------------------------
        # CLEAN UP MQTT TELEMETRY
        # --------------------------------------------------

        print("[FIREWATCH] Stopping MQTT telemetry...")

        stop_telemetry.set()

        try:
            await asyncio.wait_for(
                telemetry_task,
                timeout=5
            )
        except asyncio.TimeoutError:
            telemetry_task.cancel()
            await asyncio.gather(
                telemetry_task,
                return_exceptions=True
            )
        except Exception as error:
            print(
                "[FIREWATCH] MQTT telemetry error:",
                error
            )

        print("[FIREWATCH] Telemetry cleanup complete.")


# --------------------------------------------------
# PROGRAM ENTRY POINT
# --------------------------------------------------

if __name__ == "__main__":

    try:
        asyncio.run(run())

    except KeyboardInterrupt:
        print("\n[FIREWATCH] Mission interrupted by user.")

    except Exception as error:
        print(f"[FIREWATCH] Error: {error}")
        raise

