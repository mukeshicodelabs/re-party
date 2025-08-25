const { handleError, getTrustedSdk } = require('../api-util/sdk');

const UNAUTHORISED = 'unauthorized';

const authenticateFlexUser = async (req, res, next) => {
  try {
    const trustedSdk = await getTrustedSdk(req);
    const userResponse = await trustedSdk.currentUser.show({});

    const currentUser = userResponse?.data?.data;

    if (!currentUser) {
      return res.status(401).json({ error: UNAUTHORISED });
    }

    next();
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { authenticateFlexUser };
