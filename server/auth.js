const auth = require('basic-auth');

/**
 * Create a basic authentication middleware function that checks
 * against the given credentials.
 */
exports.basicAuth = (username, password) => {
  if (!username || !password) {
    throw new Error('Missing required username and password for basic authentication.');
  }

  return (req, res, next) => {
    const user = auth(req);

    const skipAuthPaths = [
      '/rental-agg-webhook',           // DropBox webhook
      '/api/webhook/trackShippoOrder', // Shippo webhook
      '/api/webhook/stripe',           // Stripe webhook
      '/api/webhook/',                 // Any webhook under /api/webhook/
      '/api/stripe/',                  // Any Stripe API endpoint
      '/api/shippo/',                  // Any Shippo API endpoint
      '/api/dropBoxSign/',             // Any DropBox API endpoint
      '/u/',
    ];

    const shouldSkipAuth = skipAuthPaths.some(path => req.path.startsWith(path)) || req.query.mode === 'storefront';

    if (user && user.name === username && user.pass === password || (shouldSkipAuth)) {
      next();
    } else {
      res
        .set({ 'WWW-Authenticate': 'Basic realm="Authentication required"' })
        .status(401)
        .end("I'm afraid I cannot let you do that.");
    }
  };
};
