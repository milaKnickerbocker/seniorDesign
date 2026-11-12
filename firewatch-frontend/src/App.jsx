import FireWatchMap from "./components/FireWatchMap";
import AlertsPanel from "./components/AlertsPanel";
import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {

    const [missionState, setMissionState] = useState("idle");
    const [hasValidBoundary, setHasValidBoundary] = useState(false);
    const [clearBoundary, setClearBoundary] = useState(null);
    const [boundary, setBoundary] = useState(null);      // the drawn polygon (GeoJSON feature)
    const [droneCount, setDroneCount] = useState(1);
    const [mission, setMission] = useState(null);        // the launched mission from the backend
    const [launching, setLaunching] = useState(false);
    const [launchError, setLaunchError] = useState("");

    async function launchMission() {
        if (!boundary) return;
        setLaunchError("");
        setLaunching(true);

        // GeoJSON points are [lng, lat] and the ring repeats its first point at the end
        const ring = boundary.geometry.coordinates[0].slice(0, -1);
        const points = ring.map(([lng, lat]) => ({ lat, lon: lng }));

        try {
            const res = await fetch(`${API_URL}/api/missions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boundary: points, droneCount: Number(droneCount) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            setMission(data);
            setMissionState("active");
        } catch (err) {
            setLaunchError(err.message);
        } finally {
            setLaunching(false);
        }
    }

    async function abortMission() {
        try {
            const res = await fetch(`${API_URL}/api/missions/${mission._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "aborted" }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            clearBoundary?.();
            setMission(null);
            setMissionState("idle");
        } catch (err) {
            setLaunchError(err.message);
        }
    }

    return (
        <div className="app">

            {/* Top Header */}
            <header className="header">
                <div className="brand">
                    <span className="brand-icon">🔥</span>
                    <h1>FireWatch</h1>
                </div>

                <div className="mission-title">
                    Mission #1
                </div>

                <div className="system-status">
                    Systems Online
                    <span className="online-indicator"></span>
                </div>
            </header>

            {/* Main Dashboard */}
            <main className="dashboard">

                {/* Left Sidebar */}
                <aside className="sidebar left-sidebar">

                    <section className="panel mission-panel">
                        <h2 className="panel-title">Mission Controls</h2>

                        {missionState === "idle" && (
                            <>
                                <div className="mission-description">
                                    <p>
                                        Set up a patrol mission and launch your drone.
                                    </p>
                                </div>

                                <div className="mission-status">
                                    <label>Mission Status</label>
                                    <span>Not Started</span>
                                </div>

                                <div className="mission-buttons">
                                    <button
                                        className="create-mission-button"
                                        onClick={() => setMissionState("setup")}
                                    >
                                        + Create Mission
                                    </button>
                                </div>
                            </>
                        )}

                        {missionState === "setup" && (
                            <>
                                <div className="mission-description">
                                    <p>
                                        Draw a patrol boundary on the map
                                        to define the mission area.
                                    </p>
                                </div>

                                <div className="mission-status">
                                    <label>Mission Status</label>
                                    <span>
                                        {hasValidBoundary ? "Ready to Launch" : "Setting Up"}
                                    </span>
                                </div>

                                <div className="mission-instructions">
                                    <p>Mission Setup</p>
                                    <ul>
                                        <li>Use the polygon tool on the map.</li>
                                        <li>Draw your desired patrol area.</li>
                                        <li>Boundary must have at least 3 points.</li>
                                    </ul>
                                </div>

                                <div className="mission-status">
                                    <label htmlFor="drone-count">Number of Drones</label>
                                    <input
                                        id="drone-count"
                                        className="drone-count-input"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={droneCount}
                                        onChange={(e) => setDroneCount(e.target.value)}
                                    />
                                </div>

                                {hasValidBoundary && (
                                    <div className="mission-buttons">
                                        <button
                                            className="launch-button"
                                            onClick={launchMission}
                                            disabled={launching}
                                        >
                                            {launching ? "Launching..." : "Launch Drone(s)"}
                                        </button>
                                    </div>
                                )}

                                {launchError && (
                                    <p className="launch-error" role="alert">{launchError}</p>
                                )}

                                <div className="mission-buttons">
                                    <button
                                        onClick={() => {
                                            clearBoundary?.();
                                            setMissionState("idle");
                                        }}
                                    >
                                        Cancel Setup
                                    </button>
                                </div>
                            </>
                        )}
                        {missionState === "active" && mission && (
                            <>
                                <div className="mission-description">
                                    <p>Mission launched. Each drone is patrolling its assigned zone.</p>
                                </div>

                                <div className="mission-status">
                                    <label>Mission Status</label>
                                    <span>Active</span>
                                </div>

                                <div className="mission-instructions">
                                    <p>Mission {mission._id.slice(-6)}</p>
                                    <ul>
                                        <li>{mission.droneCount} drone(s) assigned</li>
                                        <li>
                                            {mission.dispatched} of {mission.droneCount} received their zone
                                        </li>
                                    </ul>
                                </div>

                                {launchError && (
                                    <p className="launch-error" role="alert">{launchError}</p>
                                )}

                                <div className="mission-buttons">
                                    <button onClick={abortMission}>Abort Mission</button>
                                </div>
                            </>
                        )}
                    </section>

                    <section className="panel drones-panel">
                        <h2 className="panel-title">Drones</h2>

                        <div className="drone-list">
                            <div className="drone-item">
                                <span className="drone-marker blue"></span>
                                Drone 1
                                <span className="drone-label">Active</span>
                            </div>
                        </div>
                    </section>

                </aside>

                {/* Center Map */}
                <section className="map-section">
                    <FireWatchMap
                        onBoundaryValidityChange={setHasValidBoundary}
                        onBoundaryChange={setBoundary}
                        onRegisterClearBoundary={setClearBoundary}
                        drawingEnabled={missionState === "setup"}
                    />
                </section>
                

                {/* Right Sidebar */}
                <aside className="sidebar right-sidebar">

                    <AlertsPanel />

                    <section className="panel logs-panel">
                        <h2 className="panel-title">Logs</h2>

                        <div className="empty-state">
                            No system events.
                        </div>
                    </section>

                </aside>

            </main>
        </div>
    );
}

export default App;
