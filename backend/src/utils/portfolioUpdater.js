// Update the Portfolio After Trades (not Order);
import Portfolio from '../models/portfolio.model.js';

export const updatePortfolioAfterTrade = async ({
  userId,
  stockSymbol,
  quantity,
  price,
  session
}) => {
  let portfolio = await Portfolio.findOne({ user: userId }).session(session);

  if (!portfolio) {
    portfolio = await Portfolio.create([{ user: userId, holding: [] }], { session });
    portfolio = portfolio[0];
  }

  const holding = portfolio.holding.find(h => h.stockSymbol === stockSymbol);

  if (holding) {
    const totalQty = holding.quantity + quantity;
    const totalCost =
      holding.quantity * holding.avgPrice + quantity * price;

    holding.quantity = totalQty;
    holding.avgPrice = totalCost / totalQty;
  } else {
    portfolio.holding.push({
      stockSymbol,
      quantity,
      avgPrice: price
    });
  }

  portfolio.realizedPnL += realizedPnL;


  await portfolio.save({ session });
};
