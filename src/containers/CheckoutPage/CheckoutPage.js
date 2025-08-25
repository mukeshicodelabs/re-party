import React, { useEffect, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';

// Import contexts and util modules
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { userDisplayNameAsString } from '../../util/data';
import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers';
import { isErrorNoPermissionForInitiateTransactions } from '../../util/errors';
import { INQUIRY_PROCESS_NAME, resolveLatestProcessName } from '../../transactions/transaction';

// Import global thunk functions
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { confirmCardPayment, retrievePaymentIntent } from '../../ducks/stripe.duck';
import { checkDeliveryLocation, savePaymentMethod } from '../../ducks/paymentMethods.duck';

// Import shared components
import { NamedRedirect, Page } from '../../components';

// Session helpers file needs to be imported before CheckoutPageWithPayment and CheckoutPageWithInquiryProcess
import { storeData, clearData, handlePageData } from './CheckoutPageSessionHelpers';

// Import modules from this directory
import {
  initiateOrder,
  setInitialValues,
  speculateTransaction,
  stripeCustomer,
  confirmPayment,
  sendMessage,
  initiateInquiryWithoutPayment, 
  fetchShippingRates,
  fetchShppingLineItem,
} from './CheckoutPage.duck';

import CustomTopbar from './CustomTopbar';
import CheckoutPageWithPayment, {
  loadInitialDataForStripePayments,
} from './CheckoutPageWithPayment';
import CheckoutPageWithInquiryProcess from './CheckoutPageWithInquiryProcess';

const STORAGE_KEY = 'CheckoutPage';

const onSubmitCallback = () => {
  clearData(STORAGE_KEY);
};

const getProcessName = pageData => {
  const { transaction, listing } = pageData || {};
  const processName = transaction?.id
    ? transaction?.attributes?.processName
    : listing?.id
    ? listing?.attributes?.publicData?.transactionProcessAlias?.split('/')[0]
    : null;
  return resolveLatestProcessName(processName);
};

const EnhancedCheckoutPage = props => {
  const [pageData, setPageData] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [deliveryShippingMaybe, setDeliveryShippingMaybe] = useState(null)
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();

  useEffect(() => {  
    const {
      currentUser,
      orderData, 
      transaction,
      fetchSpeculatedTransaction,
      fetchStripeCustomer,
      listing,
      pageData
    } = props; 
    const initialData = { orderData, listing, transaction };
    const data = handlePageData(initialData, STORAGE_KEY, history);  
    setPageData(data || {});
    setIsDataLoaded(true); 
    // Do not fetch extra data if user is not active (E.g. they are in pending-approval state.)
    if (isUserAuthorized(currentUser)) {
      // This is for processes using payments with Stripe integration
      if (getProcessName(data) !== INQUIRY_PROCESS_NAME) {
        // Fetch StripeCustomer and speculateTransition for transactions that include Stripe payments
        loadInitialDataForStripePayments({
          pageData: data || {},
          fetchSpeculatedTransaction,
          fetchStripeCustomer,
          config,
          selectedShippingOption
        });
      }
    }   
// setDelivery or Pickup state
    const { sellDeliveryOptions, productType } = data?.listing?.attributes?.publicData || {}; 
    if (
      productType == 'sell' &&
      sellDeliveryOptions?.length === 1 &&
      sellDeliveryOptions[0] == 'shipping'
    ) {
      setDeliveryShippingMaybe('shipping');
    }
    if (
      productType == 'sell' &&
      sellDeliveryOptions?.length === 1 &&
      sellDeliveryOptions[0] == 'pickup'
    ) {
      setDeliveryShippingMaybe('pickup');
    }
    if (
      productType == 'sell' &&
      sellDeliveryOptions?.includes('shipping') &&
      sellDeliveryOptions?.includes('pickup')
    ) {
      setDeliveryShippingMaybe(null);
    }

    // const {
    //   rentDeliveryOptions,
    //   productType, 
    //   deliveryAddressSell,
    //   sellPackageHeight,
    //   sellPackageLength,
    //   sellPackageWeight,
    //   sellPackageWidth,
    // } = listing?.attributes?.publicData || {}; 
    // const payload = 
    // {
    //   "address_from": {
    //     "name": listing?.author?.attributes?.profile?.displayName || "Sender",
    //     "street1": deliveryAddressSell?.sellShippingAddress2,
    //     "city": deliveryAddressSell?.sellShippingCity,
    //     "state": deliveryAddressSell?.sellShippingState,
    //     "zip": deliveryAddressSell?.sellShippingZipCode,
    //     "country": "US",
    //     "email": "sender@example.com"    
    //   },
    //   "address_to": { 
    //   "name":"Wilson",
    //   "organization":"Shippo",
    //   "address_line_1":"731 Market Street",
    //   "address_line_2":"#200",
    //   "city_locality":"San Francisco",
    //   "state_province":"CA",
    //   "postal_code":"94103",
    //   "country_code":"US",
    //   },
    //   "parcels": [
    //     { 
    //       "length": sellPackageLength,
    //       "width": sellPackageWidth,
    //       "height": sellPackageHeight,
    //       "distance_unit": "in",
    //       "weight": sellPackageWeight,
    //       "mass_unit": "lb"
    //     }
    //   ]
    // }   
    // Fetch Price and validating the Address for shippo 
  //  if(productType == 'sell' && rentDeliveryOptions.length === 1 && rentDeliveryOptions[0] == 'shipping' ){ props.oncheckDeliveryLocation(payload).then((res)=>{
  //     const { is_valid } = res.validation_results || false;   
  //     if(is_valid){ 
  //       onfetchPriceFromShipo(payload) 
  //     }else{
  //       console.log("address not avilable for shipo")
  //     } 
  //   })  
  // }
  }, []);

  const {
    currentUser,
    params,
    scrollingDisabled,
    speculateTransactionInProgress,
    onInquiryWithoutPayment,
    initiateOrderError,
    oncheckDeliveryLocation,
    onfetchPriceFromShipo,
    shippingRates, 
    fetchRatesError,
    fetchRatesInProgress 
  } = props;
  const processName = getProcessName(pageData);
  const isInquiryProcess = processName === INQUIRY_PROCESS_NAME;

  // Handle redirection to ListingPage, if this is own listing or if required data is not available
  const listing = pageData?.listing;
  const isOwnListing = currentUser?.id && listing?.author?.id?.uuid === currentUser?.id?.uuid;
  const hasRequiredData = !!(listing?.id && listing?.author?.id && processName);
  const shouldRedirect = isDataLoaded && !(hasRequiredData && !isOwnListing);
  const shouldRedirectUnathorizedUser = isDataLoaded && !isUserAuthorized(currentUser);
  // Redirect if the user has no transaction rights
  const shouldRedirectNoTransactionRightsUser =
    isDataLoaded &&
    // - either when they first arrive on the checkout page
    (!hasPermissionToInitiateTransactions(currentUser) ||
      // - or when they are sending the order (if the operator removed transaction rights
      // when they were already on the checkout page and the user has not refreshed the page)
      isErrorNoPermissionForInitiateTransactions(initiateOrderError));

  // Redirect back to ListingPage if data is missing.
  // Redirection must happen before any data format error is thrown (e.g. wrong currency)
  if (shouldRedirect) {
    // eslint-disable-next-line no-console
    console.error('Missing or invalid data for checkout, redirecting back to listing page.', {
      listing,
    });
    return <NamedRedirect name="ListingPage" params={params} />;
    // Redirect to NoAccessPage if access rights are missing
  } else if (shouldRedirectUnathorizedUser) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (shouldRedirectNoTransactionRightsUser) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS }}
      />
    );
  }

  const listingTitle = listing?.attributes?.title;
  const authorDisplayName = userDisplayNameAsString(listing?.author, '');
  const title = processName
    ? intl.formatMessage(
        { id: `CheckoutPage.${processName}.title` },
        { listingTitle, authorDisplayName }
      )
    : 'Checkout page is loading data';

  return processName && isInquiryProcess ? (
    <CheckoutPageWithInquiryProcess
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      processName={processName}
      pageData={pageData}
      listingTitle={listingTitle}
      title={title}
      onInquiryWithoutPayment={onInquiryWithoutPayment}
      onSubmitCallback={onSubmitCallback}
      {...props}
    />
  ) : processName && !isInquiryProcess && !speculateTransactionInProgress ? (
    <CheckoutPageWithPayment
      config={config}
      deliveryShippingMaybe={deliveryShippingMaybe}
      setDeliveryShippingMaybe={setDeliveryShippingMaybe}
      shippingRates={shippingRates} 
      fetchRatesInProgress={fetchRatesInProgress}
      fetchRatesError = {fetchRatesError}
      setSelectedShippingOption={setSelectedShippingOption}
      selectedShippingOption={selectedShippingOption}
      onfetchPriceFromShipo={onfetchPriceFromShipo}
      oncheckDeliveryLocation={oncheckDeliveryLocation}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      processName={processName}
      sessionStorageKey={STORAGE_KEY}
      pageData={pageData}
      setPageData={setPageData}
      listingTitle={listingTitle}
      title={title}
      listing={listing}
      onSubmitCallback={onSubmitCallback}
      currentUser={currentUser}
      {...props}
    />
  ) : (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <CustomTopbar intl={intl} linkToExternalSite={config?.topbar?.logoLink} />
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    listing,
    orderData,
    stripeCustomerFetched,
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    isClockInSync,
    transaction,
    initiateInquiryError,
    initiateOrderError,
    shippingRates,
    fetchRatesError,
    confirmPaymentError,
    fetchRatesInProgress
  } = state.CheckoutPage;
  const { currentUser } = state.user;
  const { confirmCardPaymentError, paymentIntent, retrievePaymentIntentError } = state.stripe;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    stripeCustomerFetched,
    orderData,
    speculateTransactionInProgress,
    speculateTransactionError,
    speculatedTransaction,
    isClockInSync,
    transaction,
    listing,
    initiateInquiryError,
    initiateOrderError,
    confirmCardPaymentError,
    confirmPaymentError,
    paymentIntent,
    shippingRates,
    fetchRatesError,
    fetchRatesInProgress,
    retrievePaymentIntentError,
  };
};

