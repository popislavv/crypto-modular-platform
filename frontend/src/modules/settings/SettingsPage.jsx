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

    localStorage.setItem("refreshInterval", interval);
    alert("Saved!");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <label className="block mb-4">
        Auto-refresh interval (seconds):
        <input
          type="number"
          value={interval}
          onChange={(e) => setIntervalValue(e.target.value)}
          className="border p-2 bg-gray-200 text-black"
        />
      </label>

      <button
        onClick={save}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Save
      </button>
    </div>
  );
}
