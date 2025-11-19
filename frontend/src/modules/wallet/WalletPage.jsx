import { useState, useEffect } from "react";
import { ethers, formatUnits } from "ethers";
import axios from "axios";
import Card from "../../components/Card";

const LAST_WALLET_KEY = "lastWalletAddress";

export default function WalletPage() {
  const [address, setAddress] = useState(null);        // aktivna adresa
  const [inputAddress, setInputAddress] = useState(""); // ono što piše u inputu
  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [txs, setTxs] = useState([]);

  // ⬇️ Minimalno: na mount samo vratimo zadnju adresu u input (NE pucamo odmah API pozive)
  useEffect(() => {
    const saved = localStorage.getItem(LAST_WALLET_KEY);
    if (saved) {
      setAddress(saved);
      setInputAddress(saved);
    }
  }, []);

  // GET balance
  async function loadBalance(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}`);
    setBalance(res.data.balance);
  }

  // GET tokens (ograničimo na npr. 20 da ne ubijemo UI kod velikih walleta)
  async function loadTokens(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}/tokens`);
    const list = res.data.tokenBalances || [];
    setTokens(list.slice(0, 20)); // max 20 tokena za brzinu
  }

  // GET txs
  async function loadTransactions(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}/tx`);
    const arr = Array.isArray(res.data) ? res.data : [];
    setTxs(arr);
  }

  // Učitaj sve za neku adresu (ali samo kad ti to zatražiš)
  async function loadAll(addr) {
    if (!addr) return;
    setAddress(addr);
    localStorage.setItem(LAST_WALLET_KEY, addr);

    await Promise.all([
      loadBalance(addr),
      loadTokens(addr),
      loadTransactions(addr),
    ]);
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

  // Token metadata helper
  async function fetchTokenMetadata(contract) {
    const res = await axios.get(
      `http://localhost:3100/token/${contract}/metadata`
    );
    return res.data;
  }

  function TokenDisplay({ token }) {
    const [meta, setMeta] = useState(null);

    useEffect(() => {
      let active = true;
      async function load() {
        try {
          const m = await fetchTokenMetadata(token.contractAddress);
          if (active) setMeta(m);
        } catch (err) {
          console.error("meta error", err);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [token.contractAddress]);

    if (!meta) return <div>Loading...</div>;

    const humanBalance = formatUnits(token.tokenBalance, meta.decimals);

    return (
      <div>
        <p className="font-semibold">
          {meta.name} ({meta.symbol})
        </p>
        <p>Balance: {humanBalance}</p>
      </div>
    );
  }

  return (
    <div className="page text-white">
      <h1 className="text-3xl font-bold mb-6">Wallet</h1>

      {/* INPUT + CONFIRM */}
      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Paste any wallet address"
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirmAddress();
          }}
        />
        <button
          onClick={handleConfirmAddress}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
        >
          Confirm
        </button>
      </div>

      {/* METAMASK DUGME */}
      {!address && (
        <button
          onClick={connectWallet}
          className="mb-4 px-4 py-2 bg-orange-500 hover:bg-orange-400 rounded text-white"
        >
          Connect MetaMask
        </button>
      )}

      {address && (
        <div className="mb-4">
          <p className="text-sm text-gray-400">Active address:</p>
          <p className="break-all">{address}</p>
          {balance !== null && <p className="mt-1">Balance: {balance} ETH</p>}
        </div>
      )}

      {/* TOKENS */}
      <h2 className="mt-4 text-xl font-bold">Tokens</h2>
      {tokens.length === 0 && (
        <p className="mt-2 text-gray-400 italic">
          No tokens detected for this address.
        </p>
      )}

      <div className="mt-2 grid gap-2">
        {tokens.map((t) => (
          <Card key={t.contractAddress}>
            <TokenDisplay token={t} />
          </Card>
        ))}
      </div>

      {/* TRANSACTIONS */}
      <h2 className="mt-6 text-xl font-bold">Transactions</h2>

      {txs.length === 0 && (
        <p className="mt-2 text-gray-400 italic">
          No transactions found for this address.
        </p>
      )}

      {Array.isArray(txs) &&
        txs.map((tx) => (
          <div
            key={tx.hash}
            className="p-3 border bg-gray-800 text-white rounded my-2"
          >
            <p>Hash: {tx.hash.slice(0, 12)}...</p>
            <p>Value: {tx.value / 1e18} ETH</p>
          </div>
        ))}
    </div>
  );
}
