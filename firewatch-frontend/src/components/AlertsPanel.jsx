import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./AlertsPanel.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function formatTime(iso) {
    return new Date(iso).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    });
}

function AlertsPanel() {
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        const socket = io(API_URL);

        async function load() {
            try {
                const res = await fetch(`${API_URL}/api/detections`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setAlerts(await res.json());
                setError(false);
            } catch {
                setError(true);
            }
        }

        socket.on("connect", load);
        socket.on("connect_error", () => setError(true));
        socket.on("detection:new", (d) => {
            setAlerts((prev) =>
                prev.some((a) => a._id === d._id) ? prev : [d, ...prev]
            );
        });

        return () => socket.close();
    }, []);

    return (
        <section className="panel alerts-panel">
            <h2 className="panel-title alerts-title">Past Alerts</h2>

            {error && <div className="empty-state">Can't reach the backend.</div>}
            {!error && alerts.length === 0 && (
                <div className="empty-state">No alerts recorded.</div>
            )}

            <ul className="alert-list">
                {alerts.map((a) => (
                    <li key={a._id} className={`alert-item ${a.detectionType}`}>
                        <div className="alert-thumb">
                            {a.snapshotUrl ? (
                                <img
                                    src={a.snapshotUrl.startsWith("http")
                                        ? a.snapshotUrl
                                        : API_URL + a.snapshotUrl}
                                    alt={`${a.detectionType} detection`}
                                />
                            ) : (
                                <span>No image</span>
                            )}
                        </div>

                        <div className="alert-info">
                            <div className="alert-type">
                                {a.detectionType === "fire" ? "Fire" : "Smoke"} detected
                            </div>
                            <div className="alert-meta">
                                Confidence {Math.round(a.confidence * 100)}%
                            </div>
                            <div className="alert-meta">{formatTime(a.timestamp)}</div>
                            <div className="alert-meta">{a.droneId}</div>
                        </div>

                        <span className="alert-badge">{a.decision}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default AlertsPanel;