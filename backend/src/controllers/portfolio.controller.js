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
        totalUnrealizedPnl: 0
      });
    }

    let totalUnrealizedPnl = 0;

    const enrichedHoldings = await Promise.all(
      portfolio.holding.map(async (h) => {
        const currentPrice = await fetchStockPrice(h.stockSymbol);
        const unrealizedPnl =
          (currentPrice - h.avgPrice) * h.quantity;

        totalUnrealizedPnl += unrealizedPnl;

        return {
          stockSymbol: h.stockSymbol,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          currentPrice,
          unrealizedPnl,
          realizedPnl: h.realizedPnl
        };
      })
    );

    res.status(200).json({
      success: true,
      holdings: enrichedHoldings,
      totalUnrealizedPnl
    });

  } catch (err) {
    console.error("GetPortfolio error:", err.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch portfolio"
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
