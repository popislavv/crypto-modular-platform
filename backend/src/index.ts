import express from "express";
import axios from "axios";
import "dotenv/config";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const PORT = process.env.PORT || 3100;
const COINGECKO_BASE_URL =
  process.env.COINGECKO_BASE_URL || "https://api.coingecko.com/api/v3";
const CACHE_TTL_MS = 60_000;

app.use(cors());
app.use(express.json());

function sendError(
  res: express.Response,
  status: number,
  code: string,
  message: string,
  provider = "gateway",
  hint?: string
) {
  return res.status(status).json({
    error: { code, message, provider, hint },
  });
}

function ensureEnv(
  res: express.Response,
  value: string | undefined,
  name: string,
  provider: string
) {
  if (!value) {
    sendError(
      res,
      500,
      "CONFIG_MISSING",
      `${name} is not configured`,
      provider,
      `Set ${name} in your backend .env`
    );
    return false;
  }
  return true;
}

const marketCache = {
  data: [] as any[],
  timestamp: 0,
  hits: 0,
  misses: 0,
  staleReturns: 0,
  lastFetchMs: 0,
};

const chartCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    hits: number;
    misses: number;
    staleReturns: number;
    lastFetchMs: number;
  }
>();

const chartCacheMetrics = () => {
  let hits = 0;
  let misses = 0;
  let staleReturns = 0;
  let lastFetchMs = 0;

  for (const entry of chartCache.values()) {
    hits += entry.hits;
    misses += entry.misses;
    staleReturns += entry.staleReturns;
    lastFetchMs = entry.lastFetchMs || lastFetchMs;
  }

  return { hits, misses, staleReturns, lastFetchMs };
};

// Health check
app.get("/ping", function (req: express.Request, res: express.Response) {
  res.json({ message: "Backend radi ✅" });
});

// Market (CoinGecko) + cache + metrics
app.get("/market", async (req: express.Request, res: express.Response) => {
  const now = Date.now();
  const refresh = req.query.refresh === "true";
  const cacheValid =
    marketCache.data.length && !refresh && now - marketCache.timestamp < CACHE_TTL_MS;

  if (cacheValid) {
    marketCache.hits += 1;
    res.setHeader("X-Cache", "HIT");
    console.log(`[market] cache HIT`);
    return res.json(marketCache.data);
  }

  const started = Date.now();

  try {
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd`
    );

    marketCache.data = response.data;
    marketCache.timestamp = Date.now();
    marketCache.lastFetchMs = Date.now() - started;
    marketCache.misses += 1;

    res.setHeader("X-Cache", "MISS");
    console.log(`[market] fetch ${marketCache.lastFetchMs}ms MISS`);
    res.json(response.data);
  } catch (error) {
    console.error("[market] upstream error", error);

    if (marketCache.data.length) {
      marketCache.staleReturns += 1;
      res.setHeader("X-Cache", "STALE");
      return res.json(marketCache.data);
    }

    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to fetch market data",
      "CoinGecko",
      "Try again shortly"
    );
  }
});

// Coin details (proxy)
app.get("/coin/:id", async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  try {
    const started = Date.now();
    const response = await axios.get(
      `${COINGECKO_BASE_URL}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
    );

    const duration = Date.now() - started;
    console.log(`[coin:${id}] fetch ${duration}ms MISS`);
    res.setHeader("X-Cache", "MISS");
    res.json(response.data);
  } catch (error) {
    console.error(`[coin:${id}] upstream error`, error);
    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to fetch coin details",
      "CoinGecko",
      "Verify the coin id"
    );
  }
});

