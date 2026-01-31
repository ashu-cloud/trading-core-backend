import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },
  holding: [{
    stockSymbol: String,
    quantity: Number,
    avgPrice: Number
  }],
  realizedPnL: {
    type: Number,
    default: 0
  }
}, { timestamps: true });



const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;