const mapDispatchToProps = dispatch => ({
  dispatch,
  fetchSpeculatedTransaction: (params, processAlias, txId, transitionName, isPrivileged) =>
    dispatch(speculateTransaction(params, processAlias, txId, transitionName, isPrivileged)),
  fetchStripeCustomer: () => dispatch(stripeCustomer()),
  onInquiryWithoutPayment: (params, processAlias, transitionName) =>
    dispatch(initiateInquiryWithoutPayment(params, processAlias, transitionName)),
  onInitiateOrder: (params, processAlias, transactionId, transitionName, isPrivileged) =>
    dispatch(initiateOrder(params, processAlias, transactionId, transitionName, isPrivileged)),
  oncheckDeliveryLocation: params => dispatch(checkDeliveryLocation(params)),
  onFetchShppingLineItem: (params, processAlias, transitionName) =>
    dispatch(fetchShppingLineItem(params, processAlias, transitionName)),
  onfetchPriceFromShipo: (params) => dispatch(fetchShippingRates(params)),
  onRetrievePaymentIntent: params => dispatch(retrievePaymentIntent(params)),
  onConfirmCardPayment: params => dispatch(confirmCardPayment(params)),
  onConfirmPayment: (transactionId, transitionName, transitionParams) =>
    dispatch(confirmPayment(transactionId, transitionName, transitionParams)),
  onSendMessage: params => dispatch(sendMessage(params)),
  onSavePaymentMethod: (stripeCustomer, stripePaymentMethodId) =>
    dispatch(savePaymentMethod(stripeCustomer, stripePaymentMethodId)),
});

const CheckoutPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedCheckoutPage);

CheckoutPage.setInitialValues = (initialValues, saveToSessionStorage = false) => {
  if (saveToSessionStorage) {
    const { listing, orderData } = initialValues;
    storeData(orderData, listing, null, STORAGE_KEY);
  }

  return setInitialValues(initialValues);
};

CheckoutPage.displayName = 'CheckoutPage';

export default CheckoutPage;
