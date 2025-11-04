import express from "express";
import axios from "axios";
import "dotenv/config";
import cors from "cors";

const app = express();
const PORT = 3100;

app.use(cors());

// Health check
app.get("/ping", function (req: express.Request, res: express.Response) {
  res.json({ message: "Backend radi ✅" });
});

// Market (CoinGecko)
app.get("/market", async (req: express.Request, res: express.Response) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd"
    );
  res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "market data error" });
  }
});

// ETH balance (Alchemy)
app.get("/wallet/:address", async (req: express.Request, res: express.Response) => {
  const { address } = req.params;
  const ALCHEMY_URL = process.env.ALCHEMY_URL;

  try {
    const response = await axios.post(ALCHEMY_URL!, {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    const balanceHex: string = response.data.result; // e.g. "0x1234..."
    const balanceInWei = parseInt(balanceHex, 16);
    const balanceInEth = balanceInWei / 1e18;

    res.json({ address, balance: balanceInEth });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "wallet data error" });
  }
});

// ERC-20 token balances (Alchemy)
app.get("/wallet/:address/tokens", async (req: express.Request, res: express.Response) => {
  const { address } = req.params;
  const ALCHEMY_URL = process.env.ALCHEMY_URL;

  try {
    const response = await axios.post(ALCHEMY_URL!, {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenBalances",
      params: [address, "erc20"],
    });

    res.json(response.data.result); // { tokenBalances: [...] }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "token data error" });
  }
});

// Token metadata (decimals/symbol/name)
app.get("/token/:contract/metadata", async (req: express.Request, res: express.Response) => {
  const { contract } = req.params;
  const ALCHEMY_URL = process.env.ALCHEMY_URL;

  try {
    const response = await axios.post(ALCHEMY_URL!, {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenMetadata",
      params: [contract],
    });

    res.json(response.data.result); // { name, symbol, decimals, ... }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "metadata error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
