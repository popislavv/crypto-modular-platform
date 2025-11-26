import { useEffect, useMemo, useState } from "react";
import { ethers, formatUnits } from "ethers";
import axios from "axios";
import Card from "../../components/Card";
import { useSettings } from "../../context/SettingsContext";
import { formatCurrency } from "../../utils/formatters";
import { useTranslation } from "react-i18next";

const LAST_WALLET_KEY = "lastWalletAddress";
const metadataCache = new Map();

export default function WalletPage() {
  const { currency, theme } = useSettings();
  const { t } = useTranslation();
  const [address, setAddress] = useState(null); // aktivna adresa
  const [inputAddress, setInputAddress] = useState(""); // ono što piše u inputu
  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const isLight = theme === "light";

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
        setWalletError(t("wallet.errors.balance"));
      }

      if (tokensRes.status === "fulfilled") {
        setTokens(tokensRes.value);
      } else {
        setTokens([]);
        setWalletError(t("wallet.errors.tokens"));
      }

      if (txRes.status === "fulfilled") {
        setTxs(txRes.value);
      } else {
        setTxs([]);
        setWalletError(t("wallet.errors.transactions"));
      }
    } catch (err) {
      console.error(err);
      setBalance(null);
      setTokens([]);
      setTxs([]);
      setWalletError(t("wallet.errors.unexpected"));
    } finally {
      setLoading(false);
    }
  }

  // MetaMask connect → koristi isti mehanizam
  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert(t("wallet.errors.metamask"));
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

  function TokenDisplay({ token, isLight }) {
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
          if (active) setMetaError(t("wallet.metadataError"));
        }
      }

      load();
      return () => {
        active = false;
      };
    }, [t, token.contractAddress]);

    if (metaError) {
      return (
        <div className={`text-sm ${isLight ? "text-rose-600" : "text-rose-300"}`}>{t("wallet.metadataError")}</div>
      );
    }

    if (!meta)
      return <div className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t("common.loading")}</div>;

    const humanBalance = formatUnits(token.tokenBalance, meta.decimals);

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold uppercase ${
              isLight ? "bg-slate-100 text-cyan-700" : "bg-white/5 text-cyan-200"
            }`}
          >
            {meta.symbol?.slice(0, 3) || "TKN"}
          </div>
          <div>
            <p className="font-semibold">
              {meta.name} ({meta.symbol})
            </p>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {token.contractAddress.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{Number(humanBalance).toFixed(4)}</p>
          <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t("wallet.tokenBalance")}</p>
        </div>
      </div>
    );
  }

  const tokenShare = useMemo(() => {
    const total = tokens.reduce((sum, t) => sum + Number(t.tokenBalance || 0), 0);
    return { total };
  }, [tokens]);

  return (
    <div className={`space-y-6 ${isLight ? "text-slate-900" : "text-white"}`}>
      <div
        className={`glass-panel border px-6 py-5 ${
          isLight
            ? "border-slate-200/80 bg-gradient-to-r from-white via-white to-slate-100"
            : "border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/70 to-slate-950"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${isLight ? "text-cyan-700" : "text-cyan-200/70"}`}>
              {t("wallet.heroTag")}
            </p>
            <h1 className="text-3xl font-bold">{t("wallet.heroTitle")}</h1>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {t("wallet.heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <button
              onClick={connectWallet}
              className={`rounded-full border px-4 py-2 ${
                isLight
                  ? "border-orange-200 bg-orange-50 text-orange-700 shadow"
                  : "border-orange-400/50 bg-orange-500/15 text-orange-100 shadow-inner shadow-black/30"
              }`}
            >
              {t("wallet.connect")}
            </button>
            <button
              onClick={handleConfirmAddress}
              className={`rounded-full border px-4 py-2 ${
                isLight ? "border-slate-200 bg-white text-slate-800" : "border-white/10 bg-white/10 text-slate-100"
              }`}
            >
              {t("wallet.confirm")}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className={`flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 shadow-inner ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                : "border-white/10 bg-slate-900/70 text-white shadow-black/30"
            }`}
          >
            <input
              type="text"
              placeholder={t("wallet.inputPlaceholder")}
              className={`w-full bg-transparent text-sm placeholder:text-slate-500 focus:outline-none ${
                isLight ? "text-slate-900" : "text-white"
              }`}
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
            {t("wallet.loadData")}
          </button>
        </div>

          {walletError && (
            <p className={`mt-2 text-sm ${isLight ? "text-rose-600" : "text-rose-300"}`}>{walletError}</p>
          )}

        {address && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card variant="glass">
              <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {t("wallet.activeAddress")}
              </p>
              <p className="mt-1 break-all text-lg font-semibold">{address}</p>
              {balance !== null && (
                <>
                  <p className={`mt-3 text-2xl font-bold ${isLight ? "text-emerald-600" : "text-emerald-300"}`}>
                    {balance} ETH
                  </p>
                  <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {t("wallet.balanceFiat", { value: formatCurrency(balance, currency) })}
                  </p>
                </>
              )}
              <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{t("wallet.autoSave")}</p>
            </Card>
            <Card variant="glass" className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  {t("wallet.syncStatus")}
                </p>
                <p className="mt-1 text-lg font-semibold">{loading ? t("wallet.status.refreshing") : t("wallet.status.live")}</p>
                <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  {t("wallet.syncCopy")}
                </p>
              </div>
              <div
                className={`h-16 w-16 rounded-full border ${
                  isLight ? "border-cyan-200 bg-cyan-50" : "border-cyan-400/40 bg-cyan-500/10"
                }`}
              />
            </Card>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("wallet.tokensTitle")}</h2>
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                isLight
                  ? "border-slate-200 bg-white text-slate-700"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {t("wallet.tokensBadge")}
            </span>
          </div>
          {tokens.length === 0 && (
            <p className={`mt-3 text-sm italic ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t("wallet.tokensEmpty")}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {tokens.map((t) => (
              <Card
                key={t.contractAddress}
                variant="outlined"
                className={isLight ? "border-slate-200 bg-white" : "border-white/5 bg-slate-950/50"}
              >
                <TokenDisplay token={t} isLight={isLight} />
                <div className={`mt-3 h-2 rounded-full ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
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
        <h2 className="text-xl font-semibold">{t("wallet.portfolioTitle")}</h2>
        <p className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {t("wallet.portfolioCopy")}
        </p>
          <div className="mt-4 space-y-3">
            {tokens.slice(0, 5).map((t) => (
              <div
                key={t.contractAddress}
                className={`rounded-xl border p-3 ${
                  isLight ? "border-slate-200 bg-white" : "border-white/5 bg-white/5"
                }`}
              >
                <div className={`flex items-center justify-between text-sm ${isLight ? "text-slate-800" : "text-white"}`}>
                  <span className="font-semibold">{t.symbol || t.contractAddress.slice(0, 4)}</span>
                  <span className={isLight ? "text-slate-600" : "text-slate-300"}>
                    {tokenShare.total > 0
                      ? `${((Number(t.tokenBalance || 0) / tokenShare.total) * 100).toFixed(2)}%`
                      : "-"}
                  </span>
                </div>
                <div className={`mt-2 h-2 rounded-full ${isLight ? "bg-slate-200" : "bg-slate-900"}`}>
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

            {tokens.length === 0 && <p className="text-sm text-slate-400">{t("wallet.portfolioEmpty")}</p>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("wallet.transactionsTitle")}</h2>
            <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>{t("wallet.transactionsCopy")}</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <span
              className={`rounded-full border px-3 py-1 ${
                isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              {t("wallet.filters.all")}
            </span>
            <span
              className={`rounded-full border px-3 py-1 ${
                isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              {t("wallet.filters.received")}
            </span>
            <span
              className={`rounded-full border px-3 py-1 ${
                isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              {t("wallet.filters.sent")}
            </span>
          </div>
        </div>

        {txs.length === 0 && (
          <p className={`mt-3 text-sm italic ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {t("wallet.transactionsEmpty")}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {Array.isArray(txs) &&
            txs.map((tx) => (
              <div
                key={tx.hash}
                className={`rounded-2xl border p-3 shadow-inner ${
                  isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-950/60"
                }`}
              >
                <p className="text-sm font-semibold">{tx.hash.slice(0, 12)}...</p>
                <p className={isLight ? "text-xs text-slate-500" : "text-xs text-slate-400"}>{t("wallet.block")} {tx.blockNumber}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      isLight
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-emerald-500/10 text-emerald-200"
                    }`}
                  >
                    {tx.txreceipt_status === "1" ? t("wallet.statuses.confirmed") : t("wallet.statuses.pending")}
                  </span>
                  <span className="font-semibold">{tx.value / 1e18} ETH</span>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
