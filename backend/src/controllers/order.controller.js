import mongoose from "mongoose";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Portfolio from "../models/portfolio.model.js";
import { fetchStockPrice } from "../utils/marketData.js";
import { executeBuyOrder } from "../utils/orderExecution.js";

/* ================= GET USER ORDERS ================= */

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unable to fetch orders" });
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
    const stockSymbol = symbol.toUpperCase();

    const portfolio = await Portfolio.findOne({ user: userId }).session(session);

    if (!portfolio) {
      return res.status(400).json({ success: false, message: "No holdings" });
    }

    const holding = portfolio.holding.find(h => h.stockSymbol === stockSymbol);

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient holdings" });
    }

    const price = await fetchStockPrice(stockSymbol);

    await Order.create([{
      userId,
      stockSymbol,
      quantity,
      price,
      type: "SELL"
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Sell order placed"
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Sell order failed" });
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
    await order.save();

    res.status(200).json({ success: true, message: "Order cancelled" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Cancel failed" });
  }
};
