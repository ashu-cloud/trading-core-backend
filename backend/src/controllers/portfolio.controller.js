import Portfolio from "../models/portfolio.model.js";
import { fetchStockPrice } from "../utils/marketData.js";

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolio = await Portfolio.findOne({ user: userId });

    if (!portfolio) {
      return res.status(200).json({
        success: true,
        holdings: [],
        totalUnrealizedPnl: 0,
        totalRealizedPnl: 0 // Added for Dashboard consistency
      });
    }

    let totalUnrealizedPnl = 0;

    const enrichedHoldings = await Promise.all(
      portfolio.holding.map(async (h) => {
        try {
          // 1. SAFETY WRAP: If fetchStockPrice fails, we catch it locally
          const currentPrice = await fetchStockPrice(h.stockSymbol).catch(() => 0);
          
          const unrealizedPnl = (currentPrice - h.avgPrice) * h.quantity;
          
          // Accumulate totals
          totalUnrealizedPnl += unrealizedPnl;

          return {
            stockSymbol: h.stockSymbol,
            quantity: h.quantity,
            avgPrice: h.avgPrice,
            currentPrice,
            unrealizedPnl,
            realizedPnl: h.realizedPnl || 0
          };
        } catch (innerErr) {
          // If a single stock calculation fails, return a partial object instead of crashing
          return {
            stockSymbol: h.stockSymbol,
            quantity: h.quantity,
            avgPrice: h.avgPrice,
            currentPrice: 0,
            unrealizedPnl: 0,
            realizedPnl: h.realizedPnl || 0
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      holdings: enrichedHoldings,
      totalUnrealizedPnl,
      totalRealizedPnl: portfolio.totalRealizedPnl || 0
    });

  } catch (err) {
    console.error("GetPortfolio Critical Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during portfolio calculation"
    });
  }
};

export const getPortfolioAllocation = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio || portfolio.holding.length === 0) {
      return res.status(200).json({
        success: true,
        allocation: []
      });
    }

    const allocation = portfolio.holding.map(h => ({
      stockSymbol: h.stockSymbol,
      quantity: h.quantity
    }));

    res.status(200).json({
      success: true,
      allocation
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch allocation"
    });
  }
};
