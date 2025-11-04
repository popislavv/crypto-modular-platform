import { useState } from "react";
import { ethers } from "ethers";
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
    setTokens(res.data.result.tokenBalances);

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
          <p>Contract: {t.contractAddress}</p>
          <p>Balance (raw): {t.tokenBalance}</p>
        </div>
      ))}

    </div>
  );
}
