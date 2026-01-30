import {fetchStockPrice , fetchAllStocks} from '../utils/marketData.js';
import axios from 'axios';

export const getStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required"
      });
    }

    const upperSymbol = symbol.toUpperCase();
    const price = await fetchStockPrice(upperSymbol);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(404).json({
        success: false,
        message: "Stock price not available"
      });
    }

    res.status(200).json({
      success: true,
      symbol: upperSymbol,
      price
    });

  } catch (err) {
    console.error("getStockPrice error:", err.message);

    res.status(500).json({
      success: false,
      message:` Failed to fetch stock price ${err.message}`
    });
  }
};





export const getAllStocks = async (req, res) => {
  try {
    const exchange = req.query.exchange || "US";
    const limit = Number(req.query.limit) || 100;

    const stocks = await fetchAllStocks(exchange);

    if (!stocks || stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stocks available"
      });
    }

    const formattedStocks = stocks
      .slice(0, limit)
      .map(stock => ({
        symbol: stock.symbol,
        description: stock.description,
        exchange: stock.exchange
      }));

    res.status(200).json({
      success: true,
      count: formattedStocks.length,
      stocks: formattedStocks
    });

  } 
  catch (err) {
    console.error("getAllStocks error:", err.message);

    res.status(500).json({
      success: false,
      message: `Failed to fetch available stocks ${err.message}`
    });
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
