import Portfolio from "../models/portfolio.model.js";
import { fetchStockPrice } from "../utils/marketData.js";

export const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    if (!portfolio || portfolio.holding.length === 0) {
      return res.status(200).json({
        success: true,
        holdings: [],
        totalPnL: 0
      });
    }

    let totalPnL = 0;

    const enrichedHoldings = await Promise.all(
      portfolio.holding.map(async (h) => {
        const currentPrice = await fetchStockPrice(h.stockSymbol);
        const pnl = (currentPrice - h.avgPrice) * h.quantity;
        totalPnL += pnl;

        return {
          stockSymbol: h.stockSymbol,
          quantity: h.quantity,
          avgPrice: h.avgPrice,
          currentPrice,
          pnl
        };
      })
    );

    res.status(200).json({
      success: true,
      holdings: enrichedHoldings,
      totalPnL
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio"
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
