const { getISdk } = require('../../api-util/sdk');
const { denormalisedResponseEntities } = require('../../helper');

const isdk = getISdk();

const TRANSITIONS = {
  AGREEMENT_INITIATED: 'transition/agreement-sign-initiation',
  AGREEMENT_SIGNED_BY_CUSTOMER: 'transition/agreement-sign-by-customer',
  AGREEMENT_SIGNED_BY_HOST: 'transition/agreement-sign-by-host',
};

const getTransactionData = async txId => {
  try {
    const { data } = await isdk.transactions.show({ id: txId });
    return data?.data?.attributes || null;
  } catch (error) {
    console.error('Error fetching transaction data:', error?.data?.errors || error.message);
    return null;
  }
};

const determineNextTransition = lastTransition => {
  switch (lastTransition) {
    case TRANSITIONS.AGREEMENT_INITIATED:
      return TRANSITIONS.AGREEMENT_SIGNED_BY_CUSTOMER;
    // case TRANSITIONS.AGREEMENT_SIGNED_BY_RENTER:
    //   return TRANSITIONS.AGREEMENT_SIGNED_BY_HOST;
    default:
      return null;
  }
};

const makeTransition = async (txId, transition) => {
  try {
    const variantPrefix = 'default';
    const response = await isdk.transactions.transition(
      {
        id: txId,
        transition,
        params: {},
      },
      {
        include: ['customer', 'provider', 'listing', 'listing.images'],
        'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
        expand: true,
      }
    );
    console.log(`Successfully made transition: ${transition} for transaction: ${txId}`);
  } catch (error) {
    console.error('Error making transition:', error?.data?.errors || error.message);
  }
};

const handleTx = async txId => {
  try {
    const transactionData = await getTransactionData(txId);

    if (!transactionData) {
      console.warn(`Transaction data for ${txId} not found`);
      return;
    }
    const { lastTransition } = transactionData;
    console.log('Last transition:', lastTransition);

    const nextTransition = determineNextTransition(lastTransition);
    if (nextTransition) {
      await makeTransition(txId, nextTransition);
    } else {
      console.warn(`No valid transition for lastTransition: ${lastTransition}`);
    }
  } catch (error) {
    console.error('Error handling transaction:', error.message || error);
  }
};

module.exports = {
  handleTx,
};
