import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [interval, setIntervalValue] = useState(60);

  useEffect(() => {
    const saved = localStorage.getItem("refreshInterval");
    if (saved) setIntervalValue(Number(saved));
  }, []);

  function save() {
    if (interval < 30) {
      alert("Minimum refresh interval je 30 sekundi (CoinGecko limit).");
      return;
    }

    localStorage.setItem("refreshInterval", String(interval));
    alert("Saved!");
  }

  return (
    <div className="page">
      <div className="glass-panel border-white/10 bg-white/5 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Settings</h1>
        <p className="mb-6 text-sm text-slate-300">
          Podešavanja sinhronizacije tržišnih i wallet podataka.
        </p>

        <label className="block space-y-2 text-sm font-medium text-slate-200">
          <span>Auto-refresh interval (seconds)</span>
          <input
            type="number"
            min={0}
            value={interval}
            onChange={(e) => setIntervalValue(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white shadow-inner shadow-black/30 outline-none transition focus:border-cyan-400/70"
          />
          <span className="text-xs text-slate-400">
            Minimum 30s zbog CoinGecko limita. Čuvamo vrednost kao broj kako bi poređenja bila tačna.
          </span>
        </label>

        <button
          onClick={save}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
