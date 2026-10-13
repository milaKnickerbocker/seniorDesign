import FireWatchMap from "./components/FireWatchMap";
import "./App.css";

function App() {
    return (
        <div className="app">
            <header className="header">
                <h1>FireWatch</h1>
                <span>Ground Station Dashboard</span>
            </header>

            <main className="dashboard">
                <FireWatchMap />
            </main>
        </div>
    );
}

export default App;