
import FireWatchMap from "./components/FireWatchMap";
import "./App.css";

function App() {
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
                        <h2 className="panel-title">Mission Specs.</h2>

                        <div className="mission-progress">
                            <label>Mission Progress</label>
                            <div className="progress-track">
                                <div className="progress-fill"></div>
                            </div>
                        </div>

                        <div className="elapsed-time">
                            <label>Elapsed Time</label>
                            <span>--:--:--</span>
                        </div>

                        <div className="mission-buttons">
                            <button>View Plan</button>
                            <button>Edit Plan</button>
                            <button className="abort-button">
                                Abort Mission
                            </button>
                        </div>
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
                    <FireWatchMap />
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
