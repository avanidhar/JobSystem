import { useEffect, useState } from "react";

import { JobsList } from "./components/JobsList";

import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function App() {
  const [apiStatus, setApiStatus] = useState<string>("checking...");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health/`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status ?? "unknown"))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>JobSystem</h1>
        <span className="app__api-status">API: {apiStatus}</span>
      </header>
      <JobsList />
    </div>
  );
}

export default App;
