import { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

export default function WalletPage() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const walletAddress = accounts[0];
      setAddress(walletAddress);

      // GET BALANCE FROM BACKEND
      const res = await axios.get(`http://localhost:3100/wallet/${walletAddress}`);
      setBalance(res.data.balance);
    } else {
      alert("MetaMask nije pronađen.");
    }
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
    </div>
  );
}
