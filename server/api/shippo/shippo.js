const axios = require('axios');
const { getISdk, handleError } = require('../../api-util/sdk');
const { types } = require('sharetribe-flex-integration-sdk');
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY; 
const SHIPPO_API_URL = process.env.SHIPPO_API_URL;
const { UUID } = types;
const MARK_DELIVERED = 'transition/operator-mark-delivered';
const MARK_SHIPPED = 'transition/operator-mark-shipped';

const fetchCarrierAccounts = async (url, collectedAccounts = []) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data?.results) {
      const validCarriers = response.data.results.filter(
        carrier => Array.isArray(carrier.service_levels) && carrier.service_levels.length > 0
      );
      collectedAccounts.push(...validCarriers);
    }

    return response.data.next
      ? fetchCarrierAccounts(response.data.next, collectedAccounts)
      : collectedAccounts;
  } catch (error) {
    console.error('Error fetching carrier accounts:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  getCarrierAccount: async (req, res) => {
    try {
      const allCarrierAccounts = await fetchCarrierAccounts(
        `${SHIPPO_API_URL}/carrier_accounts?service_levels=true`
      );
      return res.status(200).json(allCarrierAccounts);
    } catch (error) {
      return res.status(500).json(error.response?.data || { message: 'Internal Server Error' });
    }
  },

  validatingAddressWithShippo: async (req, res) => {
    const { params } = req.body;
    const { name, email } = params.address_from || {};
    const { address_to } = params;
    const queryParams = new URLSearchParams({
      name: address_to?.name || '',
      organization: address_to?.organization || '',
      address_line_1: address_to?.street1 || '',
      address_line_2: address_to?.street2 || '',
      city_locality: address_to?.city || '',
      state_province: address_to?.state || '',
      postal_code: address_to?.zip || '',
      country_code: address_to?.country || 'US',
    }).toString();
    try {
      const response123 = await axios.get(
        `https://api.goshippo.com/v2/addresses/validate?${queryParams}`,
        {
          headers: {
            Authorization: `ShippoToken ${'shippo_test_fcfec3d7640ef6db29679e3d6f2b6459fd2b355c'}`,
          },
        }
      );
      const { address_line_1, city_locality, state_province, postal_code, country_code } =
        response123?.data?.original_address || {};

      const response = await axios.post(
        'https://api.goshippo.com/addresses/',
        {
          name: name,
          street1: address_line_1,
          city: city_locality,
          state: state_province,
          zip: postal_code,
          country: country_code || 'US',
          email: email,
          validate: true,
        },
        {
          headers: {
            Authorization: `ShippoToken ${'shippo_test_fcfec3d7640ef6db29679e3d6f2b6459fd2b355c'}`,
          },
        }
      );
      return res.status(200).json(response.data);
    } catch (error) {
      console.error('Error creating address:', error.response?.data || error.message);
      return res.status(500).json(error.response?.data || error.message);
    }
  },

  getShippingRates: async (req, res) => {
    const params = req?.body;
    try {
      const response = await axios.post(`${SHIPPO_API_URL}/shipments`, params, {
        headers: {
          Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      return response?.data?.rates?.length
        ? res.status(200).json(response.data.rates)
        : res.status(200).json([
            {
              message: response.data.messages[0].text || 'Failed to fetch shipping rates',
            },
          ]);
    } catch (error) {
      console.log(error || error.message);
      return res.status(500).json({
        message: error.response?.data || 'Failed to fetch shipping rates',
      });
    }
  },

  createShippingLabel: async (req, res) => {
    try {
      const { rateObject_id, orderId } = req.body;
      if (!rateObject_id) {
        return res.status(400).json({ message: 'Missing rateObject_id' });
      }
      const labelData = {
        label_file_type: 'PDF',
        rate: rateObject_id,
        async: false,
        metadata: orderId,
      };

      const response = await axios.post(`${SHIPPO_API_URL}/transactions`, labelData, {
        headers: {
          Authorization: `ShippoToken ${SHIPPO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      return res.status(200).json(response.data);
    } catch (error) {
      return res.status(500).json({
        message: error.response?.data || 'Failed to create shipping label',
      });
    }
  },

  // {
  //   [1]   event: 'track_updated',
  //   [1]   test: true,
  //   [1]   data: {
  //   [1]     address_from: { city: 'San Francisco', state: 'CA', zip: '94103', country: 'US' },
  //   [1]     address_to: { city: 'Chicago', state: 'IL', zip: '60611', country: 'US' },
  //   [1]     tracking_status: {
  //   [1]       object_created: '2025-07-30T13:40:42.548Z',
  //   [1]       object_updated: null,
  //   [1]       object_id: '6c33e913712a47088c4d8e66f942448a',
  //   [1]       status: 'DELIVERED',
  //   [1]       status_details: 'Your shipment has been delivered.',
  //   [1]       status_date: '2025-07-29T11:35:42.548Z',
  //   [1]       substatus: null,
  //   [1]       location: [Object]
  //   [1]     },
  //   [1]     tracking_number: 'SHIPPO_DELIVERED',
  //   [1]     tracking_history: [ [Object], [Object], [Object], [Object] ],
  //   [1]     carrier: 'shippo',
  //   [1]     eta: '2025-07-29T13:40:42.538Z',
  //   [1]     original_eta: '2025-07-28T13:40:42.538Z',
  //   [1]     servicelevel: { token: 'shippo_priority', name: null },
  //   [1]     metadata: 'Shippo test webhook',
  //   [1]     transaction: null,
  //   [1]     messages: [],
  //   [1]     test: true
  //   [1]   }
  //   [1] }

  // Webhook
  // trackingOrderWebhook: async (req, res) => {
  //   console.log("Called Webhookss***", req.body)
  //   const isdk =  getISdk();
  //   const updateTransition = async ({ txId, transitionName, params = {} }) => {
  //     try {
  //       const response = await isdk.transactions.transition({
  //         id: new UUID(txId),
  //         transition: transitionName,
  //         params,
  //       });
  //       return response;
  //     } catch (error) {
  //       console.error(`Error updating transition for transaction ${txId}:`, error);
  //       throw error;
  //     }
  //   };
  //   if (req.body) {
  //     try {
  //       const trackingNumber = req.body.trackingNumber;
  //       const statusCode = req.body.trackingStatus.status.toUpperCase();
  //       const orderId = req.body.metadata;
  //       let transitionName;
  //       let trackingStatus;
  //       console.log(trackingNumber, )
  //       if(!orderId){
  //         res.status(200).send('Webhook stped as there is no Tx id');
  //       }
  //       if (statusCode === 'DELIVERED') {
  //         transitionName = MARK_DELIVERED;
  //         trackingStatus = 'Delivered';
  //         await updateTransition({
  //           txId: orderId,
  //           transitionName,
  //           params: { protectedData: { isDelivered: true } },
  //         });
  //       } else if (statusCode === 'TRANSIT') {
  //         transitionName = MARK_SHIPPED;
  //         trackingStatus = 'Order Shipped';
  //         await updateTransition({
  //           txId: orderId,
  //           transitionName,
  //           params: { protectedData: { isShipped: true } },
  //         });
  //       }
  //     } catch (error) {

  //       console.error('Error in trackingOrderWebhook:', error);

  //     }
  //   } else {
  //     console.error('No data found in request body');
  //   }
  //   res.status(200).send('Webhook processed');
  // },

  trackingOrderWebhook: async (req, res) => {
    console.log('📦 Webhook received:', JSON.stringify(req.body, null, 2));
    const isdk = getISdk();

    const updateTransition = async ({ txId, transitionName, params = {} }) => {
      try {
        const response = await isdk.transactions.transition({
          id: new UUID(txId),
          transition: transitionName,
          params,
        });
        return response;
      } catch (error) {
        console.error(`❌ Failed to update transaction (${txId}):`, error.message);
        throw error;
      }
    };
    try {
      const { trackingNumber, trackingStatus, metadata: orderId } = req.body || {};
      if (!orderId) {
        console.warn('⚠️ No orderId (txId) found in webhook payload');
        return res.status(200).send('No transaction ID provided. Skipping.');
      }
      if (!trackingStatus || !trackingStatus.status) {
        console.warn('⚠️ Invalid trackingStatus in webhook payload');
        return res.status(200).send('Invalid tracking status. Skipping.');
      }
      const statusCode = trackingStatus.status.toUpperCase();
      let transitionName;
      let params = { protectedData: {} };
      switch (statusCode) {
        case 'DELIVERED':
          transitionName = MARK_DELIVERED;
          params.protectedData.isDelivered = true;
          break;
        case 'TRANSIT':
          transitionName = MARK_SHIPPED;
          params.protectedData.isShipped = true;
          break;
        default:
          console.log(`ℹ️ Status "${statusCode}" not handled.`);
          return res.status(200).send(`Status "${statusCode}" ignored.`);
      }

      await updateTransition({ txId: orderId, transitionName, params });
      console.log(`✅ Transition "${transitionName}" applied to transaction ${orderId}`);
      return res.status(200).send('Webhook processed successfully.');
    } catch (error) {
      console.error('❌ Error handling webhook:', error.message);
      return res.status(500).send('Internal server error.');
    }
  },
  // Webhook code commented out since MongoDB storage Thas been removed.
  // If needed, uncomment and remove tracking/mongo parts to make it fully active again.
};
