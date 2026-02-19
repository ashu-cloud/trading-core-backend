import {fetchStockPrice , fetchAllStocks} from '../utils/marketData.js';
import axios from 'axios';

export const getStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ success: false, message: "Stock symbol is required" });
    }

    const upperSymbol = symbol.toUpperCase();
    
    // Wrap fetch in try-catch to handle Finnhub errors specifically
    let price;
    try {
      price = await fetchStockPrice(upperSymbol);
    } catch (error) {
      // If Finnhub fails or symbol invalid, return 404 (Not Found)
      // This prevents the 500 "Service Unavailable" error on frontend
      return res.status(404).json({ 
        success: false, 
        message: "Symbol not found or market data unavailable" 
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(404).json({ success: false, message: "Price unavailable" });
    }

    res.status(200).json({
      success: true,
      symbol: upperSymbol,
      price
    });

  } catch (err) {
    console.error("getStockPrice Critical Error:", err.message);
    // Only return 500 for actual server crashes
    res.status(500).json({
      success: false,
      message: `Internal Server Error: ${err.message}`
    });
  }
};


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAllStocks = async (req, res) => {
  try {
    const exchange = req.query.exchange || "US";
    const limit = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const allStocks = await fetchAllStocks(exchange);
    const filteredStocks = allStocks.filter(s => s.mic === "XNGS" || s.mic === "XNYS");
    const pageItems = filteredStocks.slice(skip, skip + limit);

    // ✅ 2. Replace Promise.all with a sequential loop
    const stocksWithPrices = [];
    
    for (const stock of pageItems) {
      try {
        const price = await fetchStockPrice(stock.symbol);
        stocksWithPrices.push({
          symbol: stock.symbol,
          description: stock.description || stock.displaySymbol,
          price: price
        });
      } catch (err) {
        // Log the actual error so you can see if it's a 429 (Rate Limit) or 404 (Not Found)
        console.error(`Failed to fetch ${stock.symbol}:`, err.message);
        stocksWithPrices.push({ ...stock, price: 0 });
      }
      
      // ✅ 3. Add a 100-millisecond pause between each API call
      // This spreads 20 requests over 2 seconds, keeping you under the burst limit!
      await sleep(100); 
    }

    res.status(200).json({
      success: true,
      page,
      total: filteredStocks.length,
      stocks: stocksWithPrices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;

    const response = await axios.get(
      "https://finnhub.io/api/v1/stock/candle",
      {
        params: {
          symbol,
          resolution: "D",
          from: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
          to: Math.floor(Date.now() / 1000),
          token: process.env.FINNHUB_API_KEY
        }
      }
    );

    if (response.data.s !== "ok") {
      return res.status(404).json({
        success: false,
        message: "No historical data"
      });
    }

    res.status(200).json({
      success: true,
      timestamps: response.data.t,
      prices: response.data.c
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock history"
    });
  }
};
