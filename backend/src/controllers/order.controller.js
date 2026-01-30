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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { symbol, quantity } = req.body;
    const userId = req.user._id;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const stockSymbol = symbol.toUpperCase();
    const price = await fetchStockPrice(stockSymbol);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ success: false, message: "Invalid price" });
    }

    const user = await User.findById(userId).session(session);
    const orderValue = price * quantity;

    if (user.wallet_balance < orderValue) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    const [order] = await Order.create([{
      userId,
      stockSymbol,
      quantity,
      price,
      type: "BUY"
    }], { session });

    user.wallet_balance -= orderValue;
    await user.save({ session });

    
    await executeBuyOrder({ buyOrder: order, session });

    order.auditLogs.push({
        action: "CREATED",
        quantity,
        price
        });
    await order.save({ session });


    await session.commitTransaction();

    res.status(201).json({
      success: true,
      orderId: order._id,
      status: order.status
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Order failed" });
  } finally {
    session.endSession();
  }
};

/* ================= PLACE SELL ORDER ================= */

export const placeSellOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { symbol, quantity } = req.body;
    const userId = req.user._id;

    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol or quantity"
      });
    }

    const stockSymbol = symbol.toUpperCase();

    // 1️⃣ Fetch portfolio
    const portfolio = await Portfolio.findOne({ user: userId }).session(session);
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

    // 2️⃣ Fetch live price
    const price = await fetchStockPrice(stockSymbol);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock price"
      });
    }

    // 3️⃣ Calculate values
    const sellValue = price * quantity;
    const realizedPnl = (price - holding.avgPrice) * quantity;

    // 4️⃣ Create SELL order
    const [order] = await Order.create(
      [{
        userId,
        stockSymbol,
        quantity,
        price,
        type: "SELL",
        status: "FILLED",
        auditLogs: [{
          action: "SELL_EXECUTED",
          quantity,
          price,
          timestamp: new Date()
        }]
      }],
      { session }
    );

    // 5️⃣ Update portfolio
    holding.quantity -= quantity;
    holding.realizedPnl = (holding.realizedPnl || 0) + realizedPnl;

    if (holding.quantity === 0) {
      portfolio.holding = portfolio.holding.filter(
        h => h.stockSymbol !== stockSymbol
      );
    }

    await portfolio.save({ session });

    // 6️⃣ Credit wallet
    const user = await User.findById(userId).session(session);
    user.wallet_balance += sellValue;
    await user.save({ session });

    // 7️⃣ Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Sell order executed successfully",
      orderId: order._id,
      realizedPnl,
      amountCredited: sellValue
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
