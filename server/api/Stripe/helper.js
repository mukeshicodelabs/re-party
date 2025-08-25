// Centralized error handling utility
const handleStripeError = (res, error, defaultMessage) => {
  // Map Stripe error types to appropriate HTTP status codes
  const errorMap = {
    StripeCardError: 400, // Bad Request (card declined, insufficient funds)
    StripeInvalidRequestError: 400, // Invalid parameters
    StripeAuthenticationError: 401, // Authentication failed
    StripePermissionError: 403, // Permission issues
    StripeRateLimitError: 429, // Too many requests
    StripeConnectionError: 503, // Service unavailable
  };

  const status = errorMap[(error?.type)] || 500;
  res.status(status).json({
    error: defaultMessage,
    details: error?.message,
    type: error?.type,
  });
};

// Input validation utility
const validateInput = (input, requiredFields) => {
  for (const field of requiredFields) {
    if (!input[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
};

module.exports = {
  handleStripeError,
  validateInput,
};
