const Payout = require('../models/SecurityPayout');

// Function to add a new entry
async function addSecurityPayout(data) {
  const payout = await Payout.create(data);
  return payout;
}

// Function to update an entry
async function updateSecurityPayout(_id, updateData) {
  const payout = await Payout.findOneAndUpdate({ _id }, updateData, { new: true });
  return payout;
}

const getPendingSecurityPayouts = async () => {
  try {
    const pendingPayouts = await Payout.find({ status: 'pending' }).sort({
      createdAt: 1,
    });
    return pendingPayouts;
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    throw error;
  }
};

module.exports = {
  addSecurityPayout,
  updateSecurityPayout,
  getPendingSecurityPayouts,
};
