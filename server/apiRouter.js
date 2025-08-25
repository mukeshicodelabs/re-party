/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');
const multer = require('multer');

const createUserWithIdp = require('./api/auth/createUserWithIdp');

const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');
const { generateAiListing } = require('./api/ai/AiListing');
const { checkCalenderAvailability } = require('./api/checkAvailability');
const { getLocationDistance } = require('./api/getLocationDistance');
const { generateAiImage } = require('./api/ai/AiImage');
const { createSearchData, updateSearchData, deleteSearchData } = require('./controllers/algolia/alogoliaSearch');
const { runCron } = require('./controllers/crons/crons');
const { FetchImageDesc } = require('./api/ai/FetchImageDesc');

const { sendDropBoxRentalAgreement } = require('./api/dropBoxSign');

const { getUtcTime } = require('./api/getUtcTime');
const {
  createStripeIntent,
  createStripeSetupIntent,
  initiateStripeRefund,
  captureStripeIntent,
  cancelStripeIntent,
  customerCancelRefund,
} = require('./api/Stripe/stripeApi');
const { getShippingRates, createShippingLabel, validatingAddressWithShippo, getCarrierAccount, trackingOrderWebhook } = require('./api/shippo/shippo');
const { stripeWebhook } = require('./api/Stripe/webhook');
const { validateFileType } = require('./api/R2/helper');
const { uploadFileToR2 } = require('./api/R2');
const { authenticateFlexUser } = require('./middleware/authenticateFlexUser');
const { updateMetaDataApi } = require('./api/updateTransactionMetaData');
const { addSecurityPayment, updateSecurityPayment, getPendingSecurityPayments } = require('./controllers/securityPaymentController');
const { sendMail } = require('./api/mailchimp');
const { notifyAdmin } = require('./api/zendeskMail');


const transitContentType = 'application/transit+json';
const router = express.Router();

runCron();

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);


const jsonParser = bodyParser.json({
  type: req => req.headers['content-type'] !== transitContentType,
  verify: function(req, res, buf) {
    req.rawBody = buf.toString();
  },
});

router.use((req, res, next) => {
  if (!req.path.includes('/webhook')) {
    return next();
  }
  return jsonParser(req, res, next);
});


const storage = multer.memoryStorage(); // Store file in memory
//multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

// ================ API router endpoints: ================ //

router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);
router.post('/create-ai-listing', generateAiListing);
router.post('/create-ai-image', generateAiImage);
router.post('/fetchImageDesc', FetchImageDesc);

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);

// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/google/callback', authenticateGoogleCallback);

router.post('/checkCalenderAvailability', checkCalenderAvailability);
router.post('/calculate-distance', getLocationDistance);

// algolia
router.post('/createSearchData', createSearchData);
router.post('/updateSearchData', updateSearchData);
router.post('/deleteSearchData', deleteSearchData);

// DropBox Sign
router.post('/send-rental-agreement', sendDropBoxRentalAgreement);

router.get('/getCurrentTime', getUtcTime);

// stripe api's
router.post('/create-stripe-payment-intent', createStripeIntent);
router.post('/create-setup-intent', createStripeSetupIntent);
router.post('/initiate-stripe-refund', initiateStripeRefund);
router.post('/capture-stripe-payment-intent', captureStripeIntent);
router.post('/cancel-stripe-payment-intent', cancelStripeIntent);
router.post('/stripe-customer-cancel', customerCancelRefund);

// Stripe webhook endpoint
router.post('/webhook/stripe', stripeWebhook);

// shippo
router.post('/fetchShippingRates', getShippingRates);
router.post('/createShippingLabel', createShippingLabel);
router.post('/webhook/trackShippoOrder',trackingOrderWebhook );
router.post('/validatingAddress', validatingAddressWithShippo);
router.post('/getCarriers', getCarrierAccount);


router.post('/updateMetaDataApi', updateMetaDataApi);

// R2
router.post(
  '/cloudfare/upload-file-to-r2',
  upload.single('file'),
  // validateFileType,
  // authenticateFlexUser,
  uploadFileToR2
);

//mongoDb api for security
router.post('/addSecurityPayment', addSecurityPayment);
router.post('/updateSecurityPayment', updateSecurityPayment);
router.post('/getPendingSecurityPayments', getPendingSecurityPayments);

//mailchimp
router.post('/send-mail',sendMail)

//zendeskMail

router.post('/zendesk-mail',notifyAdmin)



module.exports = router;
