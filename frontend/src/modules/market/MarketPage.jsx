import { useEffect, useState } from "react";
import axios from "axios";

export default function MarketPage() {
  const [coins, setCoins] = useState([]);

  async function loadData() {
    const res = await axios.get("http://localhost:3100/market");
    setCoins(res.data);
  }

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("refreshInterval");
    let refreshSec = saved ? Number(saved) : 60;

    if (refreshSec < 30) refreshSec = 30; // zaštita od rate limita

    const interval = setInterval(() => {
      loadData();
    }, refreshSec * 1000);

    return () => clearInterval(interval);
  }, []);

  const [error, setError] = useState(null);

async function loadData() {
  try {
    setError(null);
    const res = await axios.get("http://localhost:3100/market");
    setCoins(res.data);
  } catch (e) {
    console.error(e);
    setCoins([]);
    setError("Market data error. Try again in a bit.");
  }
}




  return (
  <div className="page text-white">
    <h1 className="text-3xl font-bold mb-6">Market</h1>

        {error && <p className="text-red-400 mb-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coins.map((coin) => (
          <div key={coin.id} className="p-4 border border-gray-700 rounded-lg bg-gray-800 text-white">
            <h2 className="text-lg font-semibold">{coin.name}</h2>
            <p>Price: ${coin.current_price}</p>
            <p>24h: {coin.price_change_percentage_24h}%</p>
          </div>
        ))}
      </div>
      
    </div>
  );
}
