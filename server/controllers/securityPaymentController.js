const SecurityPayment = require('../models/securityPayment');

// Add new security payment
const addSecurityPayment = async (req, res) => {
  try {
    const data = req.body;
    const securityPayment = await SecurityPayment.create(data);
    return res.status(201).json({ success: true, data: securityPayment });
  } catch (error) {
    console.error('Error adding security payment:', error);
    return res.status(500).json({ success: false, error: 'Failed to add security payment' });
  }
};

// Update existing security payment
const updateSecurityPayment = async (req, res) => {
  try {
    const { id } = req.params; // Assuming you're passing the ID in route param
    const updateData = req.body;

    const updated = await SecurityPayment.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Security payment not found' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating security payment:', error);
    return res.status(500).json({ success: false, error: 'Failed to update security payment' });
  }
};

// Get all pending security payments
const getPendingSecurityPayments = async (req, res) => {
  try {
    const pendingPayments = await SecurityPayment.find({ status: 'pending' }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: pendingPayments });
  } catch (error) {
    console.error('Error fetching pending security payments:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pending security payments' });
  }
};

module.exports = {
  addSecurityPayment,
  updateSecurityPayment,
  getPendingSecurityPayments,
};
