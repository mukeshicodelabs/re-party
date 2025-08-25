// api/stripe-webhook.js
const { getISdk } = require('../../api-util/sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Main Stripe Webhook handler
 */
const stripeWebhook = async (req, res) => {
  const { id: sessionId, last_verification_report, status } = req.body ? req.body.data.object : {}
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('No Stripe signature found in headers');
    return res.status(400).send('No Stripe signature found');
  }

  const iSdk = getISdk();
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log('event type', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types you're interested in
  switch (event.type) {
    case 'identity.verification_session.verified':
      const verifiedSession = event.data.object;
      const verifiedUserId =
        verifiedSession.metadata?.userId

      try {
        // Retrive verification report from sessionId
        const verificationReport = await stripe.identity.verificationReports.retrieve(last_verification_report);

        const { files, status: verifiedStatus } = verificationReport ? verificationReport?.document : {}

        const updateResult = await iSdk.users.updateProfile({
          id: verifiedUserId,
          metadata: {
            sessionId,
            last_verification_report,
            verifiedStatus,
            files
          },
        });
      } catch (error) {
        console.error(`Failed to update user ${verifiedUserId}:`, error);
      }
      break;

    case 'identity.verification_session.requires_input':
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Always return a 200 response to acknowledge receipt of the webhook
  res.status(200).json({ received: true });
};

module.exports = { stripeWebhook };
