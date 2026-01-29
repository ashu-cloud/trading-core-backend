import axios from "axios";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

// ---- CACHES ----
const priceCache = new Map();
const stockListCache = new Map();

const PRICE_TTL = 15 * 1000;       // 15 seconds
const STOCK_LIST_TTL = 60 * 60 * 1000; // 1 hour

// ---- HELPERS ----
const getApiKey = () => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new Error("FINNHUB_API_KEY is missing");
  }
  return key;
};

// ---- FETCH PRICE ----
export const fetchStockPrice = async (symbol) => {
  const cached = priceCache.get(symbol);

  if (cached && Date.now() - cached.timestamp < PRICE_TTL) {
    return cached.price;
  }

  const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
    params: {
      symbol,
      token: getApiKey()
    }
  });

  const price = response.data?.c;

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid price received from Finnhub");
  }

  priceCache.set(symbol, {
    price,
    timestamp: Date.now()
  });

  return price;
};

// ---- FETCH STOCK LIST ----
export const fetchAllStocks = async (exchange = "US") => {
  const cached = stockListCache.get(exchange);

  if (cached && Date.now() - cached.timestamp < STOCK_LIST_TTL) {
    return cached.stocks;
  }

  const response = await axios.get(`${FINNHUB_BASE_URL}/stock/symbol`, {
    params: {
      exchange,
      token: getApiKey()
    }
  });

  const stocks = response.data;

  if (!Array.isArray(stocks)) {
    throw new Error("Invalid stock list received");
  }

  stockListCache.set(exchange, {
    stocks,
    timestamp: Date.now()
  });

  return stocks;
};
