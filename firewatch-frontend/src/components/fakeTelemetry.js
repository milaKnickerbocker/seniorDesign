
const route = [
    { longitude: -81.3792, latitude: 28.5383 },
    { longitude: -81.3500, latitude: 28.5500 },
    { longitude: -81.3200, latitude: 28.5300 },
    { longitude: -81.3400, latitude: 28.5000 },
    { longitude: -81.3700, latitude: 28.5100 },
    { longitude: -81.3792, latitude: 28.5383 },
];

export function startFakeTelemetry(onTelemetry) {
    let index = 0;

    function sendTelemetry() {
        const position = route[index];

        onTelemetry({
            droneId: "drone-1",
            longitude: position.longitude,
            latitude: position.latitude,
            batteryPercent: 100 - (index % 40),
            activity: "Flying",
            timestamp: Date.now(),
        });

        index = (index + 1) % route.length;
    }

    // Send the initial position immediately.
    sendTelemetry();

    // Simulate the drone moving once per second.
    const intervalId = setInterval(sendTelemetry, 1000);

    // Return a cleanup function.
    return () => clearInterval(intervalId);
}
