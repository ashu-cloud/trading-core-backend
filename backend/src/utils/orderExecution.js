import Trade from '../models/trade.model.js';
import Portfolio from '../models/portfolio.model.js';
/**
 * Executes a BUY order immediately (simulation).
 * This function assumes:
 * - wallet is already deducted
 * - order exists and is OPEN
 */
export const executeBuyOrder = async ({ order, userId , session }) => {
  const { stockSymbol, price, quantity } = order;

  // 1️⃣ Create trade (execution record)
  const trade = await Trade.create({
    buyOrderId: order._id,
    stockSymbol,
    price,
    quantity
  },{session});

  // 2️⃣ Fetch or create portfolio
  let portfolio = await Portfolio.findOne({ user: userId }).session(session);

  if (!portfolio) {
    portfolio = await Portfolio.create({
      user: userId,
      holding: []
    }, {session});
  }

  // 3️⃣ Update holdings
  const existingHolding = portfolio.holding.find(
    h => h.stockSymbol === stockSymbol
  );

  if (existingHolding) {
    const totalQty = existingHolding.quantity + quantity;
    const totalCost =
      existingHolding.avgPrice * existingHolding.quantity +
      price * quantity;

    existingHolding.quantity = totalQty;
    existingHolding.avgPrice = totalCost / totalQty;
  } else {
    portfolio.holding.push({
      stockSymbol,
      quantity,
      avgPrice: price
    });
  }

  await portfolio.save({session});

  // 4️⃣ Mark order FILLED
  order.status = "FILLED";
  await order.save({session});

  return trade;
};
