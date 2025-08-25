import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

// Contexts
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
// Utils
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { LISTING_STATE_PENDING_APPROVAL, LISTING_STATE_CLOSED, propTypes } from '../../util/types';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
} from '../../util/errors.js';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers.js';
import {
  ensureListing,
  ensureOwnListing,
  ensureUser,
  userDisplayNameAsString,
} from '../../util/data';
import { richText } from '../../util/richText';
import {
  isBookingProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

// Global ducks (for Redux actions and thunks)
import { getListingsById, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import { initializeCardPaymentData } from '../../ducks/stripe.duck.js';

// Shared components
import {
  H4,
  Page,
  NamedLink,
  NamedRedirect,
  OrderPanel,
  LayoutSingleColumn,
  Modal,
} from '../../components';

// Related components and modules
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import {
  sendInquiry,
  setInitialValues,
  fetchTimeSlots,
  fetchTransactionLineItems,
  getOwnListingsById,
  calculateDistance,
} from './ListingPage.duck';

import {
  LoadingPage,
  ErrorPage,
  priceData,
  listingImages,
  handleContactUser,
  handleSubmitInquiry,
  handleSubmit,
  priceForSchemaMaybe,
} from './ListingPage.shared';
import ActionBarMaybe from './ActionBarMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionReviews from './SectionReviews';
import SectionAuthorMaybe from './SectionAuthorMaybe';
import SectionMapMaybe from './SectionMapMaybe';
import SectionGallery from './SectionGallery';
import CustomListingFields from './CustomListingFields';

import css from './ListingPage.module.css';
import { updateProfile } from '../ProfileSettingsPage/ProfileSettingsPage.duck';
import RelatedListings from './RelatedListings.js';
import { displayPrice } from '../../util/configHelpers.js';
import moment from 'moment';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard.js';
import EditIcon from './EditIcon.js';
import classNames from 'classnames';
import Addaddress from './Addaddress/Addaddress.js';
import { checkDeliveryLocation } from '../../ducks/paymentMethods.duck.js';
import { fetchShippingRates } from '../CheckoutPage/CheckoutPage.duck.js';

const MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE = 16;

const { UUID } = sdkTypes;

const formatMoneyIfSupportedCurrency = (price, intl) => {
  try {
    return formatMoney(intl, price);
  } catch (e) {
    return `(${price.currency})`;
  }
};

const PriceMaybe = props => {
  const {
    price,
    publicData,
    validListingTypes,
    intl,
    marketplaceCurrency,
    showCurrencyMismatch = false,
    isBooking,
  } = props;
  const { listingType, unitType } = publicData || {};

  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  const isPriceVariationsInUse = !!publicData?.priceVariationsEnabled;
  const hasMultiplePriceVariants = publicData?.priceVariants?.length > 1;

  if (!showPrice || !price || (isPriceVariationsInUse && hasMultiplePriceVariants)) {
    return null;
  }

  // Get formatted price or currency code if the currency does not match with marketplace currency
  const { formattedPrice, priceTitle } = priceData(price, marketplaceCurrency, intl);

  const priceValue = (
    <span className={css.priceValue}>{formatMoneyIfSupportedCurrency(price, intl)}</span>
  );
  const pricePerUnit = (
    <span className={css.perUnit}>
      <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
    </span>
  );

  // TODO: In CTA, we don't have space to show proper error message for a mismatch of marketplace currency
  //       Instead, we show the currency code in place of the price
  return true ? (
    <div className={css.priceContainerInCTA}>
      <span className={css.priceValueInCTA} title={priceTitle}>
        <FormattedMessage
          id="OrderPanel.priceInMobileCTA"
          values={{ priceValue: formattedPrice }}
        />
      </span>
      <span className={css.perUnitInCTA}>
        {/* <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} /> */}
        {isBooking ? (
          <FormattedMessage id="OrderPanel.perUnitDailyPrice" />
        ) : (
          <FormattedMessage id="OrderPanel.perUnitFixedPrice" />
        )}
      </span>
    </div>
  ) : (
    <div className={css.priceContainer}>
      <p className={css.price}>
        <FormattedMessage id="OrderPanel.price" values={{ priceValue, pricePerUnit }} />
      </p>
    </div>
  );
};

export const ListingPageComponent = props => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(
    props.inquiryModalOpenForListingId === props.params.id
  );
  const [mounted, setMounted] = useState(false);
  const [checkingValidAdress, setCheckingValidAdress] = useState(false);
  const [showNotValidAddressError, setShowNotValidAddressError] = useState(null);
  // Store initial values to prefill ProductOrderForm (e.g., delivery address)
  const [userShippoAddress, setUserShippoAddressValues] = useState(null);

  // Add address Modal
  const [addressModal, setAddressModal] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    intl,
    onManageDisableScrolling,
    params: rawParams,
    location,
    scrollingDisabled,
    showListingError,
    reviews = [],
    fetchReviewsError,
    sendInquiryInProgress,
    sendInquiryError,
    history,
    callSetInitialValues,
    onSendInquiry,
    onInitializeCardPaymentData,
    config,
    routeConfiguration,
    showOwnListingsOnly,
    onUpdateProfile,
    /// related listings states
    queryParams,
    queryInProgress,
    queryListingsError,
    relatedListings,
    pagination,
    onCalculateDistance,
    calculatedDistance,
    calculateLocationRequest,
    oncheckDeliveryLocation,
    onfetchPriceFromShipo,
    shippingRates,
    fetchRatesError,
    fetchRatesInProgress,
    ...restOfProps
  } = props;

  const listingConfig = config.listing;
  const listingId = new UUID(rawParams.id);
  const isVariant = rawParams.variant != null;
  const isPendingApprovalVariant = rawParams.variant === LISTING_PAGE_PENDING_APPROVAL_VARIANT;
  const isDraftVariant = rawParams.variant === LISTING_PAGE_DRAFT_VARIANT;
  const currentListing =
    isPendingApprovalVariant || isDraftVariant || showOwnListingsOnly
      ? ensureOwnListing(getOwnListing(listingId))
      : ensureListing(getListing(listingId));
  const { isAiListing } = currentListing?.attributes?.publicData || {};
  const listingSlug = rawParams.slug || createSlug(currentListing.attributes.title || '');
  const params = { slug: listingSlug, ...rawParams };

  const listingPathParamType = isDraftVariant
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;
  const listingTab = isDraftVariant ? 'photos' : 'details';

  const isApproved =
    currentListing.id && currentListing.attributes.state !== LISTING_STATE_PENDING_APPROVAL;

  const pendingIsApproved = isPendingApprovalVariant && isApproved;

  // If a /pending-approval URL is shared, the UI requires
  // authentication and attempts to fetch the listing from own
  // listings. This will fail with 403 Forbidden if the author is
  // another user. We use this information to try to fetch the
  // public listing.
  const pendingOtherUsersListing =
    (isPendingApprovalVariant || isDraftVariant) &&
    showListingError &&
    showListingError.status === 403;
  const shouldShowPublicListingPage = pendingIsApproved || pendingOtherUsersListing;

  if (shouldShowPublicListingPage) {
    return <NamedRedirect name="ListingPage" params={params} search={location.search} />;
  }

  const topbar = <TopbarContainer />;

  if (showListingError && showListingError.status === 404) {
    // 404 listing not found
    return <NotFoundPage staticContext={props.staticContext} />;
  } else if (showListingError) {
    // Other error in fetching listing
    return <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  } else if (!currentListing.id) {
    // Still loading the listing
    return <LoadingPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} />;
  }

  const {
    description = '',
    geolocation = null,
    price = null,
    title = '',
    publicData = {},
    metadata = {},
  } = currentListing.attributes;

  const richTitle = (
    <span>
      {richText(title, {
        longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS_IN_TITLE,
        longWordClass: css.longWord,
      })}
    </span>
  );

  const authorAvailable = currentListing && currentListing.author;
  const userAndListingAuthorAvailable = !!(currentUser && authorAvailable);
  const isOwnListing =
    userAndListingAuthorAvailable && currentListing.author.id.uuid === currentUser.id.uuid;

  const {
    listingType,
    transactionProcessAlias,
    unitType,
    pickuplocation,
    listingLocation,
    productType,
    rentPickupLocation,
    rentShippingLocation,
    pickupAddressSell,
    deliveryAddressSell,
    pickupFullAddress,
  } = publicData;

  const { sellPickupAddress, sellPickupCity, sellPickupState, sellPickupZipCode } =
    pickupAddressSell || {};
  const { sellShippingAddress, sellShippingCity, sellShippingState, sellShippingZipCode } =
    deliveryAddressSell || {};

  const sellPickupLocationAddress = pickupAddressSell
    ? `${sellPickupAddress}, ${sellPickupCity}, ${sellPickupState}, ${sellPickupZipCode}`
    : `${sellPickupAddress}, ${sellPickupCity}, ${sellPickupState}, ${sellPickupZipCode}`;

  if (!(listingType && transactionProcessAlias && unitType)) {
    // Listing should always contain listingType, transactionProcessAlias and unitType)
    return (
      <ErrorPage topbar={topbar} scrollingDisabled={scrollingDisabled} intl={intl} invalidListing />
    );
  }
  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const isBooking = isBookingProcess(processName);
  const isPurchase = isPurchaseProcess(processName);
  const processType = isBooking ? 'booking' : isPurchase ? 'purchase' : 'inquiry';

  const currentAuthor = authorAvailable ? currentListing.author : null;
  const ensuredAuthor = ensureUser(currentAuthor);
  const noPayoutDetailsSetWithOwnListing =
    isOwnListing && processType !== 'inquiry' && !currentUser?.attributes?.stripeConnected;
  const payoutDetailsWarning = noPayoutDetailsSetWithOwnListing ? (
    <span className={css.payoutDetailsWarning}>
      <FormattedMessage id="ListingPage.payoutDetailsWarning" values={{ processType }} />
      <NamedLink name="StripePayoutPage">
        <FormattedMessage id="ListingPage.payoutDetailsWarningLink" />
      </NamedLink>
    </span>
  ) : null;

  // When user is banned or deleted the listing is also deleted.
  // Because listing can be never showed with banned or deleted user we don't have to provide
  // banned or deleted display names for the function
  const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');

  const { formattedPrice } = priceData(price, config.currency, intl);

  const commonParams = { params, history, routes: routeConfiguration };
  const onContactUser = handleContactUser({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    location,
    setInitialValues,
    setInquiryModalOpen,
  });
  // Note: this is for inquiry state in booking and purchase processes. Inquiry process is handled through handleSubmit.
  const onSubmitInquiry = handleSubmitInquiry({
    ...commonParams,
    getListing,
    onSendInquiry,
    setInquiryModalOpen,
  });
  const onSubmit = handleSubmit({
    ...commonParams,
    currentUser,
    callSetInitialValues,
    getListing,
    onInitializeCardPaymentData,
  });

  const handleOrderSubmit = values => {
    const isCurrentlyClosed = currentListing.attributes.state === LISTING_STATE_CLOSED;
    if (isOwnListing || isCurrentlyClosed) {
      window.scrollTo(0, 0);
    } else {
      onSubmit(values);
    }
  };

  const facebookImages = listingImages(currentListing, 'facebook');
  const twitterImages = listingImages(currentListing, 'twitter');
  const schemaImages = listingImages(
    currentListing,
    `${config.layout.listingImage.variantPrefix}-2x`
  ).map(img => img.url);
  const marketplaceName = config.marketplaceName;
  const schemaTitle = intl.formatMessage(
    { id: 'ListingPage.schemaTitle' },
    { title, price: formattedPrice, marketplaceName }
  );
  // You could add reviews, sku, etc. into page schema
  // Read more about product schema
  // https://developers.google.com/search/docs/advanced/structured-data/product
  const productURL = `${config.marketplaceRootURL}${location.pathname}${location.search}${location.hash}`;
  const currentStock = currentListing.currentStock?.attributes?.quantity || 0;
  const schemaAvailability = !currentListing.currentStock
    ? null
    : currentStock > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const availabilityMaybe = schemaAvailability ? { availability: schemaAvailability } : {};

  const handleAddToCart = values => {
    const {
      bookingDates,
      productType,
      selectedPrice,
      selectedSetUpFee,
      quantity,
      deliveryfee,
      deliveryMethod,
      seats,
      userLocation,
      selectedrateObjectId,
    } = values || {};
    const { startDate, endDate } = bookingDates || {};
    const { id: listingId } = rawParams;
    if (!isAuthenticated && listingId) {
      let localBookmarks =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('localBookmarks') &&
        window.localStorage.getItem('localBookmarks').length > 0
          ? window.localStorage.getItem('localBookmarks')
          : [];

      if (typeof localBookmarks === 'string') {
        localBookmarks =
          typeof window !== 'undefined' &&
          JSON.parse(window.localStorage.getItem('localBookmarks'));
      }

      const localIndex = localBookmarks && localBookmarks.findIndex(b => b.id == listingId);
      const hasItem = localBookmarks && localBookmarks.find(e => e.id == listingId);

      if (hasItem) {
        localBookmarks && localBookmarks.splice(localIndex, 1);
        const removedBookmarks = Array.from(new Set(localBookmarks));
        typeof window !== 'undefined' &&
          window.localStorage.setItem('localBookmarks', JSON.stringify(removedBookmarks));
      }
    }

    const bookmarks =
      (currentUser && currentUser?.attributes?.profile?.protectedData?.bookmarks) || [];

    // For rental products.
    if (productType === 'rent' && startDate && endDate) {
      const index = bookmarks.findIndex(b => {
        const startMoment = moment(b?.startDate);
        const endMoment = moment(b?.endDate);
        const dateMomentStart = moment(startDate);
        const dateMomentEnd = moment(endDate);
        return (
          b.id == listingId &&
          b?.userId == currentUser?.id?.uuid &&
          (dateMomentStart.isBetween(startMoment, endMoment, null, '[]') ||
            dateMomentEnd.isBetween(startMoment, endMoment, null, '[]'))
        );
      });

      if (index > -1) {
        bookmarks && bookmarks.splice(index, 1);
        const removedBookmarks = Array.from(new Set(bookmarks));
        const profile = {
          protectedData: {
            bookmarks: removedBookmarks,
          },
        };
        onUpdateProfile(profile);
      } else if (startDate && endDate) {
        const startDateUnix =
          typeof startDate === 'string' ? new Date(startDate).getTime() : startDate?.getTime();
        const endDateUnix =
          typeof endDate === 'string' ? new Date(endDate).getTime() : endDate?.getTime();
        const currentUserId = currentUser && currentUser.id && currentUser.id.uuid;
        bookmarks.push({
          id: listingId,
          userId: currentUserId,
          startDate: startDateUnix,
          endDate: endDateUnix,
          productType: productType,
          selectedSetUpFee: selectedSetUpFee,
          deliveryfee: deliveryfee || null, // Add delivery fee
          deliveryMethod: deliveryMethod || null, // Add delivery method
          seats: seats,
          userLocation: userLocation,
        });
        const addedBookmarks = Array.from(new Set(bookmarks));

        const profile = {
          protectedData: {
            bookmarks: addedBookmarks,
          },
        };
        onUpdateProfile(profile);
      }
    } else if (productType === 'sell') {
      const index = bookmarks.findIndex(
        b => b.id == listingId && b.productType === 'sell' && b.userId == currentUser?.id?.uuid
      );

      if (index > -1) {
        // REMOVE item
        bookmarks.splice(index, 1);
      } else {
        // ADD item
        bookmarks.push({
          id: listingId,
          quantity: quantity,
          userId: currentUser?.id?.uuid,
          productType: productType,
          deliveryfee: deliveryfee,
          selectedrateObjectId: selectedrateObjectId,
          deliveryMethod: deliveryMethod || null, // Add delivery method
        });
      }
      const profile = {
        protectedData: {
          bookmarks: bookmarks,
        },
      };
      onUpdateProfile(profile);
    }
  };
  const bookmarks =
    (currentUser && currentUser.id && currentUser?.attributes?.profile?.protectedData?.bookmarks) ||
    [];
  const localBookmarks =
    typeof window !== 'undefined' && JSON.parse(window.localStorage.getItem('localBookmarks'));
  const bookmarksArr = isAuthenticated ? bookmarks : localBookmarks;

  const handleAddAddressform = params => {
    const {
      deliveryAddressSell,
      sellPackageHeight,
      sellPackageLength,
      sellPackageWeight,
      sellPackageWidth,
      autherEmail,
      autherPhoneNumber,
    } = currentListing?.attributes?.publicData || {};
    const recipientAddressLine1 = params?.Street_address || '';
    const recipientAddressLine2 = params?.Postal_code || '';
    const recipientStreet = `${recipientAddressLine1} ${recipientAddressLine2 || ''}`.trim();
  // Save for ProductOrderForm initial values so it can react to provided address
    if (params?.city && recipientStreet && params?.state && params?.Postal_code) {
      setUserShippoAddressValues({
        apt: params?.Apt,
        deliveryAddress: recipientStreet,
        city: params?.city,
        state: params?.state,
        zip: params?.Postal_code,
        // country: params?.country || 'US',
      });
    }
   
    const payload = {
      address_from: {
        name: currentListing?.author?.attributes?.profile?.displayName || 'Sender',
        street1: deliveryAddressSell?.sellShippingAddress,
        city: deliveryAddressSell?.sellShippingCity,
        state: deliveryAddressSell?.sellShippingState,
        zip: deliveryAddressSell?.sellShippingZipCode,
        country: 'US',
        email: autherEmail || 'sender@yopmail.com',
        phone: autherPhoneNumber || '555-123-4567',
      },
      address_to: {
        name: params?.name || 'Customer',
        organization: 'Shippo',
        street1: recipientStreet,
        city: params?.city,
        state: params?.state,
        zip: params?.Postal_code,
        country: params?.country || 'US',
      },
      parcels: [
        {
          length: sellPackageLength,
          width: sellPackageWidth,
          height: sellPackageHeight,
          distance_unit: 'in',
          weight: sellPackageWeight,
          mass_unit: 'lb',
        },
      ],
    };
    setCheckingValidAdress(true);
    oncheckDeliveryLocation(payload)
      .then(res => {
        setShowNotValidAddressError(null);
        const { is_valid } = res.validation_results || false;
        setCheckingValidAdress(false);
        if (is_valid) {
          setAddressModal(false);
          onfetchPriceFromShipo(payload);
        } else {
          setShowNotValidAddressError('address not avilable for shipo');
        }
      })
      .catch(e => {
        setCheckingValidAdress(false);
        setShowNotValidAddressError('address not avilable for shipo');
      });
  };

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      author={authorDisplayName}
      description={description}
      facebookImages={facebookImages}
      twitterImages={twitterImages}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'Product',
        description: description,
        name: schemaTitle,
        image: schemaImages,
        offers: {
          '@type': 'Offer',
          url: productURL,
          ...priceForSchemaMaybe(price),
          ...availabilityMaybe,
        },
      }}
    >
      <LayoutSingleColumn className={css.pageRoot} topbar={topbar} footer={<FooterContainer />}>
        <div className={css.contentWrapperForProductLayout}>
          <div className={css.mainWidthCover}>
            <div className={css.listingHero}>
              {mounted && currentListing.id && noPayoutDetailsSetWithOwnListing ? (
                <ActionBarMaybe
                  className={css.actionBarForProductLayout}
                  isOwnListing={isOwnListing}
                  listing={currentListing}
                  showNoPayoutDetailsSet={noPayoutDetailsSetWithOwnListing}
                  currentUser={currentUser}
                />
              ) : null}
              {mounted && currentListing.id ? (
                <ActionBarMaybe
                  className={css.actionBarForProductLayout}
                  isOwnListing={isOwnListing}
                  listing={currentListing}
                  currentUser={currentUser}
                  editParams={{
                    id: listingId.uuid,
                    slug: listingSlug,
                    type: listingPathParamType,
                    tab: listingTab,
                  }}
                />
              ) : null}
              <SectionGallery
                listing={currentListing}
                variantPrefix={config.layout.listingImage.variantPrefix}
              />
            </div>
            {/* {isOwnListing && <NamedLink
              className={classNames(css.editLink)}
              name="EditListingPage"
              params={{
                id: listingId.uuid,
                slug: listingSlug,
                type: listingPathParamType,
                tab: listingTab,
              }}
            >
              <BrandIconCard type="editlisting" />
             Edit Your Listing
            </NamedLink>} */}
            <div className={css.mainListingRow}>
              <div className={css.mainColumnForProductLayout}>
                <div className={css.mobileHeading}>
                  <H4 as="h1" className={css.orderPanelTitle}>
                    <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                  </H4>
                </div>

                <div className={css.listingHeading}>
                  <SectionTextMaybe showAsIngress heading={title} location={pickupFullAddress} />
                </div>

                <div className={css.priceWrapper}>
                  <PriceMaybe
                    price={price}
                    publicData={publicData}
                    validListingTypes={config.listing.listingTypes}
                    intl={intl}
                    marketplaceCurrency={config.currency}
                    isBooking={isBooking}
                  />
                </div>

                <div className={css.contactDetails}>
                  <SectionAuthorMaybe
                    title={title}
                    listing={currentListing}
                    authorDisplayName={authorDisplayName}
                    onContactUser={onContactUser}
                    isInquiryModalOpen={isAuthenticated && inquiryModalOpen}
                    onCloseInquiryModal={() => setInquiryModalOpen(false)}
                    sendInquiryError={sendInquiryError}
                    sendInquiryInProgress={sendInquiryInProgress}
                    onSubmitInquiry={onSubmitInquiry}
                    currentUser={currentUser}
                    onManageDisableScrolling={onManageDisableScrolling}
                  />
                </div>

                {description ? <pre className={css.listingDescription}>{description}</pre> : null}

                <div className={css.listingDetails}>
                  <CustomListingFields
                    publicData={publicData}
                    metadata={metadata}
                    listingFieldConfigs={listingConfig.listingFields}
                    categoryConfiguration={config.categoryConfiguration}
                    intl={intl}
                    config={config}
                  />
                </div>

                <div className={css.listingMap}>
                  <SectionMapMaybe
                    geolocation={geolocation}
                    publicData={publicData}
                    listingId={currentListing.id}
                    mapsConfig={config.maps}
                  />
                </div>

                <SectionReviews reviews={reviews} fetchReviewsError={fetchReviewsError} />
              </div>

              <div className={css.orderColumnForProductLayout}>
                <OrderPanel
                  config={config}
                  userShippoAddress={userShippoAddress}
                  shippingRates={shippingRates}
                  fetchRatesError={fetchRatesError}
                  fetchRatesInProgress={fetchRatesInProgress}
                  addressModal={addressModal}
                  setAddressModal={setAddressModal}
                  className={css.productOrderPanel}
                  listing={currentListing}
                  isOwnListing={isOwnListing}
                  currentUser={currentUser}
                  onSubmit={handleOrderSubmit}
                  authorLink={
                    <NamedLink
                      className={css.authorNameLink}
                      name={isVariant ? 'ListingPageVariant' : 'ListingPage'}
                      params={params}
                      to={{ hash: '#author' }}
                    >
                      {authorDisplayName}
                    </NamedLink>
                  }
                  title={
                    <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                  }
                  titleDesktop={
                    <H4 as="h1" className={css.orderPanelTitle}>
                      <FormattedMessage id="ListingPage.orderTitle" values={{ title: richTitle }} />
                    </H4>
                  }
                  payoutDetailsWarning={payoutDetailsWarning}
                  author={ensuredAuthor}
                  onManageDisableScrolling={onManageDisableScrolling}
                  onContactUser={onContactUser}
                  {...restOfProps}
                  validListingTypes={config.listing.listingTypes}
                  marketplaceCurrency={config.currency}
                  dayCountAvailableForBooking={config.stripe.dayCountAvailableForBooking}
                  marketplaceName={config.marketplaceName}
                  handleAddToCart={handleAddToCart}
                  calculatedDistance={calculatedDistance}
                  onCalculateDistance={onCalculateDistance}
                  calculateLocationRequest={calculateLocationRequest}
                  listingSlug={listingSlug}
                  listingPathParamType={listingPathParamType}
                  listingTab={listingTab}
                  listingId={listingId}
                  bookmarks={bookmarksArr}
                />
              </div>
            </div>
            <div className={css.relatedCards}>
              <RelatedListings
                listings={relatedListings}
                onUpdateProfile={onUpdateProfile}
                authorName={authorDisplayName}
                intl={intl}
                currentUser={currentUser}
                inProgress={queryInProgress}
                error={queryListingsError}
                pagination={pagination}
              />
            </div>
          </div>
          <div className={css.addressModalWrapper}>
            {/* Modal Add address */}
            <Modal
              className={css.listingAIModal}
              isOpen={addressModal}
              onClose={() => setAddressModal(false)}
              onManageDisableScrolling={onManageDisableScrolling}
            >
              <div className={css.aiModal}>
                <Addaddress
                  config={config}
                  showNotValidAddressError={showNotValidAddressError}
                  checkingValidAdress={checkingValidAdress}
                  onSubmit={handleAddAddressform}
                  inProgress={false}
                />
              </div>
            </Modal>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

