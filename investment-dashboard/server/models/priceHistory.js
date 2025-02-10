const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    uppercase: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Create an index for faster queries
priceHistorySchema.index({ ticker: 1, timestamp: -1 });

module.exports = mongoose.model("PriceHistory", priceHistorySchema);
