import React, { useEffect, useState } from "react";

export default function App() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:4001";
    fetch(`${apiBase}/api/plans`)
      .then(res => {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then(data => setPlans(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div style={{padding:20}}>Error cargando datos: {error}</div>;
  if (!plans) return <div style={{padding:20}}>Cargando planes…</div>;

  return (
    <div style={{padding:20}}>
      <h1>Planes</h1>
      <ul>
        {Array.isArray(plans) ? plans.map(p => <li key={p.id || p.name}>{p.name || JSON.stringify(p)}</li>)
          : <li>{JSON.stringify(plans)}</li>}
      </ul>
    </div>
  );
}
