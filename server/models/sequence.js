const mongoose = require('mongoose');

const SequenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true, // each type like 'UPDATE', 'DELETE' should have one entry
      trim: true,
    },
    lastId: {
      type: Number,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'sequence_ids', // collection name in MongoDB
    timestamps: true,           // adds createdAt and updatedAt fields automatically
  }
);

// Optional: Middleware to update `updatedAt` manually if needed
SequenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Sequence', SequenceSchema);
