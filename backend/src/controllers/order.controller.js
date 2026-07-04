import mongoose from "mongoose";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Portfolio from "../models/portfolio.model.js";
import { fetchStockPrice } from "../utils/marketData.js";

/* ================= GET USER ORDERS ================= */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ userId })
    ]);

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders
    });

  } catch (err) {
    console.error("GetUserOrders error:", err.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch your orders"
    });
  }
};

/* ================= PLACE BUY ORDER ================= */
export const placeUserOrder = async (req, res) => {
  const userId = req.user._id;
  const { symbol, quantity } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: "Missing idempotency key. Please provide it in the 'Idempotency-Key' header or in the request body."
    });
  }

  if (!symbol || !quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid symbol or quantity"
    });
  }

  const stockSymbol = symbol.toUpperCase();
  const price = await fetchStockPrice(stockSymbol);

  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid stock price"
    });
  }

  const orderValue = price * quantity;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user || user.wallet_balance < orderValue) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // 1. Create OPEN order
    const order = await Order.create([{
      userId,
      stockSymbol,
      quantity,
      price,
      type: "BUY",
      status: "OPEN",
      idempotencyKey,
      auditLogs: [{
        action: "CREATED",
        quantity,
        price,
        timestamp: new Date()
      }]
    }], { session });

    // 2. Block funds
    user.wallet_balance -= orderValue;
    await user.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Buy order placed (OPEN)",
      orderId: order[0]._id
    });

  } catch (err) {
    await session.abortTransaction();

    // Check if duplicate key error on idempotencyKey
    if (err.code === 11000) {
      try {
        const existingOrder = await Order.findOne({ idempotencyKey });
        if (existingOrder) {
          return res.status(200).json({
            success: true,
            message: "Buy order placed (OPEN) - Duplicate request, returning original result.",
            orderId: existingOrder._id
          });
        }
      } catch (findErr) {
        console.error("Error finding existing buy order:", findErr.message);
      }
    }

    console.error("Place BUY error:", err.message);
    res.status(500).json({
      success: false,
      message: "Unable to place buy order"
    });
  } finally {
    session.endSession();
  }
};

/* ================= PLACE SELL ORDER ================= */
export const placeSellOrder = async (req, res) => {
  const userId = req.user._id;
  const { symbol, quantity, price: userPrice } = req.body;
  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: "Missing idempotency key. Please provide it in the 'Idempotency-Key' header or in the request body."
    });
  }

  if (!symbol || !quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid symbol or quantity"
    });
  }

  const stockSymbol = symbol.toUpperCase();

  // Use user-provided limit price if valid, otherwise fetch live market price
  let price;
  if (userPrice && Number.isFinite(Number(userPrice)) && Number(userPrice) > 0) {
    price = Number(userPrice);
  } else {
    price = await fetchStockPrice(stockSymbol);
  }

  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid stock price"
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const portfolio = await Portfolio
      .findOne({ user: userId })
      .session(session);

    if (!portfolio) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "No holdings found"
      });
    }

    const holding = portfolio.holding.find(
      h => h.stockSymbol === stockSymbol
    );

    if (!holding || holding.quantity < quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings"
      });
    }

    const sellValue = price * quantity;

    // CALCULATION: (Sell Price - Original Avg Buy Price) * Quantity
    const tradePnL = (price - holding.avgPrice) * quantity;

    // 1. Create SELL order (FILLED)
    const order = await Order.create([{
      userId,
      stockSymbol,
      quantity,
      price,
      type: "SELL",
      status: "FILLED",
      filledQuantity: quantity,
      idempotencyKey,
      auditLogs: [{
        action: "FILLED",
        quantity,
        price
      }]
    }], { session });

    // 2. Update portfolio holdings
    holding.quantity -= quantity;

    // PERSISTENCE: Accumulate into totalRealizedPnl
    if (portfolio.totalRealizedPnl === undefined || portfolio.totalRealizedPnl === null) {
      portfolio.totalRealizedPnl = 0;
    }
    portfolio.totalRealizedPnl += tradePnL;
    portfolio.markModified('totalRealizedPnl');

    if (holding.quantity === 0) {
      portfolio.holding = portfolio.holding.filter(
        h => h.stockSymbol !== stockSymbol
      );
    }

    await portfolio.save({ session });

    // 3. Credit wallet
    const user = await User.findById(userId).session(session);
    user.wallet_balance += sellValue;
    await user.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Sell order executed",
      orderId: order[0]._id,
      amountCredited: sellValue,
      realizedPnL: tradePnL
    });

  } catch (err) {
    await session.abortTransaction();

    // Check if duplicate key error on idempotencyKey
    if (err.code === 11000) {
      try {
        const existingOrder = await Order.findOne({ idempotencyKey });
        if (existingOrder) {
          return res.status(200).json({
            success: true,
            message: "Sell order executed - Duplicate request, returning original result.",
            orderId: existingOrder._id,
            amountCredited: existingOrder.price * existingOrder.quantity,
            realizedPnL: 0
          });
        }
      } catch (findErr) {
        console.error("Error finding existing sell order:", findErr.message);
      }
    }

    console.error("Sell Order Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Sell order failed"
    });
  } finally {
    session.endSession();
  }
};

/* ================= CANCEL ORDER ================= */
export const cancelUserOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
      status: "OPEN"
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found or not cancellable" });
    }

    const refundableQty = order.quantity - (order.filledQuantity || 0);
    const refund = refundableQty * order.price;

    await User.findByIdAndUpdate(
      order.userId,
      { $inc: { wallet_balance: refund } },
      { session }
    );

    order.status = "CANCELLED";
    order.auditLogs.push({
      action: "CANCELLED",
      quantity: refundableQty,
      price: order.price
    });
    await order.save({ session });

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Order cancelled" });

  } catch (err) {
    await session.abortTransaction();
    console.error("Cancel Order Error:", err.message);
    res.status(500).json({ success: false, message: "Cancel failed" });
  } finally {
    session.endSession();
  }
};

/* ================= EXECUTE OPEN BUY ORDER ================= */
export const executeBuyOrderAndUpdatePortfolio = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId).session(session);

    if (!order || order.userId.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "OPEN") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Order cannot be executed"
      });
    }

    let portfolio = await Portfolio.findOne({ user: userId }).session(session);

    if (!portfolio) {
      portfolio = await Portfolio.create(
        [{ user: userId, holding: [], totalRealizedPnl: 0 }],
        { session }
      );
      portfolio = portfolio[0];
    }

    const holding = portfolio.holding.find(
      h => h.stockSymbol === order.stockSymbol
    );

    if (holding) {
      // ✅ Adjust Average Price for the new position
      const totalQty = holding.quantity + order.quantity;
      const totalCost =
        holding.quantity * holding.avgPrice +
        order.quantity * order.price;

      holding.quantity = totalQty;
      holding.avgPrice = totalCost / totalQty;
    } else {
      portfolio.holding.push({
        stockSymbol: order.stockSymbol,
        quantity: order.quantity,
        avgPrice: order.price,
        realizedPnl: 0
      });
    }

    await portfolio.save({ session });

    order.status = "FILLED";
    order.auditLogs.push({
      action: "FILLED",
      quantity: order.quantity,
      price: order.price,
      timestamp: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Order executed successfully"
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("Execute BUY error:", err.message);
    res.status(500).json({ success: false, message: "Order execution failed" });
  } finally {
    session.endSession();
  }
};