/**
 * The ListingPage component with carousel layout.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.params - The path params object
 * @param {string} props.params.id - The listing id
 * @param {string} props.params.slug - The listing slug
 * @param {LISTING_PAGE_DRAFT_VARIANT | LISTING_PAGE_PENDING_APPROVAL_VARIANT} props.params.variant - The listing variant
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Function} props.getListing - The get listing function
 * @param {Function} props.getOwnListing - The get own listing function
 * @param {Object} props.currentUser - The current user
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled
 * @param {string} props.inquiryModalOpenForListingId - The inquiry modal open for the specific listing id
 * @param {propTypes.error} props.showListingError - The show listing error
 * @param {Function} props.callSetInitialValues - The call setInitialValues function, which is given to this function as a parameter
 * @param {Array<propTypes.review>} props.reviews - The reviews
 * @param {propTypes.error} props.fetchReviewsError - The fetch reviews error
 * @param {Object<string, Object>} props.monthlyTimeSlots - The monthly time slots. E.g. { '2019-11': { timeSlots: [], fetchTimeSlotsInProgress: false, fetchTimeSlotsError: null } }
 * @param {Object<string, Object>} props.timeSlotsForDate - The time slots for date. E.g. { '2019-11-01': { timeSlots: [], fetchedAt: 1572566400000, fetchTimeSlotsError: null, fetchTimeSlotsInProgress: false } }
 * @param {boolean} props.sendInquiryInProgress - Whether the send inquiry is in progress
 * @param {propTypes.error} props.sendInquiryError - The send inquiry error
 * @param {Function} props.onSendInquiry - The on send inquiry function
 * @param {Function} props.onInitializeCardPaymentData - The on initialize card payment data function
 * @param {Function} props.onFetchTimeSlots - The on fetch time slots function
 * @param {Function} props.onFetchTransactionLineItems - The on fetch transaction line items function
 * @param {Array<propTypes.transactionLineItem>} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether the fetch line items is in progress
 * @param {propTypes.error} props.fetchLineItemsError - The fetch line items error
 * @returns {JSX.Element} listing page component
 */
const EnhancedListingPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  const showListingError = props.showListingError;
  const isVariant = props.params?.variant != null;
  const currentUser = props.currentUser;
  if (isForbiddenError(showListingError) && !isVariant && !currentUser) {
    // This can happen if private marketplace mode is active
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const hasUserPendingApprovalError = isErrorUserPendingApproval(showListingError);

  if ((isPrivateMarketplace && isUnauthorizedUser) || hasUserPendingApprovalError) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (
    (hasNoViewingRights && isForbiddenError(showListingError)) ||
    isErrorNoViewingPermission(showListingError)
  ) {
    // If the user has no viewing rights, fetching anything but their own listings
    // will return a 403 error. If that happens, redirect to NoAccessPage.
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  }

  return (
    <ListingPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      showOwnListingsOnly={hasNoViewingRights}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  const { isAuthenticated } = state.auth;
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots,
    timeSlotsForDate,
    sendInquiryInProgress,
    sendInquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    inquiryModalOpenForListingId,
    /// related listings states
    queryParams,
    queryInProgress,
    queryListingsError,
    currentPageResultIds,
    pagination,
    calculatedDistance,
    calculateLocationRequest,
  } = state.ListingPage;

  const { currentUser } = state.user;
  const { shippingRates, fetchRatesError, fetchRatesInProgress } = state.CheckoutPage;

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const relatedListings = getListingsById(state, currentPageResultIds);

  return {
    shippingRates,
    fetchRatesError,
    fetchRatesInProgress,
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    scrollingDisabled: isScrollingDisabled(state),
    inquiryModalOpenForListingId,
    showListingError,
    reviews,
    fetchReviewsError,
    monthlyTimeSlots, // for OrderPanel
    timeSlotsForDate, // for OrderPanel
    lineItems, // for OrderPanel
    fetchLineItemsInProgress, // for OrderPanel
    fetchLineItemsError, // for OrderPanel
    sendInquiryInProgress,
    sendInquiryError,
    /// related listings states
    queryParams,
    queryInProgress,
    queryListingsError,
    relatedListings,
    pagination,
    calculatedDistance,
    calculateLocationRequest,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onFetchTransactionLineItems: params => dispatch(fetchTransactionLineItems(params)), // for OrderPanel
  onSendInquiry: (listing, message) => dispatch(sendInquiry(listing, message)),
  onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
  oncheckDeliveryLocation: params => dispatch(checkDeliveryLocation(params)),
  onfetchPriceFromShipo: params => dispatch(fetchShippingRates(params)),
  onFetchTimeSlots: (listingId, start, end, timeZone, options) =>
    dispatch(fetchTimeSlots(listingId, start, end, timeZone, options)), // for OrderPanel
  onUpdateProfile: data => dispatch(updateProfile(data)),
  onCalculateDistance: (listingLocation, userLocation) =>
    dispatch(calculateDistance(listingLocation, userLocation)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const ListingPage = compose(connect(mapStateToProps, mapDispatchToProps))(EnhancedListingPage);

export default ListingPage;
