const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const DepositIntent = require('../../models/securityPayment');
const { getISdk } = require('../../api-util/sdk');

module.exports = async () => {
  try {
    console.log('🔁 Cron started: Reauthorizing deposit intents');
    const now = moment();
    const iSdk = getISdk();

    const deposits = await DepositIntent.find({
      status: 'active',
      bookingComplete: false,
      lastAuthorizedAt: {
        $lte: now.subtract(6, 'days').toDate(),
        $gt: now.subtract(7, 'days').toDate(),
        // for testing time bw 10 - 30 mins
    //       $lte: now.subtract(10, 'minutes').toDate(), // older than 10 minutes
    // $gt: now.subtract(130, 'minutes').toDate(),
      },
    });
    console.log('deposits', deposits)

    if (deposits.length === 0) {
      console.log('✅ No deposits need reauthorization');
      return;
    }

    for (const deposit of deposits) {
      const {
        _id,
        intentId,
        amount,
        currency,
        customerId,
        paymentMethodId,
        metadata,
        txId,
        transferGroup,
        isCrossBorderPayment,
        providerStripeAccountId,
      } = deposit;

      try {
        // 1. Retrieve the old intent to check its status
        const currentIntent = await stripe.paymentIntents.retrieve(intentId);
        console.log('currentIntent.status', currentIntent.status)

        // 2. Only cancel if it's in a cancelable state
        const cancelableStatuses = [
          'requires_capture',
          'requires_confirmation',
          'requires_payment_method',
          'processing',
        ];
        if (cancelableStatuses.includes(currentIntent.status)) {
          const res = await stripe.paymentIntents.cancel(intentId, {
            cancellation_reason: 'requested_by_customer',
          });
          console.log('res', JSON.stringify(res, null, 2))
          // console.log(`✅ Canceled old intent: ${intentId}`);
        } else {
          console.warn(
            `⚠️ Old intent ${intentId} not in cancelable state: ${currentIntent.status}`
          );
          continue; // Skip reauthorization for this one
        }

        // 3. Create new intent
        const newIntentParams = {
          amount,
          currency,
          customer: customerId,
          payment_method: paymentMethodId,
          off_session: true,
          confirm: true,
          capture_method: 'manual',
          description: 'Reauthorized security deposit',
          payment_method_types: ['card'],
          metadata,
          transfer_group: transferGroup,
          on_behalf_of:  providerStripeAccountId,
          transfer_data : { destination: providerStripeAccountId }
        };
        console.log('newIntentParams', newIntentParams)

        const newIntent = await stripe.paymentIntents.create(newIntentParams);
        console.log(`✅ Created new intent: ${newIntent.id}`);

        // 4. Update transaction metadata
        await iSdk.transactions.updateMetadata({
          id: txId,
          metadata: {
            reauthorizedDeposit: {
              newIntentId: newIntent.id,
              oldIntentId: intentId,
              reauthorizedAt: new Date().toISOString(),
            },
          },
        });

        // 5. Update deposit document
        await DepositIntent.findByIdAndUpdate(_id, {
          intentId: newIntent.id,
          lastAuthorizedAt: new Date(),
        });
      } catch (err) {
        console.error(`Error processing deposit ${intentId}: ${err.message}`);
      }
    }
    console.log('✅ Cron completed');
  } catch (error) {
    console.error('Cron failed:', error.message);
  }
};
