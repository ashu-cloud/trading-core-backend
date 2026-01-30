import Order from "../models/order.model.js";
import Trade from "../models/trade.model.js";

export const executeBuyOrder = async ({ buyOrder, session }) => {
  let remainingQty = buyOrder.quantity - buyOrder.filledQuantity;

  const sellOrders = await Order.find({
    stockSymbol: buyOrder.stockSymbol,
    type: "SELL",
    status: { $in: ["OPEN", "PARTIAL"] },
    price: { $lte: buyOrder.price }
  })
    .sort({ price: 1, createdAt: 1 })
    .session(session);

  for (const sell of sellOrders) {
    if (remainingQty === 0) break;

    const availableQty = sell.quantity - sell.filledQuantity;
    const matchedQty = Math.min(remainingQty, availableQty);

    await Trade.create([{
      buyOrderId: buyOrder._id,
      sellOrderId: sell._id,
      stockSymbol: buyOrder.stockSymbol,
      price: sell.price,
      quantity: matchedQty
    }], { session });

    sell.filledQuantity += matchedQty;
    sell.status =
      sell.filledQuantity === sell.quantity ? "FILLED" : "PARTIAL";
    await sell.save({ session });

    buyOrder.filledQuantity += matchedQty;
    remainingQty -= matchedQty;
  }

  buyOrder.status =
    buyOrder.filledQuantity === buyOrder.quantity
      ? "FILLED"
      : buyOrder.filledQuantity > 0
        ? "PARTIAL"
        : "OPEN";

  await buyOrder.save({ session });
};
