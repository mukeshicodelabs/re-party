// These helpers are calling this template's own server-side routes
// so, they are not directly calling Marketplace API or Integration API.
// You can find these api endpoints from 'server/api/...' directory
import appSettings from '../config/settings';
import { types as sdkTypes, transit } from './sdkLoader';
import Decimal from 'decimal.js';
export const apiBaseUrl = marketplaceRootURL => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;
  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }
  // Otherwise, use the given marketplaceRootURL parameter or the same domain and port as the frontend
  return marketplaceRootURL ? marketplaceRootURL.replace(/\/$/, '') : `${window.location.origin}`;
};
// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `server/api-util/sdk.js`
export const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sdkTypes.BigDecimal,
    customType: Decimal,
    writer: v => new sdkTypes.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];
const serialize = data => {
  return transit.write(data, { typeHandlers, verbose: appSettings.sdk.transitVerbose });
};
const deserialize = str => {
  return transit.read(str, { typeHandlers });
};
const methods = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};
// If server/api returns data from SDK, you should set Content-Type to 'application/transit+json'
const request = (path, options = {}) => {
  const url = `${apiBaseUrl()}${path}`;
  const { credentials, headers, body, ...rest } = options;
  // If headers are not set, we assume that the body should be serialized as transit format.
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;
  const bodyMaybe = shouldSerializeBody ? { body: serialize(body) } : {};
  const fetchOptions = {
    credentials: credentials || 'include',
    // Since server/api mostly talks to Marketplace API using SDK,
    // we default to 'application/transit+json' as content type (as SDK uses transit).
    headers: headers || { 'Content-Type': 'application/transit+json' },
    ...bodyMaybe,
    ...rest,
  };
  return window.fetch(url, fetchOptions).then(res => {
    const contentTypeHeader = res.headers.get('Content-Type');
    const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;
    if (res.status >= 400) {
      return res.json().then(data => {
        let e = new Error();
        e = Object.assign(e, data);
        throw e;
      });
    }
    if (contentType === 'application/transit+json') {
      return res.text().then(deserialize);
    } else if (contentType === 'application/json') {
      return res.json();
    }
    return res.text();
  });
};
// Keep the previous parameter order for the post method.
// For now, only POST has own specific function, but you can create more or use request directly.
const post = (path, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: methods.POST,
    body,
  };
  return request(path, requestOptions);
};

// GET method
const get = (path, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: methods.GET,
    body,
  };

  return request(path, requestOptions);
};

// Fetch transaction line items from the local API endpoint.
//
// See `server/api/transaction-line-items.js` to see what data should
// be sent in the body.
export const transactionLineItems = body => {
  return post('/api/transaction-line-items', body);
};
// Initiate a privileged transaction.
//
// With privileged transitions, the transactions need to be created
// from the backend. This endpoint enables sending the order data to
// the local backend, and passing that to the Marketplace API.
//
// See `server/api/initiate-privileged.js` to see what data should be
// sent in the body.
export const initiatePrivileged = body => {
  return post('/api/initiate-privileged', body);
};
// Transition a transaction with a privileged transition.
//
// This is similar to the `initiatePrivileged` above. It will use the
// backend for the transition. The backend endpoint will add the
// payment line items to the transition params.
//
// See `server/api/transition-privileged.js` to see what data should
// be sent in the body.
export const transitionPrivileged = body => {
  return post('/api/transition-privileged', body);
};
// Create user with identity provider (e.g. Facebook or Google)
//
// If loginWithIdp api call fails and user can't authenticate to Marketplace API with idp
// we will show option to create a new user with idp.
// For that user needs to confirm data fetched from the idp.
// After the confirmation, this endpoint is called to create a new user with confirmed data.
//
// See `server/api/auth/createUserWithIdp.js` to see what data should
// be sent in the body.
export const createUserWithIdp = body => {
  return post('/api/auth/create-user-with-idp', body);
};
export const createAiListing = body => {
  return post('/api/create-ai-listing', body);
};
export const generateAiImage = body => {
  return post('/api/create-ai-image', body);
};
export const checkCalenderAvailability = body => {
  return post('/api/checkCalenderAvailability', body);
};
export const onCalculateDistance = body => {
  return post('/api/calculate-distance', body);
};
// algolia
export const createSearchDataApi = body => {
  return post('/api/createSearchData', body);
};
export const updateSearchDataApi = body => {
  return post('/api/updateSearchData', body);
};
export const deleteSearchDataApi = body => {
  return post('/api/deleteSearchData', body);
};
export const getdetailsfromApi = body => {
  return post('/api/fetchImageDesc', body);
};
//dropbox sign
export const sendAgreementEmail = body => {
  return post('/api/send-rental-agreement', body);
};
// api to get utc time
export const getCurrentUtcTime = () => {
  return get('/api/getCurrentTime');
};
//// Stripe api's
export const createStripeSetupIntent = body => {
  return post('/api/create-setup-intent', body);
};
export const createDepositPaymentIntent = body => {
  return post('/api/create-stripe-payment-intent', body);
};
export const cancelStripePaymentIntent = body => {
  return post('/api/cancel-stripe-payment-intent', body);
};
export const captureStripePaymentIntent = body => {
  return post('/api/capture-stripe-payment-intent', body);
};
export const createStripeTransfer = body => {
  return post('/api/create-stripe-transfer', body);
};
export const oncustomerCancel = body => {
  return post('/api/stripe-customer-cancel', body);
};
// shippo apis
export const getShippingRates = (body) => {
  return post('/api/fetchShippingRates', body);
};
export const createShippingLabelAPI = (body) => {
  return post('/api/createShippingLabel', body);
}; 
// update TX data
export const updateMetaDataApi = body => {
  return post('/api/updateMetaDataApi', body);
};
// export const shippoWebhook = (body) => {
//   return post('/api/trackShippoOrder', body);
// };
export const validatingAddressWithShippo = (body) => {
  return post('/api/validatingAddress', body);
};
export const getCarrierAccount = (body) => {
  return post('/api/getCarriers', body);
};
export const uploadToR2 = body => {
  const options = {
    headers: {}, //send headers empty
    // 'Content-Type': 'multipart/form-data',
    // browser should set this header automatically when using FormData. Manually setting this header can cause the "Multipart: Boundary not found" error.
  };
  return post('/api/cloudfare/upload-file-to-r2', body, options);
};

// mailchimp

export const contactUsMessage = body => {
  return post('/api/send-mail',body)
}



//zendesk mail 
export const zendeskMail = body => {
  return post('/api/zendesk-mail', body);
};

