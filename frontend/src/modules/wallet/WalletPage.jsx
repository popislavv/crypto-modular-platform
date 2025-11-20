import { useEffect, useMemo, useState } from "react";
import { ethers, formatUnits } from "ethers";
import axios from "axios";
import Card from "../../components/Card";
import { useSettings } from "../../context/SettingsContext";
import { formatCurrency } from "../../utils/formatters";

const LAST_WALLET_KEY = "lastWalletAddress";
const metadataCache = new Map();

export default function WalletPage() {
  const { currency } = useSettings();
  const [address, setAddress] = useState(null); // aktivna adresa
  const [inputAddress, setInputAddress] = useState(""); // ono što piše u inputu
  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // ⬇️ Minimalno: na mount samo vratimo zadnju adresu u input (NE pucamo odmah API pozive)
  useEffect(() => {
    const saved = localStorage.getItem(LAST_WALLET_KEY);
    if (saved) {
      setAddress(saved);
      setInputAddress(saved);
    }
  }, []);

  async function loadBalanceValue(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}`);
    return res.data.balance;
  }

  async function loadTokensList(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}/tokens`);
    const list = res.data.tokenBalances || [];
    return list.slice(0, 20);
  }

  async function loadTransactionsList(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}/tx`);
    return Array.isArray(res.data) ? res.data : [];
  }

  // Učitaj sve za neku adresu (ali samo kad ti to zatražiš)
  async function loadAll(addr) {
    if (!addr) return;
    setAddress(addr);
    localStorage.setItem(LAST_WALLET_KEY, addr);
    setWalletError(null);
    setLoading(true);

    try {
      const [balanceRes, tokensRes, txRes] = await Promise.allSettled([
        loadBalanceValue(addr),
        loadTokensList(addr),
        loadTransactionsList(addr),
      ]);

      if (balanceRes.status === "fulfilled") {
        setBalance(balanceRes.value);
      } else {
        setBalance(null);
        setWalletError("Nismo mogli da učitamo balans. Pokušaj ponovo.");
      }

      if (tokensRes.status === "fulfilled") {
        setTokens(tokensRes.value);
      } else {
        setTokens([]);
        setWalletError("Tokeni nisu mogli da se učitaju.");
      }

      if (txRes.status === "fulfilled") {
        setTxs(txRes.value);
      } else {
        setTxs([]);
        setWalletError("Transakcije nisu dostupne u ovom trenutku.");
      }
    } catch (err) {
      console.error(err);
      setBalance(null);
      setTokens([]);
      setTxs([]);
      setWalletError("Neočekivana greška prilikom učitavanja walleta.");
    } finally {
      setLoading(false);
    }
  }

  // MetaMask connect → koristi isti mehanizam
  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask nije pronađen.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const walletAddress = accounts[0];

    setInputAddress(walletAddress);
    await loadAll(walletAddress);
  }

  // Ručni klik na Confirm
  async function handleConfirmAddress() {
    const cleaned = inputAddress.trim();
    if (!cleaned) return;
    await loadAll(cleaned);
  }

  // Token metadata helper with caching
  async function fetchTokenMetadata(contract) {
    if (metadataCache.has(contract)) {
      return metadataCache.get(contract);
    }

    const res = await axios.get(`http://localhost:3100/token/${contract}/metadata`);
    metadataCache.set(contract, res.data);
    return res.data;
  }

  function TokenDisplay({ token }) {
    const [meta, setMeta] = useState(null);
    const [metaError, setMetaError] = useState(null);

    useEffect(() => {
      let active = true;

      async function load() {
        try {
          const cached = metadataCache.get(token.contractAddress);
          if (cached) {
            setMeta(cached);
            return;
          }
          const m = await fetchTokenMetadata(token.contractAddress);
          if (active) setMeta(m);
        } catch (err) {
          console.error("meta error", err);
          if (active) setMetaError("Metadata unavailable");
        }
      }

      load();
      return () => {
        active = false;
      };
    }, [token.contractAddress]);

    if (metaError) {
      return <div className="text-sm text-rose-300">{metaError}</div>;
    }

    if (!meta) return <div className="text-sm text-slate-400">Loading...</div>;

    const humanBalance = formatUnits(token.tokenBalance, meta.decimals);

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-sm font-semibold uppercase text-cyan-200">
            {meta.symbol?.slice(0, 3) || "TKN"}
          </div>
          <div>
            <p className="font-semibold text-white">
              {meta.name} ({meta.symbol})
            </p>
            <p className="text-xs text-slate-400">{token.contractAddress.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{Number(humanBalance).toFixed(4)}</p>
          <p className="text-xs text-slate-400">token balance</p>
        </div>
      </div>
    );
  }

  const tokenShare = useMemo(() => {
    const total = tokens.reduce((sum, t) => sum + Number(t.tokenBalance || 0), 0);
    return { total };
  }, [tokens]);

  return (
    <div className="space-y-6 text-white">
      <div className="glass-panel border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/70 to-slate-950 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Wallet dashboard</p>
            <h1 className="text-3xl font-bold">Multi-chain vault</h1>
            <p className="mt-1 text-sm text-slate-300">Brze akcije i KPIs u dvokolonskom rasporedu.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <button
              onClick={connectWallet}
              className="rounded-full border border-orange-400/50 bg-orange-500/15 px-4 py-2 text-orange-100 shadow-inner shadow-black/30"
            >
              Connect MetaMask
            </button>
            <button
              onClick={handleConfirmAddress}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-slate-100"
            >
              Confirm address
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-inner shadow-black/30">
            <input
              type="text"
              placeholder="Paste any wallet address"
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAddress();
              }}
            />
          </div>
          <button
            onClick={handleConfirmAddress}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30"
          >
            Load data
          </button>
        </div>

        {walletError && <p className="mt-2 text-sm text-rose-300">{walletError}</p>}

        {address && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card variant="glass">
              <p className="text-xs uppercase tracking-wide text-slate-400">Active address</p>
              <p className="mt-1 break-all text-lg font-semibold">{address}</p>
              {balance !== null && (
                <>
                  <p className="mt-3 text-2xl font-bold text-emerald-300">{balance} ETH</p>
                  <p className="text-xs text-slate-400">≈ {formatCurrency(balance, currency)} (display currency)</p>
                </>
              )}
              <p className="mt-1 text-xs text-slate-400">Auto-saves last address</p>
            </Card>
            <Card variant="glass" className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Sync status</p>
                <p className="mt-1 text-lg font-semibold text-white">{loading ? "Refreshing..." : "Live"}</p>
                <p className="text-xs text-slate-400">Parallel fetching with graceful fallbacks.</p>
              </div>
              <div className="h-16 w-16 rounded-full border border-cyan-400/40 bg-cyan-500/10" />
            </Card>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tokens</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Top 20</span>
          </div>
          {tokens.length === 0 && (
            <p className="mt-3 text-sm text-slate-400 italic">No tokens detected for this address.</p>
          )}

          <div className="mt-4 space-y-3">
            {tokens.map((t) => (
              <Card key={t.contractAddress} variant="outlined" className="border-white/5 bg-slate-950/50">
                <TokenDisplay token={t} />
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
                    style={{
                      width:
                        tokenShare.total > 0
                          ? `${Math.min(
                              100,
                              (Number(t.tokenBalance || 0) / tokenShare.total) * 100
                            ).toFixed(2)}%`
                          : "8%",
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Portfolio mix</h2>
          <p className="mt-2 text-sm text-slate-400">
            Brz pregled udela tokena u ukupnom balansu. Prikazano proporcionalno preko progress barova.
          </p>
          <div className="mt-4 space-y-3">
            {tokens.slice(0, 5).map((t) => (
              <div key={t.contractAddress} className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{t.symbol || t.contractAddress.slice(0, 4)}</span>
                  <span className="text-slate-300">
                    {tokenShare.total > 0
                      ? `${((Number(t.tokenBalance || 0) / tokenShare.total) * 100).toFixed(2)}%`
                      : "-"}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    style={{
                      width:
                        tokenShare.total > 0
                          ? `${((Number(t.tokenBalance || 0) / tokenShare.total) * 100).toFixed(2)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}

            {tokens.length === 0 && <p className="text-sm text-slate-400">Add an address to see composition.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Transactions</h2>
            <p className="text-sm text-slate-400">Latest activity with quick tags.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">All</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">Received</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">Sent</span>
          </div>
        </div>

        {txs.length === 0 && (
          <p className="mt-3 text-sm text-slate-400 italic">No transactions found for this address.</p>
        )}

        <div className="mt-4 space-y-3">
          {Array.isArray(txs) &&
            txs.map((tx) => (
              <div
                key={tx.hash}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-inner shadow-black/30"
              >
                <p className="text-sm font-semibold text-white">{tx.hash.slice(0, 12)}...</p>
                <p className="text-xs text-slate-400">Block: {tx.blockNumber}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">{tx.txreceipt_status === "1" ? "Confirmed" : "Pending"}</span>
                  <span className="font-semibold text-white">{tx.value / 1e18} ETH</span>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
