import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function startLiveTelemetry(onTelemetry) {
    const socket = io(API_URL);

    socket.on("drone:telemetry", (t) => {
        onTelemetry({
            droneId: t.droneId,
            longitude: t.lon,
            latitude: t.lat,
            batteryPercent: t.battery,
            activity: t.status
                ? t.status.charAt(0).toUpperCase() + t.status.slice(1)
                : "Unknown",
            timestamp: Date.parse(t.timestamp),
        });
    });

    return () => socket.close();
}