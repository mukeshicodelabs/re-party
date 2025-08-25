const mongoose = require('mongoose');

const securityPaymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
    },
    intentId: {
      type: String,
      required: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    txId: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'captured'],
      default: 'active',
    },
    lastAuthorizedAt: {
      type: Date,
      default: Date.now,
    },
    bookingComplete: {
      type: Boolean,
      default: false,
    },
    providerStripeAccountId: {
      type: String,
      required: true,
    },
    isCrossBorderPayment: {
      type: Boolean,
      default: false,
    },
    transferGroup: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Payout = mongoose.model('SecurityPayment', securityPaymentSchema);

module.exports = Payout;
