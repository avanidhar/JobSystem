import { useEffect, useState } from "react";

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
      <h1>JobSystem</h1>
      <p>Backend API status: {apiStatus}</p>
    </div>
  );
}

export default App;
