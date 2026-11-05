import FireWatchMap from "./components/FireWatchMap";
import { useState } from "react";
import "./App.css";

function App() {

    const [missionState, setMissionState] = useState("idle");
    const [hasValidBoundary, setHasValidBoundary] = useState(false);
    const [clearBoundary, setClearBoundary] = useState(null);

    return (
        <div className="app">

            {/* Top Header */}
            <header className="header">
                <div className="brand">
                    <span className="brand-icon">🔥</span>
                    <h1>FireWatch</h1>
                </div>

                <div className="mission-title">
                    Mission #2
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

                                {hasValidBoundary && (
                                    <div className="mission-buttons">
                                        <button className="launch-button">
                                            Launch Drone(s)
                                        </button>
                                    </div>
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
                        onRegisterClearBoundary={setClearBoundary}
                    />
                </section>

                {/* Right Sidebar */}
                <aside className="sidebar right-sidebar">

                    <section className="panel alerts-panel">
                        <h2 className="panel-title alerts-title">
                            Past Alerts
                        </h2>

                        <div className="empty-state">
                            No alerts recorded.
                        </div>
                    </section>

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
