import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useSettings } from "../../context/SettingsContext";
import { formatCurrency } from "../../utils/formatters";
import Toast from "../../components/Toast";
import { useAlerts } from "../../context/AlertContext";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const RANGE_OPTIONS = ["24h", "7d", "30d", "1y"];
const RANGE_TO_DAYS = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "1y": 365,
};
const ALERT_STORAGE_KEY = "priceAlerts";

export default function CoinDetailPage() {
  const { id } = useParams(); // npr. "bitcoin"
  const { chartRange, currency, theme } = useSettings();
  const { evaluatePriceAlerts } = useAlerts();
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(chartRange || "7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartError, setChartError] = useState(null);
  const [alertDirection, setAlertDirection] = useState("above");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertHit, setAlertHit] = useState(null);
  const [toast, setToast] = useState(null);

  const isLight = theme === "light";

  useEffect(() => {
    if (chartRange && RANGE_OPTIONS.includes(chartRange)) {
      setRange(chartRange);
    }
  }, [chartRange]);

  useEffect(() => {
    const saved = localStorage.getItem(ALERT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const existing = parsed[id];
      if (existing) {
        setAlertDirection(existing.direction || "above");
        setAlertThreshold(existing.threshold ?? "");
      }
    } catch (e) {
      console.error("Failed to parse alerts", e);
    }
  }, [id]);

  // osnovni podaci o coinu
  useEffect(() => {
    async function loadCoin() {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
        );
        setCoin(res.data);
      } catch (e) {
        console.error(e);
        setError("Unable to load data for this coin.");
      } finally {
        setLoading(false);
      }
    }

    loadCoin();
  }, [id]);

  useEffect(() => {
    if (!coin) return;
    evaluatePriceAlerts([coin], currency);
  }, [coin, currency, evaluatePriceAlerts]);

  // chart podaci direktno sa CoinGecko market_chart
  useEffect(() => {
    async function loadChart() {
      try {
        setChartLoading(true);
        setChartError(null);

        const days = RANGE_TO_DAYS[range];

        // Free CoinGecko → automatic interval (best available)
        const res = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
        );

        const points = res.data.prices.map(([ts, price]) => {
          const d = new Date(ts);

          let label;
          if (range === "24h") {
            label = d.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else {
            label = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
            });
          }

          return { time: label, price };
        });

        setChartData(points);
      } catch (e) {
        console.error(e);
        setChartData([]);
        setChartError("Unable to load the chart for this coin right now.");
      } finally {
        setChartLoading(false);
      }
    }

    loadChart();
  }, [id, range]);

  const stats = useMemo(() => {
    if (!coin?.market_data) return [];
    const md = coin.market_data;
    return [
      {
        label: "Market Cap",
        value: formatCurrency(md.market_cap.usd, currency),
        tone: isLight ? "text-emerald-600" : "text-emerald-300",
      },
      {
        label: "24h Change",
        value: `${md.price_change_percentage_24h.toFixed(2)}%`,
        tone:
          md.price_change_percentage_24h > 0
            ? isLight
              ? "text-emerald-600"
              : "text-emerald-300"
            : md.price_change_percentage_24h < 0
            ? isLight
              ? "text-rose-600"
              : "text-rose-300"
            : isLight
            ? "text-slate-700"
            : "text-slate-200",
      },
      {
        label: "Circulating Supply",
        value: `${md.circulating_supply.toLocaleString()} ${coin.symbol.toUpperCase()}`,
        tone: isLight ? "text-slate-700" : "text-slate-100",
      },
      {
        label: "24h Volume",
        value: formatCurrency(md.total_volume.usd, currency),
        tone: isLight ? "text-sky-700" : "text-sky-200",
      },
    ];
  }, [coin, currency, isLight]);

  function saveAlert() {
    const thresholdValue = Number(alertThreshold);
    if (!thresholdValue) {
      setToast({ message: "Enter a valid price threshold.", variant: "warning" });
      return;
    }

    const existing = localStorage.getItem(ALERT_STORAGE_KEY);
    let parsed = {};
    if (existing) {
      try {
        parsed = JSON.parse(existing);
      } catch (e) {
        parsed = {};
      }
    }

    parsed[id] = { direction: alertDirection, threshold: thresholdValue };
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(parsed));
    setToast({ message: "Alert preference saved.", variant: "success" });
  }

  useEffect(() => {
    const currentUsd = coin?.market_data?.current_price?.usd;
    const thresholdValue = Number(alertThreshold);
    if (!currentUsd || !thresholdValue) {
      setAlertHit(null);
      return;
    }

    const conditionMet =
      alertDirection === "above" ? currentUsd >= thresholdValue : currentUsd <= thresholdValue;

    if (conditionMet) {
      setAlertHit(
        `${coin?.name || ""} price crossed ${formatCurrency(thresholdValue, currency)} (${alertDirection})`
      );
    } else {
      setAlertHit(null);
    }
  }, [alertDirection, alertThreshold, coin, currency]);

  return (
    <div className={`space-y-6 ${isLight ? "text-slate-900" : "text-white"}`}>
      <Link
        to="/"
        className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
          isLight ? "text-cyan-700 hover:text-cyan-900" : "text-cyan-200 hover:text-white"
        }`}
      >
        <span className="text-lg">←</span> Back to market
      </Link>

      {loading && <p className="mt-4 text-slate-400">Loading coin data...</p>}
      {error && <p className="mt-4 text-rose-500">{error}</p>}

      {coin && (
        <div
          className={`glass-panel border p-6 ${
            isLight
              ? "border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-100"
              : "border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/70"
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-2xl p-3 shadow-inner ${
                  isLight ? "bg-white border border-slate-200" : "bg-white/10 shadow-black/30"
                }`}
              >
                <img src={coin.image?.large} alt={coin.name} className="h-12 w-12 rounded-full" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {coin.symbol}
                </p>
                <h1 className="text-3xl font-bold">{coin.name}</h1>
                {coin.market_data && (
                  <p className={`text-xl font-semibold ${isLight ? "text-emerald-600" : "text-emerald-300"}`}>
                    {formatCurrency(coin.market_data.current_price.usd, currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span
                className={`rounded-full border px-3 py-1 ${
                  isLight
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                Verified market data
              </span>
              <span className={`rounded-full border px-3 py-1 ${isLight ? "border-slate-200 bg-white" : "border-white/15 bg-white/5 text-slate-200"}`}>
                Spot pairs
              </span>
              <span
                className={`rounded-full border px-3 py-1 ${
                  isLight
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-blue-400/40 bg-blue-500/10 text-blue-200"
                }`}
              >
                On-chain
              </span>
            </div>
          </div>

          {coin.market_data && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border p-4 shadow-inner ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                      : "border-white/10 bg-white/5 text-white shadow-black/30"
                  }`}
                >
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{stat.label}</p>
                  <p className={`mt-2 text-xl font-semibold ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          <div
            className={`mt-6 flex flex-col gap-4 rounded-2xl border p-4 ${
              isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Price alerts</h2>
                <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Save a threshold and we will flag when the live price crosses it.
                </p>
              </div>
              {alertHit && (
                <div
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    isLight
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-amber-400/40 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  {alertHit}
                </div>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span className={isLight ? "text-slate-700" : "text-slate-200"}>Direction</span>
                <select
                  value={alertDirection}
                  onChange={(e) => setAlertDirection(e.target.value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-900"
                      : "border-white/10 bg-slate-900/70 text-white"
                  }`}
                >
                  <option value="above" className="text-slate-900">
                    Alert when price goes above
                  </option>
                  <option value="below" className="text-slate-900">
                    Alert when price goes below
                  </option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
                <span className={isLight ? "text-slate-700" : "text-slate-200"}>Price threshold (USD)</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-sm ${
                      isLight
                        ? "border-slate-200 bg-white text-slate-900"
                        : "border-white/10 bg-slate-900/70 text-white"
                    }`}
                    placeholder="e.g. 65000"
                  />
                  <button
                    onClick={saveAlert}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30"
                  >
                    Save alert
                  </button>
                </div>
              </label>
            </div>
          </div>

          {/* range toggle + chart */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-semibold">Price action</h2>
            <div
              className={`flex items-center gap-2 rounded-full border p-1 text-xs font-semibold ${
                isLight
                  ? "border-slate-200 bg-white text-slate-800 shadow-slate-200/40"
                  : "border-white/10 bg-slate-900/70 text-slate-200 shadow-black/30"
              }`}
            >
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                className={`rounded-full px-4 py-2 transition ${
                  range === r
                    ? isLight
                      ? "bg-cyan-100 text-cyan-900 shadow-sm shadow-cyan-300/50"
                      : "bg-white text-slate-900 shadow-sm shadow-cyan-500/30"
                    : isLight
                    ? "text-slate-600 hover:text-cyan-800"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                {r.toUpperCase()}
              </button>
              ))}
            </div>
          </div>

          {chartLoading && <p className="text-slate-400">Loading chart data...</p>}
          {chartError && <p className="text-rose-400">{chartError}</p>}

          {chartData.length > 0 ? (
            <div
              className={`mt-4 h-72 w-full overflow-hidden rounded-2xl border p-2 ${
                isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-950/70"
              }`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#1f2937"} />
                  <XAxis
                    dataKey="time"
                    hide={chartData.length > 40}
                    stroke={isLight ? "#0f172a" : "#94a3b8"}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke={isLight ? "#0f172a" : "#94a3b8"}
                    tickFormatter={(v) => v.toFixed(0)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: isLight ? "white" : "#0f172a",
                      border: isLight ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.1)",
                      color: isLight ? "#0f172a" : "#e2e8f0",
                    }}
                    labelStyle={{ color: isLight ? "#0f172a" : "#e2e8f0" }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} fill="url(#priceGradient)" />
                  <Line type="monotone" dataKey="price" dot={false} strokeWidth={1.5} stroke="#67e8f9" strokeLinecap="round" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            !chartLoading && !chartError && <p className="text-slate-400">No chart data available.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            {["overview", "markets", "on-chain"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full border px-3 py-2 capitalize transition ${
                  activeTab === tab
                    ? isLight
                      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                      : "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                    : isLight
                    ? "border-slate-200 bg-white text-slate-700"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            className={`mt-3 rounded-2xl border p-4 text-sm ${
              isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            {activeTab === "overview" && (
              <p>
                Overview keeps quick market and supply notes aligned with the stat cards above.
              </p>
            )}
            {activeTab === "markets" && <p>Markets tab can show order books or exchange listings.</p>}
            {activeTab === "on-chain" && <p>On-chain tab is reserved for network metrics and flows.</p>}
          </div>

          <p className={`mt-4 text-xs ${isLight ? "text-slate-500" : "text-slate-500"}`}>
            Data source: CoinGecko API
          </p>
        </div>
      )}

      <Toast open={!!toast} message={toast?.message} variant={toast?.variant || "info"} onClose={() => setToast(null)} />
    </div>
  );
}
