const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  shares: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const etfSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  shares: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  costBasis: {
    type: Number,
    required: true,
    min: 0,
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  distribution: {
    type: Number,
    required: true,
    min: 0,
  },
  purchases: [purchaseSchema],
});

module.exports = mongoose.model("ETF", etfSchema);
