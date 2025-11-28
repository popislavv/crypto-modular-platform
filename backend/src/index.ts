import express from "express";
import axios from "axios";
import "dotenv/config";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3100;

app.use(cors());
app.use(express.json());

// 🟡 SIMPLE CACHE ZA MARKET
let lastMarketData: any[] = [];
let lastMarketFetch = 0;

// Health check
app.get("/ping", function (req: express.Request, res: express.Response) {
  res.json({ message: "Backend radi ✅" });
});

// Market (CoinGecko) + cache
app.get("/market", async (req: express.Request, res: express.Response) => {
  const now = Date.now();

  // ako imamo cache noviji od 60 sekundi → vrati to, ne zovi CoinGecko ponovo
  if (lastMarketData.length && now - lastMarketFetch < 60_000) {
    return res.json(lastMarketData);
  }

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd"
    );

    lastMarketData = response.data;
    lastMarketFetch = now;

    res.json(response.data);
  } catch (error) {
    console.error(error);

    // ako imamo stari cache, bolje i to nego prazna stranica
    if (lastMarketData.length) {
      return res.json(lastMarketData);
    }

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

// Transactions (Etherscan)
app.get("/wallet/:address/tx", async (req, res) => {
  const { address } = req.params;
  const key = process.env.ETHERSCAN_KEY;

  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=10&sort=desc&apikey=${key}`;

    const response = await axios.get(url);

    res.json(response.data.result); // lista transakcija
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "tx list error" });
  }
});

app.post("/contact", async (req, res) => {
  const { email, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({ error: "Missing email or message" });
  }

  try {
    const smtpTransport =
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          })
        : null;

    const gmailTransport =
      process.env.GMAIL_USER && process.env.GMAIL_PASS
        ? nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_PASS,
            },
          })
        : null;

    const transporter = smtpTransport || gmailTransport;

    if (!transporter) {
      return res.status(500).json({ error: "mail transport not configured" });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || email,
      to: "popovicn700@gmail.com",
      replyTo: email,
      subject: "Chat with us message",
      text: message,
      html: `<p>${message}</p><p><strong>From:</strong> ${email}</p>`,
    });

    res.json({ status: "sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "send failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
