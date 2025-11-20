import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";

export default function SettingsPage() {
  const {
    refreshInterval,
    setRefreshInterval,
    chartRange,
    setChartRange,
    currency,
    setCurrency,
    theme,
    setTheme,
  } = useSettings();
  const [interval, setIntervalValue] = useState(refreshInterval);
  const [range, setRange] = useState(chartRange);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedTheme, setSelectedTheme] = useState(theme);

  function save() {
    if (interval < 30) {
      alert("Minimum refresh interval je 30 sekundi (CoinGecko limit).");
      return;
    }

    setRefreshInterval(interval);
    setChartRange(range);
    setCurrency(selectedCurrency);
    setTheme(selectedTheme);
    alert("Saved!");
  }

  useEffect(() => {
    setIntervalValue(refreshInterval);
  }, [refreshInterval]);

  useEffect(() => {
    setRange(chartRange);
  }, [chartRange]);

  return (
    <div className="page">
      <div className="glass-panel border-white/10 bg-white/5 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Settings</h1>
        <p className="mb-6 text-sm text-slate-300">
          Podešavanja sinhronizacije tržišnih i wallet podataka.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
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

          <label className="block space-y-2 text-sm font-medium text-slate-200">
            <span>Default chart range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white shadow-inner shadow-black/30 outline-none transition focus:border-cyan-400/70"
            >
              {["24h", "7d", "30d", "1y"].map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Set the starting horizon for all coin charts.</span>
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-200">
            <span>Default currency</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white shadow-inner shadow-black/30 outline-none transition focus:border-cyan-400/70"
            >
              {["USD", "EUR", "BAM"].map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Choose a preferred display currency across markets and wallet.</span>
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-200">
            <span>Theme</span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white shadow-inner shadow-black/30 outline-none transition focus:border-cyan-400/70"
            >
              {[
                { key: "dark", label: "Dark" },
                { key: "light", label: "Light" },
              ].map((opt) => (
                <option key={opt.key} value={opt.key} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Light instantly adjusts the shell, cards, and typography.</span>
          </label>
        </div>

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
