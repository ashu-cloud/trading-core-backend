import mongoose from "mongoose";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Portfolio from "../models/portfolio.model.js";
import { fetchStockPrice } from "../utils/marketData.js";
import { executeBuyOrder } from "../utils/orderExecution.js";

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
  try {
    const userId = req.user._id;
    const { symbol, quantity } = req.body;

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

    const user = await User.findById(userId);
    if (user.wallet_balance < orderValue) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // 1️⃣ Create OPEN order
    const order = await Order.create({
      userId,
      stockSymbol,
      quantity,
      price,
      type: "BUY",
      status: "OPEN",
      auditLogs: [{
        action: "CREATED",
        quantity,
        price,
        timestamp: new Date()
      }]
    });

    // 2️⃣ Block funds (deduct for now)
    user.wallet_balance -= orderValue;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Buy order placed (OPEN)",
      orderId: order._id
    });

  } catch (err) {
    console.error("Place BUY error:", err.message);
    res.status(500).json({
      success: false,
      message: "Unable to place buy order"
    });
  }
};


/* ================= PLACE SELL ORDER ================= */

export const placeSellOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.user._id;
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol or quantity"
      });
    }

    const stockSymbol = symbol.toUpperCase();

    const portfolio = await Portfolio
      .findOne({ user: userId })
      .session(session);

    if (!portfolio) {
      return res.status(400).json({
        success: false,
        message: "No holdings found"
      });
    }

    const holding = portfolio.holding.find(
      h => h.stockSymbol === stockSymbol
    );

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings"
      });
    }

    const price = await fetchStockPrice(stockSymbol);
    const sellValue = price * quantity;

    const realizedPnL = (price - holding.avgPrice) * quantity;


    // 1️⃣ Create SELL order (FILLED)
    const order = await Order.create([{
      userId,
      stockSymbol,
      quantity,
      price,
      type: "SELL",
      status: "FILLED",
      filledQuantity: quantity,
      auditLogs: [{
        action: "FILLED",
        quantity,
        price
      }]
    }], { session });

    // 2️⃣ Update portfolio
    holding.quantity -= quantity;

    if (holding.quantity === 0) {
      portfolio.holding = portfolio.holding.filter(
        h => h.stockSymbol !== stockSymbol
      );
    }

    await portfolio.save({ session });

    // 3️⃣ Credit wallet
    const user = await User.findById(userId).session(session);
    user.wallet_balance += sellValue;
    await user.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Sell order executed",
      orderId: order[0]._id,
      amountCredited: sellValue,
      realizedPnL
    });

  } catch (err) {
    await session.abortTransaction();
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
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Only OPEN orders can be cancelled"
      });
    } 


    if (order.status === "FILLED") {
      return res.status(400).json({ success: false, message: "Cannot cancel filled order" });
    }

    const refundableQty = order.quantity - order.filledQuantity;
    const refund = refundableQty * order.price;

    const user = await User.findById(order.userId);
    user.wallet_balance += refund;
    await user.save();

    order.status = "CANCELLED";
    order.auditLogs.push({
    action: "CANCELLED",
    quantity: order.quantity - order.filledQuantity,
    price: order.price
    });
    await order.save();


    res.status(200).json({ success: true, message: "Order cancelled" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Cancel failed" });
  }
};



// Execute Order
export const executeBuyOrderAndUpdatePortfolio = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (order.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be executed"
      });
    }

    // 1️⃣ Update portfolio
    let portfolio = await Portfolio.findOne({ user: userId }).session(session);

    if (!portfolio) {
      portfolio = await Portfolio.create(
        [{ user: userId, holding: [] }],
        { session }
      );
      portfolio = portfolio[0];
    }

    const holding = portfolio.holding.find(
      h => h.stockSymbol === order.stockSymbol
    );

    if (holding) {
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

    // 2️⃣ Mark order FILLED
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

    res.status(500).json({
      success: false,
      message: "Order execution failed"
    });
  } finally {
    session.endSession();
  }
};
 