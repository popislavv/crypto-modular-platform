import { useState, useEffect } from "react";
import { ethers, formatUnits } from "ethers";
import axios from "axios";


export default function WalletPage() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]);

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const walletAddress = accounts[0];
      setAddress(walletAddress);

      // GET BALANCE FROM BACKEND
      const res = await axios.get(`http://localhost:3100/wallet/${walletAddress}`);
      setBalance(res.data.balance);
      await loadTokens(walletAddress);
    } else {
      alert("MetaMask nije pronađen.");
    }
  }

  async function loadTokens(addr) {
    const res = await axios.get(`http://localhost:3100/wallet/${addr}/tokens`);
    setTokens(res.data.tokenBalances);

  }

  async function fetchTokenMetadata(contract) {
    const res = await axios.get(`http://localhost:3100/token/${contract}/metadata`);
    return res.data;
  }


  function TokenDisplay({ token }) {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    async function load() {
      const m = await fetchTokenMetadata(token.contractAddress);
      setMeta(m);
    }
    load();
  }, [token.contractAddress]);

  if (!meta) return <div>Loading...</div>;

  const humanBalance = formatUnits(token.tokenBalance, meta.decimals);

  return (
    <div className="p-3 border bg-gray-800 text-white rounded">
      <p>{meta.name} ({meta.symbol})</p>
      <p>Balance: {humanBalance}</p>
    </div>
  );
  }

  return (
    <div>
      <h1>Wallet</h1>

      {address ? (
        <>
          <p>Wallet: {address}</p>
          <p>Balance: {balance} ETH</p>
        </>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask</button>
      )}

      {tokens.length === 0 && <p>No tokens found.</p>}


      {tokens.map((t) => (
        <div key={t.contractAddress} className="p-3 border bg-gray-800 text-white rounded">
          <TokenDisplay token={t} />
        </div>
      ))}

    </div>
  );
}
