import express from "express";
import axios from "axios";
import "dotenv/config";
import cors from "cors";

const app = express();
const PORT = 3100;

app.use(cors());

app.get("/ping", function (req: express.Request, res: express.Response) {
  res.json({ message: "Backend radi ✅" });
});

app.get("/market", async (req: express.Request, res: express.Response) => {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "market data error" });
  }
});

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

    const balanceInWei = parseInt(response.data.result, 16);
    const balanceInEth = balanceInWei / 1e18;

    res.json({ address, balance: balanceInEth });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "wallet data error" });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