// Coin market chart with cache
app.get(
  "/coin/:id/market_chart",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const days = `${req.query.days || 7}`;
    const refresh = req.query.refresh === "true";
    const cacheKey = `${id}:${days}`;
    const entry = chartCache.get(cacheKey);
    const cacheValid =
      entry && !refresh && Date.now() - entry.timestamp < CACHE_TTL_MS;

    if (entry && cacheValid) {
      entry.hits += 1;
      res.setHeader("X-Cache", "HIT");
      console.log(`[chart:${cacheKey}] cache HIT`);
      return res.json(entry.data);
    }

    const started = Date.now();

    try {
      const response = await axios.get(
        `${COINGECKO_BASE_URL}/coins/${id}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days,
          },
        }
      );

      const duration = Date.now() - started;

      const updatedEntry = entry || {
        data: null,
        timestamp: 0,
        hits: 0,
        misses: 0,
        staleReturns: 0,
        lastFetchMs: 0,
      };

      updatedEntry.data = response.data;
      updatedEntry.timestamp = Date.now();
      updatedEntry.lastFetchMs = duration;
      updatedEntry.misses += 1;

      chartCache.set(cacheKey, updatedEntry);

      res.setHeader("X-Cache", "MISS");
      console.log(`[chart:${cacheKey}] fetch ${duration}ms MISS`);
      res.json(response.data);
    } catch (error) {
      console.error(`[chart:${cacheKey}] upstream error`, error);

      if (entry?.data) {
        entry.staleReturns += 1;
        res.setHeader("X-Cache", "STALE");
        return res.json(entry.data);
      }

      sendError(
        res,
        502,
        "UPSTREAM_ERROR",
        "Unable to fetch chart data",
        "CoinGecko",
        "Try again shortly"
      );
    }
  }
);

// Metrics endpoint
app.get("/metrics", (req: express.Request, res: express.Response) => {
  const chartMetrics = chartCacheMetrics();

  res.json({
    marketCacheHits: marketCache.hits,
    marketCacheMisses: marketCache.misses,
    marketCacheStaleReturns: marketCache.staleReturns,
    marketLastFetchMs: marketCache.lastFetchMs,
    chartCacheHits: chartMetrics.hits,
    chartCacheMisses: chartMetrics.misses,
    chartCacheStaleReturns: chartMetrics.staleReturns,
    chartLastFetchMs: chartMetrics.lastFetchMs,
  });
});

// ETH balance (Alchemy)
app.get("/wallet/:address", async (req: express.Request, res: express.Response) => {
  const { address } = req.params;
  const ALCHEMY_URL = process.env.ALCHEMY_URL;

  if (!ensureEnv(res, ALCHEMY_URL, "ALCHEMY_URL", "Alchemy")) {
    return;
  }

  try {
    const response = await axios.post(ALCHEMY_URL, {
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
    console.error("[wallet] upstream error", error);
    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to fetch wallet balance",
      "Alchemy",
      "Check the address and API key"
    );
  }
});

// ERC-20 token balances (Alchemy)
app.get("/wallet/:address/tokens", async (req: express.Request, res: express.Response) => {
  const { address } = req.params;
  const ALCHEMY_URL = process.env.ALCHEMY_URL;

  if (!ensureEnv(res, ALCHEMY_URL, "ALCHEMY_URL", "Alchemy")) {
    return;
  }

  try {
    const response = await axios.post(ALCHEMY_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenBalances",
      params: [address, "erc20"],
    });

    res.json(response.data.result); // { tokenBalances: [...] }
  } catch (error) {
    console.error("[tokens] upstream error", error);
    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to fetch token balances",
      "Alchemy",
      "Check the address and API key"
    );
  }
});

// Token metadata (decimals/symbol/name)
app.get("/token/:contract/metadata", async (req: express.Request, res: express.Response) => {
  const { contract } = req.params;
  const ALCHEMY_URL = process.env.ALCHEMY_URL;

  if (!ensureEnv(res, ALCHEMY_URL, "ALCHEMY_URL", "Alchemy")) {
    return;
  }

  try {
    const response = await axios.post(ALCHEMY_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenMetadata",
      params: [contract],
    });

    res.json(response.data.result); // { name, symbol, decimals, ... }
  } catch (error) {
    console.error("[metadata] upstream error", error);
    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to fetch token metadata",
      "Alchemy",
      "Check the token contract"
    );
  }
});

// Transactions (Etherscan)
app.get("/wallet/:address/tx", async (req, res) => {
  const { address } = req.params;
  const key = process.env.ETHERSCAN_KEY;

  if (!ensureEnv(res, key, "ETHERSCAN_KEY", "Etherscan")) {
    return;
  }

  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=10&sort=desc&apikey=${key}`;

    const response = await axios.get(url);

    res.json(response.data.result); // lista transakcija
  } catch (error) {
    console.error("[tx] upstream error", error);
    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to fetch transactions",
      "Etherscan",
      "Verify the address and key"
    );
  }
});

app.post("/contact", async (req, res) => {
  const { email, message } = req.body || {};

  if (!email || !message) {
    return sendError(
      res,
      400,
      "BAD_REQUEST",
      "Missing email or message",
      "gateway",
      "Provide both email and message"
    );
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
      return sendError(
        res,
        500,
        "CONFIG_MISSING",
        "Mail transport not configured",
        "mailer",
        "Set SMTP_* or GMAIL_* variables"
      );
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
    console.error("[contact] error", error);
    sendError(
      res,
      502,
      "UPSTREAM_ERROR",
      "Unable to send email",
      "mailer",
      "Check mail credentials"
    );
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
