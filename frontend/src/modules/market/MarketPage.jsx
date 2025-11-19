import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MarketPage() {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("top10"); // "top10" | "all"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("http://localhost:3100/market");
      setCoins(res.data);
    } catch (e) {
      console.error(e);
      setError("Trenutno nije moguće učitati podatke o tržištu. Pokušaj kasnije.");
      setCoins([]);
      setFilteredCoins([]);
    } finally {
      setLoading(false);
    }
  }

  // prvi load
  useEffect(() => {
    loadData();
  }, []);

  // filtriranje po search + top10/all
  useEffect(() => {
    let list = coins;

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      );
    }

    if (viewMode === "top10") {
      list = list.slice(0, 10);
    }

    setFilteredCoins(list);
  }, [coins, search, viewMode]);

  return (
    <div className="page text-white bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Crypto Market Overview</h1>

      {error && <p className="text-red-400 mb-2">{error}</p>}
      {loading && <p className="text-gray-400 mb-2">Loading market data...</p>}

      {/* search + toggle */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or symbol..."
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("top10")}
            className={
              "px-3 py-2 rounded text-sm " +
              (viewMode === "top10"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300")
            }
          >
            Top 10
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={
              "px-3 py-2 rounded text-sm " +
              (viewMode === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300")
            }
          >
            All
          </button>
        </div>
      </div>

      {/* tabela / lista */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-3 py-2 text-left w-10">#</th>
              <th className="px-3 py-2 text-left w-56">Name</th>
              <th className="px-3 py-2 text-right w-32">Price</th>
              <th className="px-3 py-2 text-right w-24">24h %</th>
              <th className="px-3 py-2 text-right w-40">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoins.map((coin, idx) => {
              const change24h = coin.price_change_percentage_24h;
              const changeColor =
                change24h > 0
                  ? "text-green-400"
                  : change24h < 0
                  ? "text-red-400"
                  : "text-gray-300";

              return (
                <tr
                  key={coin.id}
                  className="border-b border-gray-800 bg-gray-950 hover:bg-gray-900 cursor-pointer"
                  onClick={() => navigate(`/coin/${coin.id}`)}
                >
                  <td className="px-3 py-2">
                    {coin.market_cap_rank ?? idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <div>
                        <div className="font-semibold">{coin.name}</div>
                        <div className="text-xs text-gray-400">
                          {coin.symbol.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    ${coin.current_price.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right ${changeColor}`}>
                    {change24h?.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    ${coin.market_cap?.toLocaleString()}
                  </td>
                </tr>
              );
            })}

            {filteredCoins.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-4 text-center text-gray-400" colSpan={5}>
                  No coins to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
