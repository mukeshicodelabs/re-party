const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    destination: {
      type: String,
      required: true,
    },
    txId: {
      type: String,
      required: true,
    },
    payoutId: {
      type: String,
    },
    transferId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      required: true,
      default: 'pending',
    },
    description: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    availableOn: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payout = mongoose.model('SecurityPayout', payoutSchema);

module.exports = Payout;
