const DropboxSign = require('@dropbox/sign');
const { handleTx } = require('./transactionHelpers');

const validateRequestBody = (REQUIRED_KEYS, body) => REQUIRED_KEYS.every(key => body[key]);

const signatureApi = new DropboxSign.SignatureRequestApi();
signatureApi.username = process.env.DROPBOX_SIGN_ACCOUNT_API_KEY;

const REQUIRED_KEYS = [
  'tx_id',
  // 'renterName',
  // 'renterEmail',
  // 'hostName',
  // 'hostEmail',
  // 'aggStartDate',
  // 'aggEndDate',
  // 'cartName',
  // 'model',
];

const WEBHOOK_EVENTS = {
  SIGNED: 'signature_request_signed',
  COMPLETED: 'signature_request_all_signed',
};

const sendDropBoxRentalAgreement = async (req, res) => {
  if (!validateRequestBody(REQUIRED_KEYS, req.body)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const values = req.body;

    const customFields = REQUIRED_KEYS.map(key => ({
      name: key,
      value: values[key],
    }));

    const response = await signatureApi.signatureRequestSendWithTemplate({
      templateIds: [process.env.DROPBOX_SIGN_TEMPLATE_ID],
      clientId: process.env.DROPBOX_SIGN_APP_CLIENT_ID,
      signers: [{ role: 'Provider', name: 'provider', email_address: "hello@letsreparty.com" },
      { role: 'Customer', name: 'customer', email_address: "hello@letsreparty.com" }
      ],
      custom_fields: customFields,
      signing_options: {
        draw: true,
        type: false,
        upload: true,
        phone: false,
        default_type: 'draw',
      },
      test_mode: true,
    });

    console.log('server response', response)

    return res.status(200).json({ message: 'Agreement sent successfully', data: response.body });
  } catch (error) {
    console.log('Error sending agreement:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

const dropBoxWebhook = async (req, res) => {
  const { signature_request, event } = JSON.parse(req.body.json);
  const { event_type } = event;

  try {
    if (event_type === WEBHOOK_EVENTS.COMPLETED) {
      // signing completed
       const { custom_fields } = signature_request;
      const txId = custom_fields.find(field => field.name === 'tx_id').value;

      await handleTx(txId);
    } else if (event_type === WEBHOOK_EVENTS.SIGNED) {
      console.log('agreement signed by party')
    }
    res.status(200).send('Hello API event received');
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



module.exports = { sendDropBoxRentalAgreement, dropBoxWebhook };
