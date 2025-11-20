import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import Card from "../../components/Card";
import Toast from "../../components/Toast";

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
  const [toast, setToast] = useState(null);
  const isLight = theme === "light";

  function save() {
    if (interval < 30) {
      setToast({ message: "Minimum refresh interval is 30 seconds (CoinGecko limit).", variant: "warning" });
      return;
    }

    setRefreshInterval(interval);
    setChartRange(range);
    setCurrency(selectedCurrency);
    setTheme(selectedTheme);
    setToast({ message: "Settings saved successfully.", variant: "success" });
  }

  useEffect(() => {
    setIntervalValue(refreshInterval);
  }, [refreshInterval]);

  useEffect(() => {
    setRange(chartRange);
  }, [chartRange]);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const fieldBase = `w-full rounded-lg border p-3 text-sm shadow-inner transition focus:border-cyan-400/70 ${
    isLight
      ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/50"
      : "border-white/10 bg-white/5 text-white shadow-black/30"
  }`;

  const labelTone = `block space-y-2 text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-200"}`;
  const helperTone = `text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`;

  return (
    <div className="page">
      <Card variant="glass" className="p-6">
        <h1 className="mb-2 text-2xl font-bold">Settings</h1>
        <p className={`mb-6 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          Configure market refresh, chart defaults, currency, and theme.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <label className={labelTone}>
            <span>Auto-refresh interval (seconds)</span>
            <input
              type="number"
              min={0}
              value={interval}
              onChange={(e) => setIntervalValue(Number(e.target.value) || 0)}
              className={fieldBase}
            />
            <span className={helperTone}>
              Minimum 30s due to CoinGecko rate limits. Stored as a number for correct comparisons.
            </span>
          </label>

          <label className={labelTone}>
            <span>Default chart range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className={fieldBase}
            >
              {["24h", "7d", "30d", "1y"].map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className={helperTone}>Set the starting horizon for all coin charts.</span>
          </label>

          <label className={labelTone}>
            <span>Default currency</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className={fieldBase}
            >
              {["USD", "EUR", "BAM"].map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className={helperTone}>Choose a display currency across market, coin, and wallet views.</span>
          </label>

          <label className={labelTone}>
            <span>Theme</span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={fieldBase}
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
            <span className={helperTone}>Instantly swap the shell, cards, and inputs into light mode.</span>
          </label>
        </div>

        <button
          onClick={save}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5"
        >
          Save preferences
        </button>
      </Card>

      <Toast open={!!toast} message={toast?.message} variant={toast?.variant || "info"} onClose={() => setToast(null)} />
    </div>
  );
}
