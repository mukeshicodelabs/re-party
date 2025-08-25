import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import loadable from '@loadable/component';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  displayDeliveryPickup,
  displayDeliveryShipping,
  displayPrice,
} from '../../util/configHelpers';
import {
  propTypes,
  AVAILABILITY_MULTIPLE_SEATS,
  LISTING_STATE_CLOSED,
  LINE_ITEM_NIGHT,
  LINE_ITEM_DAY,
  LINE_ITEM_HOUR,
  LINE_ITEM_FIXED,
  LINE_ITEM_ITEM,
  STOCK_MULTIPLE_ITEMS,
  STOCK_INFINITE_MULTIPLE_ITEMS,
  LISTING_STATE_PUBLISHED,
} from '../../util/types';
import { formatMoney } from '../../util/currency';
import { createSlug, parse, stringify } from '../../util/urlHelpers';
import { userDisplayNameAsString } from '../../util/data';
import {
  INQUIRY_PROCESS_NAME,
  getSupportedProcessesInfo,
  isBookingProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

import {
  ModalInMobile,
  PrimaryButton,
  AvatarSmall,
  H1,
  H2,
  NamedLink,
  Button,
} from '../../components';
import PriceVariantPicker from './PriceVariantPicker/PriceVariantPicker';

import css from './OrderPanel.module.css';
import BrandIconCard from '../BrandIconCard/BrandIconCard';
import moment from 'moment';

const BookingTimeForm = loadable(() =>
  import(/* webpackChunkName: "BookingTimeForm" */ './BookingTimeForm/BookingTimeForm')
);
const BookingDatesForm = loadable(() =>
  import(/* webpackChunkName: "BookingDatesForm" */ './BookingDatesForm/BookingDatesForm')
);
const BookingFixedDurationForm = loadable(() =>
  import(
    /* webpackChunkName: "BookingFixedDurationForm" */ './BookingFixedDurationForm/BookingFixedDurationForm'
  )
);
const InquiryWithoutPaymentForm = loadable(() =>
  import(
    /* webpackChunkName: "InquiryWithoutPaymentForm" */ './InquiryWithoutPaymentForm/InquiryWithoutPaymentForm'
  )
);
const ProductOrderForm = loadable(() =>
  import(/* webpackChunkName: "ProductOrderForm" */ './ProductOrderForm/ProductOrderForm')
);

// This defines when ModalInMobile shows content as Modal
const MODAL_BREAKPOINT = 1023;
const TODAY = new Date();

const isPublishedListing = listing => {
  return listing.attributes.state === LISTING_STATE_PUBLISHED;
};

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

const getCheapestPriceVariant = (priceVariants = []) => {
  return priceVariants.reduce((cheapest, current) => {
    return current.priceInSubunits < cheapest.priceInSubunits ? current : cheapest;
  }, priceVariants[0]);
};

const formatMoneyIfSupportedCurrency = (price, intl) => {
  try {
    return formatMoney(intl, price);
  } catch (e) {
    return `(${price.currency})`;
  }
};

const openOrderModal = (isOwnListing, isClosed, history, location) => {
  if (isOwnListing || isClosed) {
    window.scrollTo(0, 0);
  } else {
    const { pathname, search, state } = location;
    const searchString = `?${stringify({ ...parse(search), orderOpen: true })}`;
    history.push(`${pathname}${searchString}`, state);
  }
};

const closeOrderModal = (history, location) => {
  const { pathname, search, state } = location;
  const { orderOpen, ...searchParams } = parse(search);
  const searchString = `?${stringify(searchParams)}`;
  history.push(`${pathname}${searchString}`, state);
};

const handleSubmit = (
  isOwnListing,
  isClosed,
  isInquiryWithoutPayment,
  onSubmit,
  history,
  location
) => {
  // TODO: currently, inquiry-process does not have any form to ask more order data.
  // We can submit without opening any inquiry/order modal.
  return isInquiryWithoutPayment
    ? () => onSubmit({})
    : () => openOrderModal(isOwnListing, isClosed, history, location);
};

const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const PriceMaybe = props => {
  const {
    price,
    publicData,
    validListingTypes,
    intl,
    marketplaceCurrency,
    showCurrencyMismatch = false,
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
  return showCurrencyMismatch ? (
    <div className={css.priceContainerInCTA}>
      <div className={css.priceValueInCTA} title={priceTitle}>
        <FormattedMessage
          id="OrderPanel.priceInMobileCTA"
          values={{ priceValue: formattedPrice }}
        />
      </div>
      <div className={css.perUnitInCTA}>
        <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
      </div>
    </div>
  ) : (
    <div className={css.priceContainer}>
      <p className={css.price}>
        <FormattedMessage id="OrderPanel.price" values={{ priceValue, pricePerUnit }} />
      </p>
    </div>
  );
};

const PriceMissing = () => {
  return (
    <p className={css.error}>
      <FormattedMessage id="OrderPanel.listingPriceMissing" />
    </p>
  );
};
const InvalidCurrency = () => {
  return (
    <p className={css.error}>
      <FormattedMessage id="OrderPanel.listingCurrencyInvalid" />
    </p>
  );
};

const InvalidPriceVariants = () => {
  return (
    <p className={css.error}>
      <FormattedMessage id="OrderPanel.listingPriceVariantsAreInvalid" />
    </p>
  );
};

const hasUniqueVariants = priceVariants => {
  const priceVariantsSlugs = priceVariants?.map(variant =>
    variant.name ? createSlug(variant.name) : 'no-name'
  );
  return new Set(priceVariantsSlugs).size === priceVariants.length;
};

const hasValidPriceVariants = priceVariants => {
  const isArray = Array.isArray(priceVariants);
  const hasItems = isArray && priceVariants.length > 0;
  const variantsHaveNames = hasItems && priceVariants.every(variant => variant.name);
  const namesAreUnique = hasItems && hasUniqueVariants(priceVariants);

  return variantsHaveNames && namesAreUnique;
};

/**
 * @typedef {Object} ListingTypeConfig
 * @property {string} listingType - The type of the listing
 * @property {string} transactionType - The type of the transaction
 * @property {string} transactionType.process - The process descriptionof the transaction
 * @property {string} transactionType.alias - The alias of the transaction process
 * @property {string} transactionType.unitType - The unit type of the transaction
 */

/**
 * OrderPanel is a component that renders a panel for making bookings, purchases, or inquiries for a listing.
 * It handles different transaction processes and displays appropriate forms based on the listing type.
 *
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overwrites the default class for the root element
 * @param {string} [props.className] - Custom class that extends
 * @param {string} [props.titleClassName] - Custom class name for the title
 * @param {propTypes.listing} props.listing - The listing data (either regular or own listing)
 * @param {Array<ListingTypeConfig>} props.validListingTypes - Array of valid listing type configurations
 * @param {boolean} [props.isOwnListing=false] - Whether the listing belongs to the current user
 * @param {listingType.user|listingType.currentUser} props.author - The listing author's user data
 * @param {ReactNode} [props.authorLink] - Custom component for rendering the author link
 * @param {ReactNode} [props.payoutDetailsWarning] - Warning message about payout details
 * @param {Function} props.onSubmit - Handler for form submission
 * @param {ReactNode|string} props.title - Title of the panel
 * @param {ReactNode} [props.titleDesktop] - Alternative title for desktop view
 * @param {ReactNode|string} [props.subTitle] - Subtitle text
 * @param {Function} props.onManageDisableScrolling - Handler for managing scroll behavior
 * @param {Function} props.onFetchTimeSlots - Handler for fetching available time slots
 * @param {Object} [props.monthlyTimeSlots] - Available time slots by month
 * @param {Function} props.onFetchTransactionLineItems - Handler for fetching transaction line items
 * @param {Function} [props.onContactUser] - Handler for contacting the listing author
 * @param {Array} [props.lineItems] - Array of line items for the transaction
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {Object} [props.fetchLineItemsError] - Error object if line items fetch failed
 * @param {string} props.marketplaceCurrency - The currency used in the marketplace
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {string} props.marketplaceName - Name of the marketplace
 *
 * @returns {JSX.Element} Component that displays the order panel with appropriate form
 */
const OrderPanel = props => {
  const [mounted, setMounted] = useState(false);
  const [selectedPricingOption, setSelectedPricingOption] = useState(null);

  // State to handle Pickup or Delivery option
  const [deliveryShippingMaybe, setDeliveryShippingMaybe] = useState(null);
  // Selected Shipping option
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const intl = useIntl();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    // setDelivery or Pickup state
    const { sellDeliveryOptions, productType } = props?.listing?.attributes?.publicData || {};
    if (
      productType == 'sell' &&
      sellDeliveryOptions?.length === 1 &&
      sellDeliveryOptions[0] == 'shipping'
    ) {
      setDeliveryShippingMaybe('delivery');
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
  }, []);
  const {
    rootClassName,
    className,
    titleClassName,
    listing,
    validListingTypes,
    lineItemUnitType: lineItemUnitTypeMaybe,
    isOwnListing,
    onSubmit,
    title,
    titleDesktop,
    author,
    authorLink,
    onManageDisableScrolling,
    onFetchTimeSlots,
    monthlyTimeSlots,
    timeSlotsForDate,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    marketplaceCurrency,
    dayCountAvailableForBooking,
    marketplaceName,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    payoutDetailsWarning,
    currentUser,
    handleAddToCart,
    onCalculateDistance,
    calculatedDistance,
    calculateLocationRequest,
    listingSlug,
    listingPathParamType,
    listingTab,
    listingId,
    bookmarks = [],
    addressModal,
    setAddressModal,
    shippingRates,
    fetchRatesError,
    fetchRatesInProgress,
    config,
    userShippoAddress
  } = props;

  const publicData = listing?.attributes?.publicData || {};
  const {
    listingType,
    unitType,
    transactionProcessAlias = '',
    priceVariants,
    startTimeInterval,
    flatPrice,
    rentalPrice,
    productType,
    rentFlatPrice,
    depositFee,
    lateFee,
    deliveryPickupMethodOptions,
    sellDeliveryOptions,
  } = publicData || {};

  const isBothpicupAndShipping =
    productType == 'sell' &&
    sellDeliveryOptions?.includes('shipping') &&
    sellDeliveryOptions?.includes('pickup');

  const price = listing?.attributes?.price;

  const filteredBookmarks =
    bookmarks?.length > 0 ? bookmarks?.filter(item => item.id == listing.id.uuid) : [];

  const [selectedSetupFee, setSelectedSetupFee] = useState(
    filteredBookmarks?.length ? filteredBookmarks[0].selectedSetUpFee : null
  );

  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const lineItemUnitType = lineItemUnitTypeMaybe || `line-item/${unitType}`;

  const isPaymentProcess = processName !== INQUIRY_PROCESS_NAME;

  const showPriceMissing = isPaymentProcess && !price;
  const showInvalidCurrency = isPaymentProcess && price?.currency !== marketplaceCurrency;

  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const isClosed = listing?.attributes?.state === LISTING_STATE_CLOSED;

  const isBooking = isBookingProcess(processName);
  const shouldHaveFixedBookingDuration = isBooking && [LINE_ITEM_FIXED].includes(lineItemUnitType);
  const showBookingFixedDurationForm =
    mounted && shouldHaveFixedBookingDuration && !isClosed && timeZone && priceVariants?.length > 0;

  const shouldHaveBookingTime = isBooking && [LINE_ITEM_HOUR].includes(lineItemUnitType);
  const showBookingTimeForm = mounted && shouldHaveBookingTime && !isClosed && timeZone;

  const shouldHaveBookingDates =
    isBooking && [LINE_ITEM_DAY, LINE_ITEM_NIGHT].includes(lineItemUnitType);
  // const showBookingDatesForm = mounted && shouldHaveBookingDates && !isClosed && timeZone;
  const showBookingDatesForm = listingType !== 'sell-purchase';

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  const isPurchase = isPurchaseProcess(processName);
  const shouldHavePurchase = isPurchase && lineItemUnitType === LINE_ITEM_ITEM;
  const currentStock = listing.currentStock?.attributes?.quantity;
  const isOutOfStock = shouldHavePurchase && !isClosed && currentStock === 0;

  // Show form only when stock is fully loaded. This avoids "Out of stock" UI by
  // default before all data has been downloaded.
  const showProductOrderForm = true;
  // mounted && shouldHavePurchase && !isClosed && typeof currentStock === 'number';

  const showInquiryForm = mounted && !isClosed && processName === INQUIRY_PROCESS_NAME;

  const supportedProcessesInfo = getSupportedProcessesInfo();
  const isKnownProcess = supportedProcessesInfo.map(info => info.name).includes(processName);

  const { pickupEnabled, shippingEnabled } = listing?.attributes?.publicData || {};

  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const displayShipping = displayDeliveryShipping(listingTypeConfig);
  const displayPickup = displayDeliveryPickup(listingTypeConfig);
  const allowOrdersOfMultipleItems = [STOCK_MULTIPLE_ITEMS, STOCK_INFINITE_MULTIPLE_ITEMS].includes(
    listingTypeConfig?.stockType
  );

  const searchParams = parse(location.search);
  const isOrderOpen = !!searchParams.orderOpen;
  const preselectedPriceVariantSlug = searchParams.bookableOption;

  const seatsEnabled = [AVAILABILITY_MULTIPLE_SEATS].includes(listingTypeConfig?.availabilityType);

  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  const isPriceVariationsInUse = !!publicData?.priceVariationsEnabled;
  const preselectedPriceVariant =
    Array.isArray(priceVariants) && preselectedPriceVariantSlug && isPriceVariationsInUse
      ? priceVariants.find(pv => pv?.name && createSlug(pv?.name) === preselectedPriceVariantSlug)
      : null;

  const priceVariantsMaybe = isPriceVariationsInUse
    ? {
        isPriceVariationsInUse,
        priceVariants,
        priceVariantFieldComponent: PriceVariantPicker,
        preselectedPriceVariant,
        isPublishedListing: isPublishedListing(listing),
      }
    : !isPriceVariationsInUse && showBookingFixedDurationForm
    ? {
        isPriceVariationsInUse: false,
        priceVariants: [getCheapestPriceVariant(priceVariants)],
        priceVariantFieldComponent: PriceVariantPicker,
      }
    : {};

  const showInvalidPriceVariantsMessage =
    isPriceVariationsInUse && !hasValidPriceVariants(priceVariants);

  const sharedProps = {
    lineItemUnitType,
    onSubmit,
    price,
    marketplaceCurrency,
    listingId: listing.id,
    isOwnListing,
    marketplaceName,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    payoutDetailsWarning,
  };

  const showClosedListingHelpText = listing.id && isClosed;

  const subTitleText = showClosedListingHelpText
    ? intl.formatMessage({ id: 'OrderPanel.subTitleClosedListing' })
    : null;

  const authorDisplayName = userDisplayNameAsString(author, '');

  const classes = classNames(rootClassName || css.root, className);
  const titleClasses = classNames(titleClassName || css.orderTitle);

  const formatDate = date => {
    if (!moment(date).isValid()) {
      console.error('Invalid Moment date:', date);
      return null;
    }
    return (
      moment(date)
        .tz('Asia/Kolkata')
        .format('ddd MMM DD YYYY 00:00:00 [GMT]ZZ') + ' (India Standard Time)'
    );
  };

  useEffect(() => {
    if (filteredBookmarks && filteredBookmarks.length > 0) {
      const bookmark = filteredBookmarks[0] || {};
      if (bookmark?.productType == 'rent') {
        setFieldValues({
          deliveryMethod: bookmark.deliveryMethod || '',
          productType: bookmark?.productType,
          bookingDates: {
            startDate: formatDate(bookmark?.startDate),
            endDate: formatDate(bookmark?.endDate),
          },
          deliveryFee: bookmark?.deliveryFee,
          seats: bookmark?.seats,
          userLocation: bookmark?.userLocation,
        });
      } else {
        setFieldValues({
          quantity: bookmark?.quantity,
          productType: bookmark?.productType,
          deliveryFee: bookmark?.deliveryfee,
          deliveryMethod: bookmark.deliveryMethod || '',
          selectedrateObjectId: bookmark.selectedrateObjectId || '',
        });
      }
    }
  }, [filteredBookmarks?.length]);

  return (
    <>
      {isOwnListing && (
        <NamedLink
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
        </NamedLink>
      )}
      <div className={classes}>
        <ModalInMobile
          containerClassName={css.modalContainer}
          id="OrderFormInModal"
          isModalOpenOnMobile={isOrderOpen}
          onClose={() => closeOrderModal(history, location)}
          showAsModalMaxWidth={MODAL_BREAKPOINT}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
        >
          <div className={css.orderFormWrapper}>
            <div className={css.modalHeading}>
              <H1 className={css.heading}>{title}</H1>
            </div>

            {/* <div className={css.orderHeading}>
          {titleDesktop ? titleDesktop : <H2 className={titleClasses}>{title}</H2>}
          {subTitleText ? <div className={css.orderHelp}>{subTitleText}</div> : null}
        </div> */}

            {/* <PriceMaybe
          price={price}
          publicData={publicData}
          validListingTypes={validListingTypes}
          intl={intl}
          marketplaceCurrency={marketplaceCurrency}
        /> */}

            {/* <div className={css.author}>
          <AvatarSmall user={author} className={css.providerAvatar} />
          <span className={css.providerNameLinked}>
            <FormattedMessage id="OrderPanel.author" values={{ name: authorLink }} />
          </span>
          <span className={css.providerNamePlain}>
            <FormattedMessage id="OrderPanel.author" values={{ name: authorDisplayName }} />
          </span>
        </div> */}

            <div className={css.orderPanelWrapper}>
              {productType === 'rent' && (
                <>
                  <div className={css.rentalHeading}>Rental Window (Days) Price</div>
                  <div className={css.priceTypeToggleWrapper}>
                    {price?.amount ? (
                      <div
                        className={classNames(css.priceTypeOption, {
                          [css.selectedOption]: selectedPricingOption === price?.amount,
                        })}
                        // onClick={() =>
                        //   setSelectedPricingOption(prev =>
                        //     prev === price?.amount ? null : price?.amount
                        //   )
                        // }
                      >
                        ${price?.amount / 100}
                        <span className={css.unit}> /Per Day</span>
                      </div>
                    ) : null}

                    {rentFlatPrice ? (
                      <div
                        className={classNames(css.priceTypeOption, {
                          [css.selectedOption]: selectedPricingOption === rentFlatPrice * 100,
                        })}
                        // onClick={() =>
                        //   setSelectedPricingOption(prev =>
                        //     prev === (rentFlatPrice * 100) ? null : (rentFlatPrice * 100)
                        //   )
                        // }
                      >
                        ${rentFlatPrice}
                        <span className={css.unit}> /3 Day</span>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            <div className={css.addOns}>
              {productType === 'rent' && publicData?.setupPrice && (
                <>
                  <div className={css.addOnsHeading}>Customisable Add-Ons</div>
                  <div className={css.addOnWrapper}>
                    <label className={css.addOnLabel}>
                      <input
                        type="checkbox"
                        className={css.addOnCheckbox}
                        checked={!!selectedSetupFee}
                        onChange={() => {
                          if (selectedSetupFee) {
                            setSelectedSetupFee(null); // uncheck - clear state
                          } else {
                            setSelectedSetupFee(publicData?.setupPrice * 100); // store setup amount in subunits (e.g., 500)
                          }
                        }}
                      />
                      <span className={css.checkboxDesign}></span>
                      <div className={css.addonRow}>
                        <span className={css.addOnText}>${publicData.setupPrice}</span>
                        <span className={css.setup}>Setup</span>
                      </div>
                    </label>
                  </div>
                </>
              )}
            </div>

            {showPriceMissing ? (
              <PriceMissing />
            ) : showInvalidCurrency ? (
              <InvalidCurrency />
            ) : showInvalidPriceVariantsMessage ? (
              <InvalidPriceVariants />
            ) : showBookingFixedDurationForm ? (
              <BookingFixedDurationForm
                seatsEnabled={seatsEnabled}
                className={css.bookingForm}
                formId="OrderPanelBookingFixedDurationForm"
                dayCountAvailableForBooking={dayCountAvailableForBooking}
                monthlyTimeSlots={monthlyTimeSlots}
                timeSlotsForDate={timeSlotsForDate}
                onFetchTimeSlots={onFetchTimeSlots}
                startDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
                startTimeInterval={startTimeInterval}
                timeZone={timeZone}
                {...priceVariantsMaybe}
                {...sharedProps}
              />
            ) : showBookingTimeForm ? (
              <BookingTimeForm
                seatsEnabled={seatsEnabled}
                className={css.bookingForm}
                formId="OrderPanelBookingTimeForm"
                dayCountAvailableForBooking={dayCountAvailableForBooking}
                monthlyTimeSlots={monthlyTimeSlots}
                timeSlotsForDate={timeSlotsForDate}
                onFetchTimeSlots={onFetchTimeSlots}
                startDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
                endDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
                timeZone={timeZone}
                {...priceVariantsMaybe}
                {...sharedProps}
              />
            ) : showBookingDatesForm ? (
              <BookingDatesForm
                seatsEnabled={seatsEnabled}
                className={css.bookingForm}
                formId="OrderPanelBookingDatesForm"
                dayCountAvailableForBooking={dayCountAvailableForBooking}
                monthlyTimeSlots={monthlyTimeSlots}
                onFetchTimeSlots={onFetchTimeSlots}
                timeZone={timeZone}
                currentUser={currentUser}
                handleAddToCart={handleAddToCart}
                productType={productType}
                selectedSetupFee={selectedSetupFee}
                listing={listing}
                onCalculateDistance={onCalculateDistance}
                calculatedDistance={calculatedDistance}
                calculateLocationRequest={calculateLocationRequest}
                initialValues={fieldValues ? fieldValues : null}
                depositFee={depositFee}
                lateFee={lateFee}
                {...priceVariantsMaybe}
                {...sharedProps}
              />
            ) : showProductOrderForm ? (
              <ProductOrderForm
                openOrderModal={openOrderModal}
                closeOrderModal={closeOrderModal}
                isOwnListing={isOwnListing}
                isClosed={isClosed}
                history={history}
                location={location}
                shippingRates={shippingRates}
                fetchRatesError={fetchRatesError}
                fetchRatesInProgress={fetchRatesInProgress}
                config={config}
                addressModal={addressModal}
                listing={listing}
                setAddressModal={setAddressModal}
                setDeliveryShippingMaybe={setDeliveryShippingMaybe}
                deliveryShippingMaybe={deliveryShippingMaybe}
                deliveryPickupMethodOptions={deliveryPickupMethodOptions}
                isBothpicupAndShipping={isBothpicupAndShipping}
                formId="OrderPanelProductOrderForm"
                currentStock={currentStock}
                allowOrdersOfMultipleItems={allowOrdersOfMultipleItems}
                pickupEnabled={pickupEnabled && displayPickup}
                shippingEnabled={shippingEnabled && displayShipping}
                displayDeliveryMethod={displayPickup || displayShipping}
                onContactUser={onContactUser}
                handleAddToCart={handleAddToCart}
                productType={productType}
                currentUser={currentUser}
                initialValues={fieldValues ? fieldValues : null}
                userShippoAddress={userShippoAddress}
                onCalculateDistance={onCalculateDistance}
                calculatedDistance={calculatedDistance}
                {...sharedProps}
              />
            ) : showInquiryForm ? (
              <InquiryWithoutPaymentForm formId="OrderPanelInquiryForm" onSubmit={onSubmit} />
            ) : !isKnownProcess ? (
              <p className={css.errorSidebar}>
                <FormattedMessage id="OrderPanel.unknownTransactionProcess" />
              </p>
            ) : null}
          </div>
        </ModalInMobile>
        <div className={css.openOrderForm}>
          <PriceMaybe
            price={price}
            publicData={publicData}
            validListingTypes={validListingTypes}
            intl={intl}
            marketplaceCurrency={marketplaceCurrency}
            showCurrencyMismatch
          />

          {isClosed ? (
            <div className={css.closedListingButton}>
              <FormattedMessage id="OrderPanel.closedListingButtonText" />
            </div>
          ) : (
            <PrimaryButton
              className={css.bookButton}
              onClick={handleSubmit(
                isOwnListing,
                isClosed,
                showInquiryForm,
                onSubmit,
                history,
                location
              )}
              disabled={isOutOfStock}
            >
              {isBooking ? (
                <FormattedMessage id="OrderPanel.ctaButtonMessageBooking" />
              ) : isOutOfStock ? (
                <FormattedMessage id="OrderPanel.ctaButtonMessageNoStock" />
              ) : isPurchase ? (
                <FormattedMessage id="OrderPanel.ctaButtonMessagePurchase" />
              ) : (
                <FormattedMessage id="OrderPanel.ctaButtonMessageInquiry" />
              )}
            </PrimaryButton>
          )}
        </div>
        <div className={css.paymentSupport}>
          <div className={css.supportCard}>
            <div className={css.supportIcon}>
              <BrandIconCard type="payments" />
            </div>
            <div className={css.supportHeading}>Trusted Payments</div>
            <div className={css.supportSubHeading}>Fully encrypted and securely gated.</div>
          </div>
          <div className={css.supportCard}>
            <div className={css.supportIcon}>
              <BrandIconCard type="support" />
            </div>
            <div className={css.supportHeading}>Real Support</div>
            <div className={css.supportSubHeading}>Get help and support.</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderPanel;
