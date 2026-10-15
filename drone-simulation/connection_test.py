
import asyncio
from mavsdk_grpc import System


async def main():
    drone = System()

    print("Connecting to PX4 SITL...")
    await drone.connect(
        system_address="udpin://0.0.0.0:14540"
    )

    print("Waiting for connection...")

    async def wait_for_connection():
        async for state in drone.core.connection_state():
            if state.is_connected:
                return

    await asyncio.wait_for(
        wait_for_connection(), timeout=30
    )

    print("Connected to PX4 successfully!")

    async def get_position():
        async for position in drone.telemetry.position():
            return position

    async def get_battery():
        async for battery in drone.telemetry.battery():
            return battery

    for i in range(10):
        position, battery = await asyncio.wait_for(
            asyncio.gather(
                get_position(),
                get_battery()
            ),
            timeout=10
        )

        print(f"\nTelemetry reading {i + 1}/10")
        print(
            f"Latitude: {position.latitude_deg:.6f}"
        )
        print(
            f"Longitude: {position.longitude_deg:.6f}"
        )
        print(
            f"Relative Altitude: "
            f"{position.relative_altitude_m:.2f} m"
        )
        print(
            f"Battery: "
            f"{battery.remaining_percent:.1f}%"
        )

        await asyncio.sleep(1)

    print("\nConnection test completed!")


if __name__ == "__main__":
    asyncio.run(main())
