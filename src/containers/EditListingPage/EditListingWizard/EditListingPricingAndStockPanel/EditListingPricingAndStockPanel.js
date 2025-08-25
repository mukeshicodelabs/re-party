import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import axios from 'axios';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, STOCK_INFINITE_ITEMS, propTypes } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { isValidCurrencyForTransactionProcess } from '../../../../util/fieldHelpers';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingAndStockForm from './EditListingPricingAndStockForm';
import css from './EditListingPricingAndStockPanel.module.css';
import { getDefaultTimeZoneOnBrowser } from '../../../../util/dates';
import { isFullDay } from '../../../../transactions/transaction';
import Swal from 'sweetalert2';
import { deliveryRanges, States } from '../../../../util/constants';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const { Money } = sdkTypes;
const BILLIARD = 1000000000000000;

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};
const geocodeAddress = async (address) => {
  if (!address) throw new Error('Address is required for geocoding');

  try {
    const encodedAddress = encodeURIComponent(address);
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}`;

    const response = await axios.get(geocodingUrl);
    const features = response?.data?.features || [];

    if (features.length > 0 && features[0].center?.length === 2) {
      const [lng, lat] = features[0].center;
      return { lat, lng };
    } else {
      throw new Error(`No geocode result found for address: ${address}`);
    }
  } catch (error) {
    console.error("Geocoding error:", error.message);
    throw error;
  }
};

export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const rotateDays = (days, startOfWeek) => {
  return startOfWeek === 0 ? days : days.slice(startOfWeek).concat(days.slice(0, startOfWeek));
};

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

// Create initial entry mapping for form's initial values
const createEntryDayGroups = (entries = {}) => {
  // Collect info about which days are active in the availability plan form:
  let activePlanDays = [];
  return entries.reduce((groupedEntries, entry) => {
    const { startTime, endTime: endHour, dayOfWeek } = entry;
    const dayGroup = groupedEntries[dayOfWeek] || [];
    activePlanDays = activePlanDays.includes(dayOfWeek)
      ? activePlanDays
      : [...activePlanDays, dayOfWeek];
    return {
      ...groupedEntries,
      [dayOfWeek]: [
        ...dayGroup,
        {
          startTime,
          endTime: endHour === '00:00' ? '24:00' : endHour,
        },
      ],
      activePlanDays,
    };
  }, {});
};

const createInitialValues = availabilityPlan => {
  const { timezone, entries } = availabilityPlan || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
    activePlanDays: WEEKDAYS,
  };
};

const defaultAvailabilityPlan = {
  type: 'availability-plan/time',
  timezone: defaultTimeZone(),
  entries: [
    { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
    { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 1 },
  ],
};

const getInitialValues = props => {
  const { listing, listingTypes } = props;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const price = listing?.attributes?.price;
  const currentStock = listing?.currentStock;

  const { geolocation } = listing?.attributes || {};
  const publicData = listing?.attributes?.publicData;
  const {
    rentFlatPrice,
    rentStock,
    setupPrice,
    lateFee,
    depositFee,
    rentCustomAddOns,
    deliveryMethod,
    rentDeliveryOptions,
    rentalpickupAddress,
    rentaldeliveryAddress,
    deliveryFee,
    rentDeliveryAddressOption,
    rentPickupLocation,
    sellPickupLocation,
    sellShippingLocation,
    rentShippingLocation,
    sellDeliveryOptions,
    // sellProductDimensions,
    sellPackageHeight,
    sellPackageLength,
    sellPackageWeight,
    sellPackageWidth,
    sellShippingOptions,
    pickupAddressSell,
    deliveryAddressSell,
    customShippingAddressSell,
    customSellShippingLocation,
    geolocationRentshipping,
    geolocationRentpickup,
    shippingBoxSize,
    customSellShippingOption,
    customSellShippingFee
  } = publicData || {};
  const { sellPickupAddress, sellPickupCity, sellPickupState, sellPickupZipCode } =
    pickupAddressSell || {};
 
// const transformed = deliveryFee.reduce((acc, { range, rangeFee }) => {
//   if (range && typeof rangeFee === 'number') {
//     acc[range] = {
//       rangeFee:new Money(rangeFee*100,"USD")
//     };
//   }
//   return acc;
// }, {});

 const deliveryFeeAsMoney = Array.isArray(deliveryFee)
    ? deliveryFee?.reduce((acc, item) => {
      const { range, rangeFee } = item || {};
      const { amount, currency } = rangeFee || {};

      if (range && amount != null && currency) {
        acc[range] = {
          rangeFee: new Money(amount, currency),
        };
      }

      return acc;
    }, {})
    : {};
 const customSellShippingFeeAsMoney = Array.isArray(customSellShippingFee)
    ? customSellShippingFee?.reduce((acc, item) => {
      const { range, rangeFee } = item || {};
      const { amount, currency } = rangeFee || {};

      if (range && amount != null && currency) {
        acc[range] = {
          rangeFee: new Money(amount, currency),
        };
      }

      return acc;
    }, {})
    : {};

 
  const {
    rentPickupAddress,
    rentPickupAddress2,
    rentPickupCity,
    rentPickupState,
    rentPickupZipCode,
  } = rentalpickupAddress || {};
  const {
    sellShippingAddress,
    sellPickupAddress2,
    sellShippingCity,
    sellShippingState,
    sellShippingZipCode,
    sellShippingAddress2
  } = deliveryAddressSell || {};
  const{
    customSellShippingAddress,
    customSellShippingCity,
    customSellShippingState,
    customSellShippingZipCode,
    customSellShippingotherInfo
  }=customShippingAddressSell||{};
 
   const { rentShippingAddress, rentShippingCity, rentShippingState, rentShippingZipCode } =
    rentaldeliveryAddress || {};
   // Initialize rentPickupLocation with all necessary fields
  const rentPickupLocationInitial = rentPickupLocation?.selectedPlace?.address ? {
    search: rentPickupLocation.search || '',
    predictions: rentPickupLocation.predictions || [],
    selectedPlace: rentPickupLocation.selectedPlace ? {
      address: rentPickupLocation.selectedPlace.address || '',
      origin: rentPickupLocation.selectedPlace.origin || null,
      bounds: rentPickupLocation.selectedPlace.bounds || null,
      fullAddress: rentPickupLocation.selectedPlace.fullAddress || '',
      street: rentPickupAddress || rentPickupLocation.selectedPlace.street,
      postcode: rentPickupZipCode || rentPickupLocation.selectedPlace.postcode,
      city:rentPickupCity || rentPickupLocation.selectedPlace.city,
      state: rentPickupLocation.selectedPlace.state||'',
      country: rentPickupLocation.selectedPlace.country || "United States"
    } : null
  } : null;
const sellPickupLocationInitial = sellPickupLocation?.selectedPlace?.address ? {
    search: sellPickupLocation.search || '',
    predictions: sellPickupLocation.predictions || [],
    selectedPlace: sellPickupLocation.selectedPlace ? {
      address: sellPickupLocation.selectedPlace.address || '',
      origin: sellPickupLocation.selectedPlace.origin || null,
      bounds: sellPickupLocation.selectedPlace.bounds || null,
      fullAddress: sellPickupLocation.selectedPlace.fullAddress || '',
      street: sellPickupAddress || sellPickupLocation.selectedPlace.street ,
      postcode: sellPickupZipCode || sellPickupLocation.selectedPlace.postcode,
      city: sellPickupCity || sellPickupLocation.selectedPlace.city,
      state: sellPickupLocation.selectedPlace.state||'',
      country: sellPickupLocation.selectedPlace.country || "United States"
    } : null
  } : null;
  const {
    selectedPlace: {
      address: pickupAddress,
      origin: pickupOrigin
    } = {}
  } = rentPickupLocationInitial || {};

// Initialize rentShippingLocation with all necessary fields
  const rentShippingLocationInitial = rentShippingLocation?.selectedPlace?.address ? {
    search: rentShippingLocation.search || '',
    predictions: rentShippingLocation.predictions || [],
    selectedPlace: rentShippingLocation.selectedPlace ? {
      address:rentShippingLocation.selectedPlace.address ||'' ,
      origin: rentShippingLocation.selectedPlace.origin || null,
      bounds: rentShippingLocation.selectedPlace.bounds || null,
      fullAddress: rentShippingLocation.selectedPlace.fullAddress || '',
      street: rentShippingAddress || rentShippingLocation.selectedPlace.street,
      postcode:rentShippingZipCode || rentShippingLocation.selectedPlace.postcode ,
      city: rentShippingCity || rentShippingLocation.selectedPlace.city ,
      state:rentShippingLocation.selectedPlace.state ||'',
      country: rentShippingLocation.selectedPlace.country || "United States"
    } : null
  } : null;

  const sellShippingLocationInitial = sellShippingLocation?.selectedPlace?.address ? {
    search: sellShippingLocation.search || '',
    predictions: sellShippingLocation.predictions || [],
    selectedPlace: sellShippingLocation.selectedPlace ? {
      address:sellShippingLocation.selectedPlace.address||'' ,
      origin: sellShippingLocation.selectedPlace.origin || null,
      bounds: sellShippingLocation.selectedPlace.bounds || null,
      fullAddress: sellShippingLocation.selectedPlace.fullAddress || '',
      street: sellShippingAddress || sellShippingLocation.selectedPlace.street ,
      postcode:sellShippingZipCode || sellShippingLocation.selectedPlace.postcode,
      city: sellShippingCity || sellShippingLocation.selectedPlace.city,
      state: sellShippingLocation.selectedPlace.state ||'',
      country: sellShippingLocation.selectedPlace.country || "United States"
    } : null
  } : null;

   const customSellShippingLocationInitial = customSellShippingLocation?.selectedPlace?.address ? {
    search: customSellShippingLocation.search || '',
    predictions: customSellShippingLocation.predictions || [],
    selectedPlace: customSellShippingLocation.selectedPlace ? {
      address:customSellShippingLocation.selectedPlace.address||'' ,
      origin: customSellShippingLocation.selectedPlace.origin || null,
      bounds: customSellShippingLocation.selectedPlace.bounds || null,
      fullAddress: customSellShippingLocation.selectedPlace.fullAddress || '',
      street: customSellShippingAddress || customSellShippingLocation.selectedPlace.street ,
      postcode:customSellShippingZipCode || customSellShippingLocation.selectedPlace.postcode,
      city: customSellShippingCity || customSellShippingLocation.selectedPlace.city,
      state: customSellShippingLocation.selectedPlace.state ||'',
      country: customSellShippingLocation.selectedPlace.country || "United States"
    } : null
  } : null;

  const {
    selectedPlace: {
      address: shippingAddress,
      origin: shippingOrigin
    } = {}
  } = rentShippingLocationInitial || {};
 
 

  const rentPrice = price;
  const sellPrice = price;
  const updateRentFlatRate = rentFlatPrice ? new Money(rentFlatPrice * 100, 'USD') : null;

  const depositFeeAsMoney = depositFee ? new Money(depositFee * 100, 'USD') : null;
  const lateFeeAsMoney = lateFee ? new Money(lateFee * 100, 'USD') : null;
  const setupPriceAsMoney = setupPrice ? new Money(setupPrice * 100, 'USD') : null;
  // Convert deliveryFee array into nested object structure


  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);
  const listingAvailabilityPlan = props?.listing?.availabilityPlan || defaultAvailabilityPlan;
  const availabilityPlan = createInitialValues(listingAvailabilityPlan);

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  // Note: infinite stock is refilled to billiard using "stockUpdateMaybe"
  const currentStockQuantity = currentStock?.attributes?.quantity;
  const stock =
    currentStockQuantity != null
      ? currentStockQuantity
      : isPublished
      ? 0
      : hasInfiniteStock
      ? BILLIARD
      : 1;
  const stockTypeInfinity = [];

  return {
    rentPrice,
    sellPrice,
    sellStock: stock,
    sellDeliveryOptions,
    // sellProductDimensions,
    rentFlatPrice: updateRentFlatRate,
    rentStock,
    rentSetupPrice: setupPriceAsMoney,
    rentLateFee: lateFeeAsMoney,
    rentDepositFee: depositFeeAsMoney,
    rentCustomAddOns,
    rentDeliveryOptions,
    rentPickupAddress,
    rentPickupAddress2,
    rentPickupCity,
    rentPickupState,
    rentPickupZipCode,
    rentShippingAddress,
    rentShippingCity,
    rentShippingState,
    rentShippingZipCode,
    rentDeliveryAddressOption,
    sellPackageHeight,
    sellPackageLength,
    sellPackageWeight,
    sellPackageWidth,
    shippingBoxSize,
    sellShippingOptions,
    sellPickupAddress,
    sellPickupCity,
    sellPickupState,
    sellPickupZipCode,
    sellShippingAddress,
    sellPickupAddress2,
    sellShippingCity,
    sellShippingState,
    sellShippingZipCode,
    sellShippingAddress2,
    rentPickupLocation: rentPickupLocationInitial,
    rentShippingLocation: rentShippingLocationInitial,
    sellPickupLocation:sellPickupLocationInitial,
    sellShippingLocation:sellShippingLocationInitial,
    rentDelivery:deliveryFeeAsMoney,
    customSellShippingAddress,
    customSellShippingCity,
    customSellShippingState,
    customSellShippingZipCode,
    customSellShippingAddress2:customSellShippingotherInfo,
    customSellShippingLocation:customSellShippingLocationInitial,
    customSellShippingOption,
    customSellShippingFee: customSellShippingFeeAsMoney,


  //  listingLocation: listingLocation
  //     ? {
  //       search: listingLocation?.address,
  //       selectedPlace: {
  //         address: listingLocation.address,
  //         origin: geolocation,
  //       },
  //     }
  //     : { search: undefined },
    // price,
    // stock,
    // stockTypeInfinity,
    // availabilityPlan,
    // customAddOns,
    // tags,
    // category,
    // event_type,
    // select_color,
    // theme_style,
    // deliveryZipCode,
    // flatPrice: flatPriceAsMoney,
    // lateFee: lateFeeAsMoney,
    // pickupFee: pickupFeeAsMoney,
    // rentalPrice: rentalPriceAsMoney,
    // depositFee: depositFeeAsMoney,
    // setupPrice: setupPriceAsMoney,
    // delivery: deliveryFeeAsMoney,
    // salePrice: salePriceMoney,
    // deliveryOptions,
    // packageWidth,
    // packageLength,
    // packageHeight,
    // packageWeight,
    // pickuplocation: pickuplocation
    //   ? {
    //     search: pickuplocation?.address,

    //   }
    //   : { search: undefined },

    // listingLocation: listingLocation
    //   ? {
    //     search: listingLocation?.address,
    //     selectedPlace: {
    //       address: listingLocation.address,
    //       origin: geolocation,
    //     },
    //   }
    //   : { search: undefined },
    // pickupAddress,
    // pickupCity,
    // pickupState,
    // pickupZipCode,
    // pickupAddress2,
    // shippingOptions,
    // shippingAddress,
    // shippingCity,
    // shippingState,
    // shippingZipCode,
    // shippingAddress2,
    // productDimensions
  };
};

/**
 * The EditListingPricingAndStockPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {Array<propTypes.listingType>} props.listingTypes - The listing types
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.errors - The errors object
 * @returns {JSX.Element}
 */
const EditListingPricingAndStockPanel = props => {
  // State is needed since re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props) });
  const [notValidAddress, setNotValidAddress] = useState(false); 
  const [validatingAddress, setValidatingAddress] = useState(false);  
  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    listingTypes,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    config,
    params,
    locationSearch,
    monthlyExceptionQueries,
    weeklyExceptionQueries,
    allExceptions,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onFetchExceptions,
    onManageDisableScrolling,
    routeConfiguration,
    history,
    prevButton,
    oncheckDeliveryLocation, 
  } = props;

  const { productType } = listing?.attributes?.publicData || {}; 
  
  const classes = classNames(rootClassName || css.root, className);
  const initialValues = state.initialValues;

  // Form needs to know data from listingType
  const publicData = listing?.attributes?.publicData;
  const unitType = publicData.unitType;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const transactionProcessAlias = listingTypeConfig?.transactionType.alias;

  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);

  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  // Don't render the form if the assigned currency is different from the marketplace currency
  // or if transaction process is incompatible with selected currency
  const isStripeCompatibleCurrency = isValidCurrencyForTransactionProcess(
    transactionProcessAlias,
    marketplaceCurrency,
    'stripe'
  );
  const priceCurrencyValid = !isStripeCompatibleCurrency
    ? false
    : marketplaceCurrency && initialValues.price instanceof Money
    ? initialValues.price?.currency === marketplaceCurrency
    : !!marketplaceCurrency;

  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isEditExceptionsModalOpen, setIsEditExceptionsModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [customeAv, setCustomeAv] = useState(null);
  const sortedAvailabilityExceptions = allExceptions;
  const firstDayOfWeek = config.localization.firstDayOfWeek;
  const listingAttributes = listing?.attributes;
  const useFullDays = isFullDay(unitType);
  const hasAvailabilityPlan = !!listingAttributes?.availabilityPlan;
  const availabilityPlan = customeAv?.availabilityPlan || defaultAvailabilityPlan;

  useEffect(() => {
    if (listing.id.uuid && !customeAv?.availabilityPlan) {
      const availabilityPlan = listingAttributes?.availabilityPlan || defaultAvailabilityPlan;
      setCustomeAv({ availabilityPlan });
    }
  }, [listing]);

  // Save exception click handler
  const saveException = values => {
    const { availability, exceptionStartTime, exceptionEndTime, exceptionRange } = values;

    // TODO: add proper seat handling
    const seats = availability === 'available' ? 1 : 0;

    // Exception date/time range is given through FieldDateRangeInput or
    // separate time fields.
    const range = useFullDays
      ? {
          start: exceptionRange?.startDate,
          end: exceptionRange?.endDate,
        }
      : {
          start: timestampToDate(exceptionStartTime),
          end: timestampToDate(exceptionEndTime),
        };

    const params = {
      listingId: listing.id,
      seats,
      ...range,
    };

    return onAddAvailabilityException(params)
      .then(() => {
        setIsEditExceptionsModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const createEntriesFromSubmitValues = values =>
    WEEKDAYS.reduce((allEntries, dayOfWeek) => {
      const dayValues = values[dayOfWeek] || [];
      const dayEntries = dayValues.map(dayValue => {
        const { startTime, endTime, seats } = dayValue;
        // Note: This template doesn't support seats yet.
        return startTime && endTime
          ? {
              dayOfWeek,
              seats: seats ?? 1,
              startTime,
              endTime: endTime === '24:00' ? '00:00' : endTime,
            }
          : null;
      });

      return allEntries.concat(dayEntries.filter(e => !!e));
    }, []);

  const createAvailabilityPlan = (values = {}) => ({
    availabilityPlan: {
      type: 'availability-plan/time',
      timezone: values?.timezone,
      entries: createEntriesFromSubmitValues(values),
    },
  });

  const handleAvailabilitySubmit = values => {
    setValuesFromLastSubmit(values);
    const availability = createAvailabilityPlan(values);
    setCustomeAv(availability || defaultAvailabilityPlan);
    setIsEditPlanModalOpen(false);
  };
  const intialAvailabilityPlan = createInitialValues(
    listing?.availabilityPlan || defaultAvailabilityPlan
  );
  const getFieldMissingError = message => {
    Swal.fire({
      toast: true,
      position: 'top-end', // 'top-end' is better for toasts
      icon: 'error',
      text: message || 'Oops, something is missing',
      showConfirmButton: false,
      timer: 3000, // Closes after 5 seconds
      timerProgressBar: true,
      didOpen: toast => {
        // Change timer progress bar color to red
        const progressBar = toast.querySelector('.swal2-timer-progress-bar');
        if (progressBar) {
          progressBar.style.backgroundColor = 'red';
        }
      },
    });
  };

  // --- ZIP code validation helper ---
  function isValidZipCode(value) {
    if (typeof value !== 'string') return false;
    const zip = value.trim();
    // Allow only 5 digits OR 9 digits with no dash
    return /^[0-9]{5}$/.test(zip) || /^[0-9]{9}$/.test(zip);
  }
 
 
  return (
    <div className={classes}>
      <H3 className={css.headingName}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingPricingAndStockPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPricingAndStockPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <div className={css.subHeading}>
        <FormattedMessage id="EditListingPricingAndStockPanel.createListingsubHeading" />
      </div>
      {/* {priceCurrencyValid ? ( */}
      <EditListingPricingAndStockForm
        notValidAddress={notValidAddress}
        validatingAddress={validatingAddress}
        className={css.form}
        initialValues={initialValues} 
        prevButton={prevButton}
        productType={productType}
        onSubmit={async (values) => {
          const {
            sellPrice,
            sellPackageWidth,
            sellPackageLength,
            sellPackageHeight,
            sellPackageWeight,
            sellShippingOptions,
            sellShippingAddress,
            sellPickupAddress2,
            sellShippingCity,
            sellShippingState,
            sellShippingZipCode,
            sellStock,
            sellDeliveryOptions,
            sellPickupAddress,
            sellPickupCity,
            sellPickupState,
            sellPickupZipCode,
            sellProductDimensions,
            sellShippingAddress2,
            availabilityPlan,
            rentPrice,
            rentFlatPrice,
            rentStock,
            rentCustomAddOns,
            rentSetupPrice,
            rentLateFee,
            rentDepositFee,
            rentDeliveryOptions,
            rentPickupLocation,
            rentPickupAddress,
            rentPickupCity,
            rentPickupState,
            rentPickupZipCode,
            rentPickupAddress2,
            rentDeliveryAddressOption,
            rentShippingLocation,
            rentShippingAddress,
            rentShippingCity,
            rentShippingState,
            rentShippingZipCode,
            rentDelivery,
            stockTypeInfinity,
            shippingBoxSize,
            sellPickupLocation,
            sellShippingLocation,
            customSellShippingFee,
            customSellShippingAddress,
            customSellShippingCity,
            customSellShippingState,
            customSellShippingZipCode,
            customSellShippingAddress2,
            customSellShippingOption,
            customSellShippingLocation
          } = values;

    const customformattedSellShipping = Object.entries(customSellShippingFee || {}).map(([key, value]) => ({
            range: key,
            rangeFee: { amount: value?.rangeFee?.amount, currency: value?.rangeFee?.currency },
          }));

          const formattedDelivery = Object.entries(rentDelivery || {}).map(([key, value]) => ({
            range: key,
            rangeFee: { amount: value?.rangeFee?.amount, currency: value?.rangeFee?.currency },
          }));
          // Geocode  addresses 
          const rentPickupFullAddress = `${rentPickupAddress}, ${rentPickupCity}, ${rentPickupState}, ${rentPickupZipCode}, United States`;
          const sellPickupFullAddress = `${sellPickupAddress},${sellPickupCity},${sellPickupState},${sellPickupZipCode}, United States`;

          let listingCoords = null;

          if (
            (productType === 'rent' && rentDeliveryOptions?.includes('pickup')) ||
            (productType === 'sell' && sellDeliveryOptions?.includes('pickup'))
          ) {
            listingCoords = await geocodeAddress(
              productType === 'rent' ? rentPickupFullAddress : sellPickupFullAddress
            );
          }

          const rentalpickupAddress = {
            rentPickupAddress: rentPickupAddress,
            rentPickupCity: rentPickupCity,
            rentPickupState: rentPickupState,
            rentPickupZipCode: rentPickupZipCode,
            rentPickupAddress2: rentPickupAddress2,
          };

          const rentaldeliveryAddress = {
            rentShippingAddress:
              productType == 'rent' && rentDeliveryAddressOption == 'sameAsPickupAddress'
                ? rentPickupAddress
                : rentShippingAddress,
            rentShippingCity:
              productType == 'rent' && rentDeliveryAddressOption == 'sameAsPickupAddress'
                ? rentPickupCity
                : rentShippingCity,
            rentShippingState:
              productType == 'rent' && rentDeliveryAddressOption == 'sameAsPickupAddress'
                ? rentPickupState
                : rentShippingState,
            rentShippingZipCode:
              productType == 'rent' && rentDeliveryAddressOption == 'sameAsPickupAddress'
                ? rentPickupZipCode
                : rentShippingZipCode,
          };

          const pickupAddressSell = {
            sellPickupAddress,
            sellPickupCity,
            sellPickupState,
            sellPickupZipCode,
          };
          const isRentPickupAddressAvailable =
            rentPickupAddress && rentPickupCity && rentPickupState && rentPickupZipCode;
          const isRentDeliveryAddresAvailable =
            rentShippingAddress && rentShippingCity && rentShippingState && rentShippingZipCode;
          const isSellPickupAddressAvailable =
            sellPickupAddress && sellPickupCity && sellPickupState && sellPickupZipCode;
          const isSellDeliveryAddressAvailable =
            sellShippingAddress && sellShippingCity && sellShippingState && sellShippingZipCode;
          const isCustomSellDeliveryAddressAvailable =
            customSellShippingAddress && customSellShippingCity && customSellShippingState && customSellShippingZipCode;

          const deliveryAddressSell = {
            sellShippingAddress:
              productType == 'sell' && sellShippingOptions == 'sameAsPickupAddress'
                ? sellPickupAddress
                : sellShippingAddress,
            sellShippingAddress2:
              productType == 'sell' && sellShippingOptions == 'sameAsPickupAddress'
                ? sellPickupAddress2
                : sellShippingAddress2,
            sellShippingCity:
              productType == 'sell' && sellShippingOptions == 'sameAsPickupAddress'
                ? sellPickupCity
                : sellShippingCity,
            sellShippingState:
              productType == 'sell' && sellShippingOptions == 'sameAsPickupAddress'
                ? sellPickupState
                : sellShippingState,
            sellShippingZipCode:
              productType == 'sell' && sellShippingOptions == 'sameAsPickupAddress'
                ? sellPickupZipCode
                : sellShippingZipCode,
          };

          const customShippingAddressSell = {
            customSellShippingAddress:
              productType == 'sell' && customSellShippingOption == 'sameAsPickupAddress'
                ? sellPickupAddress
                : customSellShippingAddress,
            customSellShippingotherInfo:
              productType == 'sell' && customSellShippingOption == 'sameAsPickupAddress'
                ? sellPickupAddress2
                : customSellShippingAddress2,
            customSellShippingCity:
              productType == 'sell' && customSellShippingOption == 'sameAsPickupAddress'
                ? sellPickupCity
                : customSellShippingCity,
            customSellShippingState:
              productType == 'sell' && customSellShippingOption == 'sameAsPickupAddress'
                ? sellPickupState
                : customSellShippingState,
            customSellShippingZipCode:
              productType == 'sell' && customSellShippingOption == 'sameAsPickupAddress'
                ? sellPickupZipCode
                : customSellShippingZipCode,
          };
          //  const updatedPickupFullAddress = productType === "rent" ?`${rentPickupAddress}, ${rentPickupCity}, ${rentPickupState}, ${rentPickupZipCode}`||`${rentShippingAddress},${rentShippingCity},${rentShippingState},${rentShippingZipCode}`: `${sellPickupAddress}, ${sellPickupCity}, ${sellPickupState}, ${sellPickupZipCode}`||`${sellShippingAddress}, ${sellShippingCity}, ${sellShippingState}, ${sellShippingZipCode}`;

          const updatedPickupFullAddress =
            productType === 'rent'
              ? isRentPickupAddressAvailable
                ? `${rentPickupCity}, ${rentPickupState}, ${rentPickupZipCode}`
                : isRentDeliveryAddresAvailable
                ? `${rentShippingCity}, ${rentShippingState}, ${rentShippingZipCode}`
                : null
              : productType === 'sell'
              ? isSellPickupAddressAvailable
                ? `${sellPickupCity}, ${sellPickupState}, ${sellPickupZipCode}`
                : isSellDeliveryAddressAvailable
                ? `${sellShippingCity}, ${sellShippingState}, ${sellShippingZipCode}`
                    : isCustomSellDeliveryAddressAvailable ? `${customSellShippingCity}, ${customSellShippingState}, ${customSellShippingZipCode}` : null
                : null;
          const updatedListingFullAddress =
            productType === 'rent'
              ? isRentPickupAddressAvailable
                ? `${rentPickupAddress}, ${rentPickupCity}, ${rentPickupState}, ${rentPickupZipCode}`
                : isRentDeliveryAddresAvailable
                ? `${rentShippingAddress}, ${rentShippingCity}, ${rentShippingState}, ${rentShippingZipCode}`
                : null
              : productType === 'sell'
              ? isSellPickupAddressAvailable
                ? `${sellPickupAddress}, ${sellPickupCity}, ${sellPickupState}, ${sellPickupZipCode}`
                : isSellDeliveryAddressAvailable
                ? `${sellShippingAddress}, ${sellShippingCity}, ${sellShippingState}, ${sellShippingZipCode}`
                : null
              : null;

          // Update stock only if the value has changed, or stock is infinity in stockType,
          // but not current stock is a small number (might happen with old listings)
          // NOTE: this is going to be used on a separate call to API
          // in EditListingPage.duck.js: sdk.stock.compareAndSet();

          const hasStockTypeInfinityChecked = stockTypeInfinity?.[0] === 'infinity';
          const hasNoCurrentStock = listing?.currentStock?.attributes?.quantity == null;
          const hasStockQuantityChanged = sellStock && sellStock !== initialValues.sellStock;
          // currentStockQuantity is null or undefined, return null - otherwise use the value
          const oldTotal = hasNoCurrentStock ? null : initialValues.sellStock;
          const stockUpdateMaybe =
            hasInfiniteStock && (hasNoCurrentStock || hasStockTypeInfinityChecked)
              ? {
                  stockUpdate: {
                    oldTotal,
                    newTotal: BILLIARD,
                  },
                }
              : hasNoCurrentStock || hasStockQuantityChanged
              ? {
                  stockUpdate: {
                    oldTotal,
                    newTotal: sellStock,
                  },
                }
              : {};

          const customizeAvaliablity =
            publicData?.productType === 'rent' &&
            !props?.listing?.availabilityPlan &&
            customeAv?.availabilityPlan
              ? {
                  availabilityPlan: Object.assign(customeAv.availabilityPlan,{
                   entries: customeAv.availabilityPlan.entries.map((st)=> ({...st,seats:rentStock}))
                  }),
                }
              : {};
          const rentShippingLocationAddress =
            rentShippingLocation?.selectedPlace?.address || rentShippingLocation?.search || null;
          const rentPickupLocationAddress =
            rentPickupLocation?.selectedPlace?.address || rentPickupLocation?.search || null;
          const rentPickupLocationOrigin =
            rentPickupLocation?.selectedPlace?.origin || rentPickupLocation?.origin || null;
          const rentShippingLocationOrigin =
            rentShippingLocation?.selectedPlace?.origin || rentShippingLocation?.origin || null;
          // New values for listing attributes
          const updateValues = {
            price: productType == 'rent' ? rentPrice : sellPrice,
            ...stockUpdateMaybe,
            ...customizeAvaliablity,
            geolocation: productType =='rent'? (rentPickupLocation?.selectedPlace?.origin||rentShippingLocation?.selectedPlace?.origin):(sellPickupLocation?.selectedPlace?.origin || sellShippingLocation?.selectedPlace?.origin||customSellShippingLocation?.selectedPlace?.origin) || null,
            publicData: {
              sellDeliveryOptions: productType == 'sell' ? sellDeliveryOptions : null,
              rentStock: productType == 'rent' ? rentStock : null,
              sellPackageWidth: productType == 'sell' ? (shippingBoxSize ? parseFloat(shippingBoxSize.split('x')[1]) : sellPackageWidth) : null,
              sellPackageLength: productType == 'sell' ? (shippingBoxSize ? parseFloat(shippingBoxSize.split('x')[0]) : sellPackageLength) : null,
              sellPackageHeight: productType == 'sell' ? (shippingBoxSize ? parseFloat(shippingBoxSize.split('x')[2]) : sellPackageHeight) : null,

              rentPickupLocation: productType == 'rent' &&  rentDeliveryOptions?.includes('pickup')? {
                search: rentPickupLocation?.search,
                predictions: rentPickupLocation?.predictions || [],
                selectedPlace: rentPickupLocation?.selectedPlace ? {
                  address: rentPickupLocation?.selectedPlace?.address,
                  origin: rentPickupLocation?.selectedPlace?.origin,
                  bounds: rentPickupLocation?.selectedPlace?.bounds,
                  fullAddress: rentPickupLocation?.selectedPlace?.fullAddress,
                  street: rentPickupLocation?.selectedPlace?.street,
                  postcode: rentPickupLocation?.selectedPlace?.postcode,
                  city: rentPickupLocation?.selectedPlace?.city,
                  state: rentPickupLocation?.selectedPlace?.state,
                  country: rentPickupLocation?.selectedPlace?.country
                } : null
              } : null,
              rentShippingLocation: productType == 'rent' && rentDeliveryOptions?.includes('shipping') ? {
                search: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.search : rentShippingLocation?.search,
                predictions: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.predictions : rentShippingLocation?.predictions || [],
                selectedPlace: rentDeliveryAddressOption == 'sameAsPickupAddress' || rentShippingLocation?.selectedPlace ? {
                  address: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.address : rentShippingLocation?.selectedPlace?.address,
                  origin: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.origin : rentShippingLocation?.selectedPlace?.origin,
                  bounds: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.bounds : rentShippingLocation?.selectedPlace?.bounds,
                  fullAddress: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.fullAddress : rentShippingLocation?.selectedPlace?.fullAddress,
                  street: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.street : rentShippingLocation?.selectedPlace?.street,
                  postcode: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.postcode : rentShippingLocation?.selectedPlace?.postcode,
                  city: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.city : rentShippingLocation?.selectedPlace?.city,
                  state: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.state : rentShippingLocation?.selectedPlace?.state,
                  country: rentDeliveryAddressOption == 'sameAsPickupAddress' ? rentPickupLocation?.selectedPlace?.country : rentShippingLocation?.selectedPlace?.country
                } : null
              } : null,
              sellPickupLocation: productType == 'sell' && sellDeliveryOptions?.includes('pickup') ? {
                search: sellPickupLocation?.search,
                predictions: sellPickupLocation?.predictions || [],
                selectedPlace: sellPickupLocation?.selectedPlace ? {
                  address: sellPickupLocation?.selectedPlace?.address,
                  origin: sellPickupLocation?.selectedPlace?.origin,
                  bounds: sellPickupLocation?.selectedPlace?.bounds,
                  fullAddress: sellPickupLocation?.selectedPlace?.fullAddress,
                  street: sellPickupLocation?.selectedPlace?.street,
                  postcode: sellPickupLocation?.selectedPlace?.postcode,
                  city: sellPickupLocation?.selectedPlace?.city,
                  state: sellPickupLocation?.selectedPlace?.state,
                  country: sellPickupLocation?.selectedPlace?.country
                } : null
              } : null,
              customSellShippingLocation: productType == 'sell' && sellDeliveryOptions?.includes('customShipping') ? {
                search: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.search : customSellShippingLocation?.search,
                predictions: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.predictions : customSellShippingLocation?.predictions || [],
                selectedPlace: customSellShippingOption != 'addNewAddress' || customSellShippingLocation?.selectedPlace ? {
                  address: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.address : customSellShippingLocation?.selectedPlace?.address,
                  origin: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.origin : customSellShippingLocation?.selectedPlace?.origin,
                  bounds: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.bounds : customSellShippingLocation?.selectedPlace?.bounds,
                  fullAddress: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.fullAddress : customSellShippingLocation?.selectedPlace?.fullAddress,
                  street: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.street : customSellShippingLocation?.selectedPlace?.street,
                  postcode: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.postcode : customSellShippingLocation?.selectedPlace?.postcode,
                  city: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.city : customSellShippingLocation?.selectedPlace?.city,
                  state: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.state : customSellShippingLocation?.selectedPlace?.state,
                  country: customSellShippingOption != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.country : customSellShippingLocation?.selectedPlace?.country
                } : {},
              } : null,
             
                customSellShippingOption: productType == 'sell' && sellDeliveryOptions?.includes('customShipping') ? customSellShippingOption:null,
              sellShippingLocation: productType == 'sell' && sellDeliveryOptions?.includes('shipping') ? {
                search: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.search : sellShippingLocation?.search,
                predictions: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.predictions : sellShippingLocation?.predictions || [],
                selectedPlace: sellShippingOptions != 'addNewAddress' || sellShippingLocation?.selectedPlace ? {
                  address: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.address : sellShippingLocation?.selectedPlace?.address,
                  origin: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.origin : sellShippingLocation?.selectedPlace?.origin,
                  bounds: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.bounds : sellShippingLocation?.selectedPlace?.bounds,
                  fullAddress: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.fullAddress : sellShippingLocation?.selectedPlace?.fullAddress,
                  street: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.street : sellShippingLocation?.selectedPlace?.street,
                  postcode: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.postcode : sellShippingLocation?.selectedPlace?.postcode,
                  city: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.city : sellShippingLocation?.selectedPlace?.city,
                  state: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.state : sellShippingLocation?.selectedPlace?.state,
                  country: sellShippingOptions != 'addNewAddress' ? sellPickupLocation?.selectedPlace?.country : sellShippingLocation?.selectedPlace?.country
                } : null
              } : null,
              sellPackageWeight: productType == 'sell' ? parseFloat(sellPackageWeight) : null,
              shippingBoxSize: productType == 'sell' ? shippingBoxSize: null,
              rentFlatPrice:
                rentFlatPrice && productType == 'rent' ? rentFlatPrice?.amount / 100 : null,
              deliveryFee: formattedDelivery && productType == 'rent' ? formattedDelivery : null,
              customSellShippingFee: productType == 'sell' && sellDeliveryOptions?.includes('customShipping') ? customformattedSellShipping:null,
              setupPrice:
                rentSetupPrice && productType == 'rent' ? rentSetupPrice?.amount / 100 : null,
              lateFee: rentLateFee && productType == 'rent' ? rentLateFee?.amount / 100 : null,
              depositFee:
                rentDepositFee && productType == 'rent' ? rentDepositFee.amount / 100 : null,
              rentDeliveryOptions: productType == 'rent' ? rentDeliveryOptions : null,
              rentDeliveryAddressOption: productType == 'rent' ? rentDeliveryAddressOption : null,
              // rentShippingLocation,
              // rentShippingLocation:
              //   rentShippingLocationAddress || rentDeliveryAddressOption == 'sameAsPickupAddress'
              //     ? {
              //         address:
              //           productType == 'rent' && rentDeliveryAddressOption == 'sameAsPickupAddress'
              //             ? rentPickupLocationAddress
              //             : rentShippingLocationAddress,
              //       }
              //     : null,
              // rentPickupLocation:
              //   productType == 'rent' && rentPickupLocationAddress
              //     ? { address: rentPickupLocationAddress }
              //     : null,
              // sellProductDimensions,
              sellShippingOptions: productType == 'sell' ? sellShippingOptions : null,
              rentCustomAddOns: productType == 'rent' ? rentCustomAddOns : null,
              rentalpickupAddress:
                productType == 'rent' && rentalpickupAddress ? rentalpickupAddress : null,
              rentaldeliveryAddress:
                productType == 'rent' && rentaldeliveryAddress ? rentaldeliveryAddress : null,
              pickupAddressSell:
                productType == 'sell' && pickupAddressSell ? pickupAddressSell : null,
              deliveryAddressSell:
                productType == 'sell' && deliveryAddressSell ? deliveryAddressSell : null,
              customShippingAddressSell: productType == 'sell' && sellDeliveryOptions?.includes('customShipping') ? customShippingAddressSell : null,
              pickupFullAddress: updatedPickupFullAddress,
              listingLocation: updatedListingFullAddress,
            },
          };
          
          if (rentPickupLocationOrigin) {
            updateValues.publicData.geolocationRentpickup =
              productType == 'rent' ? rentPickupLocationOrigin : null;
          }
          if (rentShippingLocationOrigin) {
            updateValues.publicData.geolocationRentshipping =
              productType == 'rent' ? rentShippingLocationOrigin : null;
          }
          if (productType === 'rent' || productType === 'sell') {
            if (productType === 'sell') {
              if (!sellPrice) {
                return getFieldMissingError('Sale Price is missing');
              }
              if (sellPrice?.amount <= 0) {
                return getFieldMissingError('Sale Price cannot be $0.00.');
              }
              if (!sellStock || sellStock <= 0) {
                return getFieldMissingError('Stock should be at least one');
              }
              if (!sellDeliveryOptions || sellDeliveryOptions.length === 0) {
                return getFieldMissingError('Delivery Method is missing');
              }
              if (sellDeliveryOptions.includes('pickup')) {
                if (!sellPickupAddress) return getFieldMissingError('Pickup Address is missing');
                if (!sellPickupCity) return getFieldMissingError('Pickup City is missing');
                if (!sellPickupState) return getFieldMissingError('Pickup State is missing');
                if (!sellPickupZipCode) return getFieldMissingError('Pickup Zip Code is missing');
                if (!isValidZipCode(sellPickupZipCode))
                  return getFieldMissingError('Enter a valid Pickup ZIP code');
              }
              if (sellDeliveryOptions.includes('shipping')) {
                if (!sellShippingOptions) return getFieldMissingError('Shipping Option is missing');
                if (sellShippingOptions === 'addNewAddress') {
                  if(!sellShippingLocation?.selectedPlace?.address && sellShippingOptions != 'addNewAddress') return ('Shipping Location is missing')
                  if (!sellShippingAddress)
                    return getFieldMissingError('Shipping Address is missing');
                  if (!sellShippingCity) return getFieldMissingError('Shipping City is missing');
                  if (!sellShippingState) return getFieldMissingError('Shipping State is missing');
                  if (!sellShippingZipCode || String(sellShippingZipCode).trim() === '')
                    return getFieldMissingError('Shipping Zip Code is missing');
                  if (!isValidZipCode(sellShippingZipCode))
                    return getFieldMissingError('Enter a valid Shipping  ZIP code');
                }
                // if (sellProductDimensions) {
                // if (!sellPackageWidth) return getFieldMissingError('Package Width is missing');
                // if (!sellPackageLength) return getFieldMissingError('Package Length is missing');
                // if (!sellPackageHeight) return getFieldMissingError('Package Height is missing');
                if(!shippingBoxSize || shippingBoxSize?.length==0)return getFieldMissingError('Shipping box size is missing');
                if (!sellPackageWeight) return getFieldMissingError('Package Weight is missing');
                // }
              }
              if (sellDeliveryOptions.includes('customShipping')) {

                if (!customSellShippingLocation?.selectedPlace?.address && customSellShippingOption === 'addNewAddress') return getFieldMissingError('Custom Shipping Location is missing')
                if (!customSellShippingOption) return getFieldMissingError('Custom Shipping Option is missing');
                if (customSellShippingOption === 'addNewAddress') {
                  if (!customSellShippingLocation && !customSellShippingLocation?.selectedPlace?.address && customSellShippingOption != 'addNewAddress') return ('Shipping Location is missing')
                  if (!customSellShippingAddress)
                    return getFieldMissingError('Custom Shipping Address is missing');
                  if (!customSellShippingCity) return getFieldMissingError('Shipping City is missing');
                  if (!customSellShippingState) return getFieldMissingError('Shipping State is missing');
                  if (!customSellShippingZipCode || String(customSellShippingZipCode).trim() === '')
                    return getFieldMissingError('Custom Shipping Zip Code is missing');
                  if (!isValidZipCode(customSellShippingZipCode))
                    return getFieldMissingError('Enter a valid CustomShipping  ZIP code');
                }

                const requiredRanges = ['0_10', '11_20', '21_40', '41_plus'];
                const rangeLabelMap = deliveryRanges.reduce((acc, range) => {
                  acc[range.key] = range.label;
                  return acc;
                }, {});

                let hasValidRange = false;
                let invalidRanges = [];

                requiredRanges.forEach(range => {
                  const rangeData = customSellShippingFee?.[range];
                  const amount = rangeData?.rangeFee?.amount;

                  if (rangeData && rangeData.rangeFee && typeof amount === 'number') {
                    if (amount >= 100) {
                      hasValidRange = true;
                    } else {
                      invalidRanges.push(rangeLabelMap[range]);
                    }
                  }
                });

                // 1. No valid delivery range at all
                if (!hasValidRange) {
                  return getFieldMissingError(
                    `At least one valid Shipping fee (minimum $1.00) is required for any range`
                  );
                }

                // 2. There are invalid ranges even if one is valid
                if (invalidRanges.length > 0) {
                  return getFieldMissingError(
                    `Enter amount minimum $1.00 for: ${invalidRanges.join(', ')}`
                  );
                }
              }
            }
            if (productType === 'rent') {
              if (!rentPrice) {
                return getFieldMissingError('Rental Price (Daily Rate) is missing');
              }
              if (rentPrice?.amount <= 0) {
                return getFieldMissingError('Rental Price cannot be $0.00.');
              }
              if (rentFlatPrice) {
                if (rentFlatPrice?.amount <=0) {
                  return getFieldMissingError('Flat Price cannot be $0.00.');
                }
              }
              if (!rentStock || rentStock <= 0) {
                return getFieldMissingError('Stock should be at least one');
              }

              if (rentCustomAddOns && rentCustomAddOns.length > 0) {
                if (rentCustomAddOns.includes('setUpFee')) {
                  if (!rentSetupPrice) return getFieldMissingError('Setup Fee is missing');
                  if (rentSetupPrice?.amount <=0)
                    return getFieldMissingError('Setup Fee cannot be $0.00.');
                }
                if (rentCustomAddOns.includes('lateFee')) {
                  if (!rentLateFee) return getFieldMissingError('Late Return Fee is missing');
                  if (rentLateFee?.amount <=0)
                    return getFieldMissingError('Late Return Fee cannot be $0.00.');
                }
                if (rentCustomAddOns.includes('deposit')) {
                  if (!rentDepositFee) return getFieldMissingError('Deposit Fee is missing');
                  if (rentDepositFee?.amount <= 0)
                    return getFieldMissingError('Deposit Fee cannot be $0.00.');
                }
              }
              if (!rentDeliveryOptions || rentDeliveryOptions.length === 0) {
                return getFieldMissingError('Delivery Method is missing');
              }
              if (rentDeliveryOptions.includes('pickup')) {
                if (!rentPickupLocation?.search && !rentPickupLocation?.selectedPlace?.address) {
                  return getFieldMissingError('Pickup Location is missing');
                }
                if (!rentPickupAddress) return getFieldMissingError('Pickup Address is missing');
                if (!rentPickupCity) return getFieldMissingError('Pickup city is missing');
                if (!rentPickupState) return getFieldMissingError('Pickup state is missing');
                if (!isValidZipCode(rentPickupZipCode)) {
                  return getFieldMissingError('Enter a valid Pickup ZIP code');
                }
              }

              if (rentDeliveryOptions.includes('shipping')) {
                if (!rentDeliveryAddressOption) {
                  return getFieldMissingError('Delivery Address Option is missing');
                }
                if (
                  !rentShippingLocation?.search &&
                  !rentShippingLocation?.selectedPlace?.address &&
                  rentDeliveryAddressOption !== 'sameAsPickupAddress'
                ) {
                  return getFieldMissingError('Delivery Location is missing');
                }
                if (!rentShippingAddress && rentDeliveryAddressOption !== 'sameAsPickupAddress')
                  return getFieldMissingError('Delivery Address is missing');
                if (!rentShippingCity && rentDeliveryAddressOption !== 'sameAsPickupAddress')
                  return getFieldMissingError('Delivery city is missing');
                if (!rentShippingState && rentDeliveryAddressOption !== 'sameAsPickupAddress')
                  return getFieldMissingError('Delivery state is missing');
                if (
                  !isValidZipCode(rentShippingZipCode) &&
                  rentDeliveryAddressOption !== 'sameAsPickupAddress'
                ) {
                  return getFieldMissingError('Enter a valid Delivery ZIP code');
                }

                const requiredRanges = ['0_10', '11_20', '21_40', '41_plus'];
                const rangeLabelMap = deliveryRanges.reduce((acc, range) => {
                  acc[range.key] = range.label;
                  return acc;
                }, {});

                let hasValidRange = false;
                let invalidRanges = [];

                requiredRanges.forEach(range => {
                  const rangeData = rentDelivery?.[range];
                  const amount = rangeData?.rangeFee?.amount;

                  if (rangeData && rangeData.rangeFee && typeof amount === 'number') {
                    if (amount >= 100) {
                      hasValidRange = true;
                    } else {
                      invalidRanges.push(rangeLabelMap[range]);
                    }
                  }
                });

                // 1. No valid delivery range at all
                if (!hasValidRange) {
                  return getFieldMissingError(
                    `At least one valid Delivery fee (minimum $1.00) is required for any range`
                  );
                }

                // 2. There are invalid ranges even if one is valid
                if (invalidRanges.length > 0) {
                  return getFieldMissingError(
                    `Enter amount minimum $1.00 for: ${invalidRanges.join(', ')}`
                  );
                }
              }
            }            
            // Check Shipo address
            const newdeliveryAddressSell = updateValues?.publicData?.deliveryAddressSell || {};
            const orlSavedAddress = listing?.attributes?.publicData?.deliveryAddressSell || {};
            const isneedtoCheckForaddress = newdeliveryAddressSell?.sellShippingAddress
              ? !!(
                  newdeliveryAddressSell?.sellShippingAddress !==
                    orlSavedAddress?.sellShippingAddress ||
                  newdeliveryAddressSell?.sellShippingAddress2 !==
                    orlSavedAddress?.sellShippingAddress2 ||
                  newdeliveryAddressSell?.sellShippingCity !== orlSavedAddress?.sellShippingCity ||
                  newdeliveryAddressSell?.sellShippingState !==
                    orlSavedAddress?.sellShippingState ||
                  newdeliveryAddressSell?.sellShippingZipCode !==
                    orlSavedAddress?.sellShippingZipCode
                )
              : false; 
            if(isneedtoCheckForaddress){ 
              const payload = {
                address_from: {},
                address_to: {
                  name: 'Customer',
                  organization: 'Shippo',
                  street1: newdeliveryAddressSell?.sellShippingAddress,
                  city: newdeliveryAddressSell?.sellShippingCity,
                  state: newdeliveryAddressSell?.sellShippingState,
                  zip: sellShippingZipCode?.sellShippingZipCode,
                  country: 'US',
                },
                parcels: [{}],
              };
              setNotValidAddress(false)
              setValidatingAddress(true)
              oncheckDeliveryLocation(payload)
              .then(res => { 
                const { is_valid } = res.validation_results || false; 
                if (is_valid) {
                  setNotValidAddress(false)
                  setValidatingAddress(true)
                  onSubmit(updateValues);  
                } else {
                  setNotValidAddress(true)
                  setValidatingAddress(false)
                  return null
                }
              })
              .catch(e => { 
                console.log(e,"Error")
              });
            }else{
              console.log(updateValues,"No need to check address")
              onSubmit(updateValues);
            }
          }
        }}
        listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
        marketplaceCurrency={marketplaceCurrency}
        listingType={listingTypeConfig}
        unitType={unitType}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        config={config}
        setIsEditPlanModalOpen={setIsEditPlanModalOpen}
        hasAvailabilityPlan={hasAvailabilityPlan}
        setIsEditExceptionsModalOpen={setIsEditExceptionsModalOpen}
        availabilityPlan={availabilityPlan}
        sortedAvailabilityExceptions={sortedAvailabilityExceptions}
        weeklyExceptionQueries={weeklyExceptionQueries}
        useFullDays={useFullDays}
        onDeleteAvailabilityException={onDeleteAvailabilityException}
        onFetchExceptions={onFetchExceptions}
        params={params}
        locationSearch={locationSearch}
        firstDayOfWeek={firstDayOfWeek}
        routeConfiguration={routeConfiguration}
        history={history}
        isEditPlanModalOpen={isEditPlanModalOpen}
        onManageDisableScrolling={onManageDisableScrolling}
        listingAttributes={listingAttributes}
        intialAvailabilityPlan={intialAvailabilityPlan}
        isEditExceptionsModalOpen={isEditExceptionsModalOpen}
        allExceptions={allExceptions}
        monthlyExceptionQueries={monthlyExceptionQueries}
        saveException={saveException}
        rotateDays={rotateDays}
        WEEKDAYS={WEEKDAYS}
        handleAvailabilitySubmit={handleAvailabilitySubmit}
        listing={listing}
      />
      {/* ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingAndStockPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency }}
          />
        </div>
      )} */}
    </div>
  );
};

export default EditListingPricingAndStockPanel;