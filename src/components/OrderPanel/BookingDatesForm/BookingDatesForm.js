import React, { useState, useEffect } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import appSettings from '../../../config/settings';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { required, bookingDatesRequired, composeValidators } from '../../../util/validators';
import {
  getStartOf,
  addTime,
  isSameDay,
  isDateSameOrAfter,
  isInRange,
  timeOfDayFromLocalToTimeZone,
  timeOfDayFromTimeZoneToLocal,
  monthIdString,
  parseDateFromISO8601,
  stringifyDateToISO8601,
} from '../../../util/dates';
import { LINE_ITEM_DAY, propTypes } from '../../../util/types';
import { timeSlotsPerDate } from '../../../util/generators';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import {
  Form,
  PrimaryButton,
  FieldDateRangePicker,
  FieldSelect,
  H6,
  Button,
  FieldLocationAutocompleteInput,
  FieldCheckbox,
  NamedLink,
} from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './BookingDatesForm.module.css';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import BrandIconCard from '../../BrandIconCard/BrandIconCard';
import { deliveryOptions } from '../../../util/constants';
import Swal from 'sweetalert2';
import { values } from 'lodash';

const TODAY = new Date();
const identity = v => v;
const nextMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, offset, 'months');
const prevMonthFn = (currentMoment, timeZone, offset = 1) =>
  getStartOf(currentMoment, 'month', timeZone, -1 * offset, 'months');
const endOfRange = (date, dayCountAvailableForBooking, timeZone) =>
  getStartOf(date, 'day', timeZone, dayCountAvailableForBooking, 'days');

const getMonthStartInTimeZone = (monthId, timeZone) => {
  const month = parseDateFromISO8601(`${monthId}-01`, timeZone); // E.g. new Date('2022-12')
  return getStartOf(month, 'month', timeZone, 0, 'months');
};

const getExclusiveEndDate = (date, timeZone) => {
  return getStartOf(date, 'day', timeZone, 1, 'days');
};
const getInclusiveEndDate = (date, timeZone) => {
  return getStartOf(date, 'day', timeZone, -1, 'days');
};
/**
 * Get the range of months that we have already fetched time slots.
 * (This range expands when user clicks Next-button on date picker).
 * monthlyTimeSlots look like this: { '2024-07': { timeSlots: []}, '2024-08': { timeSlots: []} }
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @param {String} timeZone IANA time zone key ('Europe/Helsinki')
 * @returns {Array<Date>} a tuple containing dates: the start and exclusive end month
 */
const getMonthlyFetchRange = (monthlyTimeSlots, timeZone) => {
  const monthStrings = Object.entries(monthlyTimeSlots).reduce((picked, entry) => {
    return Array.isArray(entry[1].timeSlots) ? [...picked, entry[0]] : picked;
  }, []);
  const firstMonth = getMonthStartInTimeZone(monthStrings[0], timeZone);
  const lastMonth = getMonthStartInTimeZone(monthStrings[monthStrings.length - 1], timeZone);
  const exclusiveEndMonth = nextMonthFn(lastMonth, timeZone);
  return [firstMonth, exclusiveEndMonth];
};

/**
 * This merges the time slots, when consecutive time slots are back to back with same "seats" count.
 *
 * @param {Array<TimeSlot>} timeSlots
 * @returns {Array<TimeSlot>} array of time slots where unnecessary boundaries have been removed.
 */
const removeUnnecessaryBoundaries = timeSlots => {
  return timeSlots.reduce((picked, ts) => {
    const hasPicked = picked.length > 0;
    if (hasPicked) {
      const rest = picked.slice(0, -1);
      const lastPicked = picked.slice(-1)[0];

      const isBackToBack = lastPicked.attributes.end.getTime() === ts.attributes.start.getTime();
      const hasSameSeatsCount = lastPicked.attributes.seats === ts.attributes.seats;
      const createJoinedTimeSlot = (ts1, ts2) => ({
        ...ts1,
        attributes: { ...ts1.attributes, end: ts2.attributes.end },
      });
      return isBackToBack && hasSameSeatsCount
        ? [...rest, createJoinedTimeSlot(lastPicked, ts)]
        : [...picked, ts];
    }
    return [ts];
  }, []);
};
/**
 * Join monthly time slots into a single array and remove unnecessary boundaries on month changes.
 *
 * @param {Object} monthlyTimeSlots { '2024-07': { timeSlots: [] }, }
 * @returns {Array<TimeSlot>}
 */
const getAllTimeSlots = monthlyTimeSlots => {
  const timeSlotsRaw = Object.values(monthlyTimeSlots).reduce((picked, mts) => {
    return [...picked, ...(mts.timeSlots || [])];
  }, []);
  return removeUnnecessaryBoundaries(timeSlotsRaw);
};

/**
 * Check if a blocked date can be found between two dates.
 *
 * @param {Array<propTypes.timeSlot>} allTimeSlots an array of propTypes.timeSlot objects
 * @param {String} timeZone time zone id
 * @param {Moment} startDate start date (Moment)
 * @param {Moment} endDate end date (Moment)
 */
const isBlockedBetween = (allTimeSlots, timeZone) => ([startDate, endDate]) => {
  const localizedStartDay = timeOfDayFromLocalToTimeZone(startDate, timeZone);
  const localizedEndDay = timeOfDayFromLocalToTimeZone(endDate, timeZone);
  const foundTS = allTimeSlots.find(ts => {
    const timeSlotRange = [ts.attributes.start, ts.attributes.end];
    return isInRange(localizedStartDay, ...timeSlotRange, undefined, timeZone);
  });

  if (!foundTS) {
    return true;
  }

  const timeSlotRange = [foundTS.attributes.start, foundTS.attributes.end];
  // endDate should be included in the slot mapped with startDate
  const isExcludedEnd = isSameDay(localizedEndDay, timeSlotRange[1], timeZone);
  const isBlockedBetween = !(isInRange(localizedEndDay, ...timeSlotRange) || isExcludedEnd);
  return isBlockedBetween;
};

const isOneBoundaryeSelected = (hasTimeSlots, startDate, endDate) => {
  const oneBoundarySelected = (startDate || endDate) && (!startDate || !endDate);
  return hasTimeSlots && oneBoundarySelected;
};

const endDateToPickerDate = (unitType, endDate, timeZone) => {
  const isValid = endDate instanceof Date;
  const isDaily = unitType === LINE_ITEM_DAY;

  if (!isValid) {
    return null;
  } else if (isDaily) {
    // API end dates are exlusive, so we need to shift them with daily
    // booking.
    return getStartOf(endDate, 'day', timeZone, -1, 'days');
  } else {
    return endDate;
  }
};

/**
 * Get the closest start date: the start of the time slot or the start of the available range.
 *
 * @param {Object} timeSlotData { timeSlots: [<TimeSlot>]}
 * @param {Date} startOfAvailableRange
 * @param {Date} endOfAvailableRange
 * @returns {Date} start of time slot or the start of available range
 */
const getBookableRange = (timeSlotData, startOfAvailableRange, endOfAvailableRange) => {
  if (!timeSlotData) {
    return [];
  }

  const timeSlotStart = timeSlotData?.timeSlots?.[0]?.attributes?.start;
  const timeSlotEnd = timeSlotData?.timeSlots?.[0]?.attributes?.end;
  const start = isDateSameOrAfter(startOfAvailableRange, timeSlotStart)
    ? startOfAvailableRange
    : timeSlotStart;
  const end = isDateSameOrAfter(endOfAvailableRange, timeSlotEnd)
    ? timeSlotEnd
    : endOfAvailableRange;
  return [start, end];
};

/**
 * Returns an isOutsideRange function that can be passed to
 * a DateRangePicker component.
 */
const isOutsideRangeFn = (
  allTimeSlots,
  monthlyTimeSlots,
  startDate,
  endDate,
  lineItemUnitType,
  dayCountAvailableForBooking,
  timeZone
) => {
  const endOfAvailableRange = dayCountAvailableForBooking;
  const endOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone, endOfAvailableRange, 'days');
  const startOfAvailableRangeDate = getStartOf(TODAY, 'day', timeZone);

  // Currently available monthly data
  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);

  // One boundary is selected
  const oneBoundarySelected = isOneBoundaryeSelected(!!monthlyTimeSlots, startDate, endDate);
  const inclusiveEndDateMaybe = endDate ? getInclusiveEndDate(endDate, timeZone) : endDate;
  const boundary = startDate || inclusiveEndDateMaybe;
  const timeSlotData = oneBoundarySelected
    ? timeSlotsData[stringifyDateToISO8601(boundary, timeZone)]
    : null;
  const bookableRange = getBookableRange(
    timeSlotData,
    startOfAvailableRangeDate,
    endOfAvailableRangeDate
  );

  const [rangeStart, rangeEnd] =
    bookableRange.length === 2
      ? bookableRange
      : [startOfAvailableRangeDate, endOfAvailableRangeDate];

  // standard isOutsideRange function
  return day => {
    const timeOfDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(timeOfDay, 'day', timeZone);

    // end the range so that the booking can end at latest on
    // - nightly booking: the day the next booking starts
    // - daily booking: the day before the next booking starts
    const lastDayToEndBooking = endDateToPickerDate(lineItemUnitType, rangeEnd, timeZone);

    return (
      !isDateSameOrAfter(dayInListingTZ, rangeStart) ||
      !isDateSameOrAfter(lastDayToEndBooking, dayInListingTZ)
    );
  };
};

/**
 * Returns an isDayBlocked function that can be passed to
 * a DateRangePicker component.
 */
const isDayBlockedFn = params => {
  const { allTimeSlots, monthlyTimeSlots, isDaily, startDate, endDate, timeZone } = params || {};

  const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, timeZone);
  const timeSlotsData = timeSlotsPerDate(startMonth, endMonth, allTimeSlots, timeZone);

  return day => {
    const localizedDay = timeOfDayFromLocalToTimeZone(day, timeZone);
    const dayInListingTZ = getStartOf(localizedDay, 'day', timeZone);

    const dayIdString = stringifyDateToISO8601(dayInListingTZ, timeZone);
    const hasAvailabilityOnDay = timeSlotsData[dayIdString]?.hasAvailability === true;

    if (!isDaily && startDate) {
      // Nightly
      // For the unit type night, we check that the time slot of the selected startDate
      // ends on a given _day_
      const startDateIdString = stringifyDateToISO8601(startDate, timeZone);
      const startDateTimeSlotsData = timeSlotsData[startDateIdString];
      const startDateTimeSlot =
        startDateTimeSlotsData == null ? true : startDateTimeSlotsData?.timeSlots?.[0];
      const { start, end } = startDateTimeSlot?.attributes || {};
      // If both startDate and endDate have been selected, we allow selecting other ranges
      const hasAvailability =
        startDate && endDate
          ? hasAvailabilityOnDay
          : isInRange(dayInListingTZ, start, end, 'day', timeZone);
      const timeSlotEndsOnThisDay = end && isSameDay(dayInListingTZ, end, timeZone);

      return !(hasAvailability || timeSlotEndsOnThisDay);
    }

    // Daily
    return !hasAvailabilityOnDay;
  };
};

const fetchMonthData = (
  date,
  listingId,
  dayCountAvailableForBooking,
  timeZone,
  onFetchTimeSlots
) => {
  const endOfRangeDate = endOfRange(TODAY, dayCountAvailableForBooking, timeZone);

  // Don't fetch timeSlots for past months or too far in the future
  if (isInRange(date, TODAY, endOfRangeDate)) {
    // Use "today", if the first day of given month is in the past
    const start = isDateSameOrAfter(TODAY, date) ? TODAY : date;

    // Use endOfRangeDate, if the first day of the next month is too far in the future
    const nextMonthDate = nextMonthFn(date, timeZone);
    const end = isDateSameOrAfter(nextMonthDate, endOfRangeDate)
      ? getStartOf(endOfRangeDate, 'day', timeZone)
      : nextMonthDate;

    // Fetch time slots for given time range
    onFetchTimeSlots(listingId, start, end, timeZone);
  }
};

const handleMonthClick = (
  currentMonth,
  monthlyTimeSlots,
  dayCountAvailableForBooking,
  timeZone,
  listingId,
  onFetchTimeSlots
) => monthFn => {
  // Callback function after month has been updated.
  // DatePicker component has next and previous months ready (but inivisible).
  // we try to populate those invisible months before user advances there.
  fetchMonthData(
    monthFn(currentMonth, timeZone, 2),
    listingId,
    dayCountAvailableForBooking,
    timeZone,
    onFetchTimeSlots
  );

  // If previous fetch for month data failed, try again.
  const monthId = monthIdString(currentMonth, timeZone);
  const currentMonthData = monthlyTimeSlots[monthId];
  if (currentMonthData && currentMonthData.fetchTimeSlotsError) {
    fetchMonthData(
      currentMonth,
      listingId,
      dayCountAvailableForBooking,
      timeZone,
      onFetchTimeSlots
    );
  }
};

// When the values of the form are updated we need to fetch
// lineItems from this Template's backend for the EstimatedTransactionMaybe
// In case you add more fields to the form, make sure you add
// the values here to the orderData object.

const calculateLineItems = (
  listingId,
  isOwnListing,
  fetchLineItemsInProgress,
  onFetchTransactionLineItems,
  seatsEnabled,
  selectedSetupFee
) => formValues => {
  const { startDate, endDate, priceVariantName, seats, deliveryfee, deliveryMethod, productType } =
    formValues?.values || {};

  const priceVariantMaybe = priceVariantName ? { priceVariantName } : {};
  const seatCount = seats ? parseInt(seats, 10) : 1;

  const orderData = {
    bookingStart: startDate,
    bookingEnd: endDate,
    ...priceVariantMaybe,
    ...(seatsEnabled && { seats: seatCount }),
    setupPrice: selectedSetupFee || null,
    deliveryfee: deliveryfee,
    deliveryMethod: deliveryMethod,
    productType,
  };

  if (startDate && endDate && !fetchLineItemsInProgress) {
    onFetchTransactionLineItems({
      orderData,
      listingId,
      isOwnListing,
    });
  }
};

const showNextMonthStepper = (currentMonth, dayCountAvailableForBooking, timeZone) => {
  const nextMonthDate = nextMonthFn(currentMonth, timeZone);

  return !isDateSameOrAfter(
    nextMonthDate,
    endOfRange(TODAY, dayCountAvailableForBooking, timeZone)
  );
};

const showPreviousMonthStepper = (currentMonth, timeZone) => {
  const prevMonthDate = prevMonthFn(currentMonth, timeZone);
  const currentMonthDate = getStartOf(TODAY, 'month', timeZone);
  return isDateSameOrAfter(prevMonthDate, currentMonthDate);
};

const getStartAndEndOnTimeZone = (startDate, endDate, isDaily, timeZone) => {
  // Parse the startDate and endDate into the target time zone
  const parsedStart = startDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(startDate, timeZone), 'day', timeZone)
    : startDate;

  const parsedEnd = endDate
    ? getStartOf(timeOfDayFromLocalToTimeZone(endDate, timeZone), 'day', timeZone)
    : endDate;

  // Adjust endDate for API if isDaily is true
  const endDateForAPI = parsedEnd && isDaily ? getExclusiveEndDate(parsedEnd, timeZone) : parsedEnd;

  // Return the processed dates
  return { startDate: parsedStart, endDate: endDateForAPI };
};

// return a list of timeslots that exist between startDate and endDate
const filterTimeSlotsByDate = (allTimeSlots, startDate, endDate) => {
  return Object.values(allTimeSlots).filter(
    ({ attributes: { start, end } }) =>
      // Check if the timeslot is within or overlaps with the selected dates
      (start < startDate && end > startDate) ||
      (start >= startDate && end <= endDate) ||
      (start < endDate && end > endDate)
  );
};

// Finds the timeslot with the smallest number of seats
const findMinSeatsTimeSlot = timeSlots => {
  return timeSlots.reduce((minSeatsSlot, timeSlot) => {
    const { seats } = timeSlot.attributes;
    return !minSeatsSlot || seats < minSeatsSlot.seats ? timeSlot.attributes : minSeatsSlot;
  }, null);
};

// Main function to get the seat options based on the minimum seats available in the date range
const getMinSeatsOptions = (allTimeSlots, startDate, endDate) => {
  if (!startDate || !endDate) {
    return [];
  }
  const filteredTimeSlots = filterTimeSlotsByDate(allTimeSlots, startDate, endDate);
  const minSeatsSlot = findMinSeatsTimeSlot(filteredTimeSlots);

  // Return the array of seat options from 1 to the minimum seats available, capped at 100
  const maxOptions = 100;
  return minSeatsSlot
    ? Array.from({ length: Math.min(minSeatsSlot.seats, maxOptions) }, (_, i) => i + 1)
    : [];
};

// Checks if two timeslots are consequtive
const areConsecutiveTimeSlots = (timeSlotA, timeSlotB) =>
  new Date(timeSlotA.attributes.end).getTime() === new Date(timeSlotB.attributes.start).getTime();

// Find the index of a the first consecutive timeslot in a list of timeslots
const findIndexOfFirstConsecutiveTimeSlot = (timeSlots, index) =>
  index > 0 && areConsecutiveTimeSlots(timeSlots[index - 1], timeSlots[index])
    ? findIndexOfFirstConsecutiveTimeSlot(timeSlots, index - 1)
    : index;

// find the index of the last consecutive timeslot in a list of timeslots
const findIndexOfLastConsecutiveTimeSlot = (timeSlots, index) =>
  index < timeSlots.length - 1 && areConsecutiveTimeSlots(timeSlots[index], timeSlots[index + 1])
    ? findIndexOfLastConsecutiveTimeSlot(timeSlots, index + 1)
    : index;

// Find and combine adjacent/consecutive timeslots into one timeslot
const combineConsecutiveTimeSlots = (slots, startDate) => {
  // Locate the index of the timeslot containing startDate
  const startIndex = slots.findIndex(({ attributes }) => {
    const { start, end } = attributes;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return startDate.getTime() >= startTime && startDate.getTime() < endTime;
  });

  // Return empty array if no timeslot matches startDate
  if (startIndex === -1) return [];

  // Determine the full range of consecutive timeslots
  const indexOfFirstTimeSlot = findIndexOfFirstConsecutiveTimeSlot(slots, startIndex);
  const indexOfLastTimeSlot = findIndexOfLastConsecutiveTimeSlot(slots, startIndex);

  // Combine the consecutive timeslots into a single slot
  const combinedSlot = {
    ...slots[indexOfFirstTimeSlot],
    attributes: {
      ...slots[indexOfFirstTimeSlot].attributes,
      start: slots[indexOfFirstTimeSlot].attributes.start,
      end: slots[indexOfLastTimeSlot].attributes.end,
    },
  };

  return [combinedSlot];
};

const onPriceVariantChange = props => value => {
  const { form: formApi, seatsEnabled } = props;

  formApi.batch(() => {
    formApi.change('bookingDates', null);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
};

/**
 * A form for selecting booking dates.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class name for the root element
 * @param {string} [props.className] - Custom class name
 * @param {Object} props.price - The unit price of the
 * @param {string} props.listingId - The listing ID
 * @param {boolean} props.isOwnListing - Whether the listing belongs to the current user
 * @param {propTypes.lineItemUnitType} props.lineItemUnitType - The unit type of the line item
 * @param {Object} props.monthlyTimeSlots - The monthly time slots
 * @param {Function} props.onFetchTimeSlots - Handler for fetching time slots
 * @param {Array<Object>} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {propTypes.error} props.fetchLineItemsError - The error for fetching line items
 * @param {Function} props.onFetchTransactionLineItems - Handler for fetching transaction line items
 * @param {string} props.timeZone - The time zone
 * @param {string} props.marketplaceName - Name of the marketplace
 * @param {string} [props.startDatePlaceholder] - Placeholder for the start date
 * @param {string} [props.endDatePlaceholder] - Placeholder for the end date
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {Array<Object>} [props.priceVariants] - The price variants
 * @param {ReactNode} [props.priceVariantFieldComponent] - The component to use for the price variant field
 * @param {boolean} props.isPublishedListing - Whether the listing is published
 * @returns {JSX.Element}
 */
export const BookingDatesForm = props => {
  const {
    rootClassName,
    className,
    price: unitPrice,
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    timeZone,
    dayCountAvailableForBooking,
    marketplaceName,
    payoutDetailsWarning,
    monthlyTimeSlots,
    onMonthChanged,
    seatsEnabled,
    isPriceVariationsInUse,
    priceVariants = [],
    currentUser,
    priceVariantFieldComponent: PriceVariantFieldComponent,
    preselectedPriceVariant,
    handleAddToCart,
    isPublishedListing,
    form,
    selectedSetupFee,
    onCalculateDistance,
    calculatedDistance,
    calculateLocationRequest,
    listing,
    depositFee,
    lateFee,
    values,
    ...rest
  } = props;
   
  const { publicData } = listing?.attributes || {};
  const { rentDeliveryOptions, rentShippingLocation, rentStock } = publicData || {};
  const updatedRentStock = rentStock
    ? (typeof rentStock === 'string' && !isNaN(rentStock)
      ? Number(rentStock)
      : rentStock)
    : null;

  const rentStockArray = updatedRentStock
    ? Array.from({ length: updatedRentStock }, (_, i) => ({
      option: i + 1,
      label: i + 1
    }))
    : [];

  const history = useHistory();
  const intl = useIntl();
  const [currentMonth, setCurrentMonth] = useState(getStartOf(TODAY, 'month', timeZone));
  const auth = useSelector(state => state.auth.isAuthenticated);
  const initialValuesMaybe =
    priceVariants.length > 1 && preselectedPriceVariant
      ? { initialValues: { priceVariantName: preselectedPriceVariant?.name } }
      : priceVariants.length === 1
        ? { initialValues: { priceVariantName: priceVariants?.[0]?.name } }
        : {};

  const allTimeSlots = getAllTimeSlots(monthlyTimeSlots);
  const monthId = monthIdString(currentMonth);
  const currentMonthInProgress = monthlyTimeSlots[monthId]?.fetchTimeSlotsInProgress;
  const nextMonthId = monthIdString(nextMonthFn(currentMonth, timeZone));
  const nextMonthInProgress = monthlyTimeSlots[nextMonthId]?.fetchTimeSlotsInProgress;

  useEffect(() => {
    // Call onMonthChanged function if it has been passed in among props.
    if (onMonthChanged) {
      onMonthChanged(monthId);
    }
  }, [currentMonth, onMonthChanged]);

  useEffect(() => {
    // Log time slots marked for each day for debugging
    if (
      appSettings.dev &&
      appSettings.verbose &&
      !currentMonthInProgress &&
      !nextMonthInProgress &&
      monthlyTimeSlots &&
      timeZone
    ) {
      // This side effect just prints debug data into the console.log feed.
      // Note: endMonth is exclusive end time of the range.
      const tz = timeZone;
      const nextMonth = nextMonthFn(currentMonth, tz);
      const timeSlotsData = timeSlotsPerDate(currentMonth, nextMonth, allTimeSlots, tz);
      const [startMonth, endMonth] = getMonthlyFetchRange(monthlyTimeSlots, tz);
      const lastFetchedMonth = new Date(endMonth.getTime() - 1);

      console.log(
        `Fetched months: ${monthIdString(startMonth, tz)} ... ${monthIdString(
          lastFetchedMonth,
          tz
        )}`,
        '\nTime slots for the current month:',
        timeSlotsData
      );
    }
  }, [currentMonth, currentMonthInProgress, nextMonthInProgress, timeZone, monthlyTimeSlots]);

  const classes = classNames(rootClassName || css.root, className);

  const onHandleFetchLineItems = calculateLineItems(
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    seatsEnabled,
    selectedSetupFee
  );

  const bookmarks =
    (currentUser && currentUser.attributes?.profile?.protectedData?.bookmarks) || {};


  return (
    <FinalForm
      {...initialValuesMaybe}
      {...rest}
      unitPrice={unitPrice}
      render={formRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          formId,
          handleSubmit,
          lineItemUnitType,
          values,
          lineItems,
          fetchLineItemsError,
          onFetchTimeSlots,
          form: formApi,
          productType,
          autoFocus,
        } = formRenderProps;
        // Set deliveryMethod to 'pickup' if deliveryFee[0]?.rangeFee?.amount is not present or is 0
        useEffect(() => {
          if (
            !publicData?.deliveryFee?.[0]?.rangeFee?.amount ||
            publicData?.deliveryFee?.[0]?.rangeFee?.amount === 0
          ) {
            formApi.change('deliveryMethod', 'pickup');
          }
        }, [publicData?.deliveryFee?.[0]?.rangeFee?.amount]);

        const { startDate, endDate } = values?.bookingDates ? values.bookingDates : {};
        const { deliveryFee } = calculatedDistance || {};
        formApi.change('deliveryfee', deliveryFee?.amount);
        formApi.change('productType', productType);
        const isDeliveryFeeEnabled = deliveryFee?.amount < 1 || deliveryFee?.amount === 0;

        useEffect(() => {
          const isLocation =
            values?.userLocation?.search && values?.userLocation?.selectedPlace?.address;
          const userLocation = { address: values?.userLocation?.selectedPlace?.address };

          if (isLocation) {
            onCalculateDistance({ listingId, userLocation });
          }
        }, [values?.userLocation]);
        useEffect(() => {
          if (isDeliveryFeeEnabled) {
            Swal.fire({
              toast: true,
              position: 'top-end', // 'top-end' is better for toasts
              icon: 'error',
              text: 'Not Available at your location',
              showConfirmButton: false,
              timer: 5000, // Closes after 5 seconds
              timerProgressBar: true,
              didOpen: toast => {
                // Change timer progress bar color to red
                const progressBar = toast.querySelector('.swal2-timer-progress-bar');
                if (progressBar) {
                  progressBar.style.backgroundColor = 'red';
                }
              },
            });
          }
        }, [deliveryFee, isDeliveryFeeEnabled]);
        useEffect(() => {
          const { startDate, endDate } = values?.bookingDates || {};
          const priceVariantName = values?.priceVariantName || null;
          const seats = values?.seats;
          const deliveryfee = values?.deliveryfee / 100;
          const deliveryMethod = values?.deliveryMethod;
          const productType = values?.productType;

          if (startDate && endDate && !fetchLineItemsInProgress) {
            onHandleFetchLineItems({
              values: {
                priceVariantName,
                startDate,
                endDate,
                seats: seatsEnabled ? seats || 1 : undefined,
                setupPrice: selectedSetupFee || null, // Pass null if not set
                deliveryfee,
                deliveryMethod,
                productType,
              },
            });
          }
        }, [selectedSetupFee]);
        // Handle deliveryfee change to recalculate line items
        useEffect(() => {
          const { startDate, endDate } = values?.bookingDates || {};
          const priceVariantName = values?.priceVariantName || null;
          const seats = values?.seats;
          const deliveryfee = values?.deliveryfee / 100;
          const productType = values?.productType;

          if (startDate && endDate && !fetchLineItemsInProgress) {
            onHandleFetchLineItems({
              values: {
                priceVariantName,
                startDate,
                endDate,
                seats: seatsEnabled ? seats || 1 : undefined,
                deliveryfee,
                deliveryMethod: values?.deliveryMethod,
                productType,
              },
            });
          }
        }, [values?.deliveryfee, values?.deliveryMethod]);

        useEffect(() => {
          if (selectedSetupFee) {
            formApi.change('selectedSetUpFee', selectedSetupFee);
          }
        }, [selectedSetupFee]);

        formApi.change('productType', productType);
        useEffect(() => {
          ({
            values: {
              startDate,
              endDate,
              seats: seatsEnabled ? 1 : undefined,
            },
          });
        }, []);

        const priceVariantName = values?.priceVariantName || null;

        const startDateErrorMessage = intl.formatMessage({
          id: 'FieldDateRangeInput.invalidStartDate',
        });
        const endDateErrorMessage = intl.formatMessage({
          id: 'FieldDateRangeInput.invalidEndDate',
        });
        const privacyPolicy = <a href="/p/cancellation-terms">Rental & Cancellation Terms</a>
        
        const privacyPolicyText = (
          <FormattedMessage id="BookingDatesForm.iAgree" values={{privacyPolicy}} />
        )
    
        // This is the place to collect breakdown estimation data.
        // Note: lineItems are calculated and fetched from this Template's backend
        // so we need to pass only booking data that is needed otherwise
        // If you have added new fields to the form that will affect to pricing,
        // you need to add the values to handleOnChange function
        const breakdownData =
          startDate &&
            endDate &&
            !isDeliveryFeeEnabled &&
            (values?.deliveryMethod === 'pickup' ||
              (values?.deliveryMethod === 'delivery' && values?.userLocation?.selectedPlace?.address))
            ? {
              startDate,
              endDate,
            }
            : null;
        console.log(breakdownData, '&&& &&& => breakdownData');

        const showEstimatedBreakdown =
          breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;

        const dateFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        };

        const startOfToday = getStartOf(TODAY, 'day', timeZone);
        const tomorrow = addTime(startOfToday, 1, 'days');
        const startDatePlaceholderText =
          startDatePlaceholder || intl.formatDate(startOfToday, dateFormatOptions);
        const endDatePlaceholderText =
          endDatePlaceholder || intl.formatDate(tomorrow, dateFormatOptions);

        const relevantTimeSlots =
          startDate && !endDate
            ? combineConsecutiveTimeSlots(allTimeSlots, startDate)
            : allTimeSlots;

        const onMonthClick = handleMonthClick(
          currentMonth,
          monthlyTimeSlots,
          dayCountAvailableForBooking,
          timeZone,
          listingId,
          onFetchTimeSlots
        );
        const isDayBlocked = isDayBlockedFn({
          allTimeSlots: relevantTimeSlots,
          monthlyTimeSlots,
          isDaily: lineItemUnitType === LINE_ITEM_DAY,
          startDate,
          endDate,
          timeZone,
        });
        const isOutsideRange = isOutsideRangeFn(
          relevantTimeSlots,
          monthlyTimeSlots,
          startDate,
          endDate,
          lineItemUnitType,
          dayCountAvailableForBooking,
          timeZone,
          seatsEnabled
        );

        const seatsOptions = getMinSeatsOptions(
          relevantTimeSlots,
          values?.bookingDates?.startDate,
          values?.bookingDates?.endDate
        );

        const isDaily = lineItemUnitType === LINE_ITEM_DAY;
        const submitDisabled = isPriceVariationsInUse && !isPublishedListing;
        const isDeliveryMethodEnabled =
          rentDeliveryOptions?.includes('shipping') && rentShippingLocation?.selectedPlace?.address;
        const isPickupMethodEnabled = rentDeliveryOptions?.includes('pickup');
        const areButtonsDisabled =
          !startDate ||
          !endDate ||
          !values?.deliveryMethod ||
          (values?.deliveryMethod === 'delivery' &&
            !values?.userLocation?.selectedPlace?.address) ||
          isDeliveryFeeEnabled || !values?.term;
          
        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            <div className={css.returnWrapper}>
              {lateFee ? (
                <div className={css.returnBox}>
                  <span className={css.returnLabel}>Late Return fee</span>
                  <span className={css.returnDetail}>${lateFee}</span>
                </div>
              ) : null}

              <div className={css.returnBox}>
                <span className={css.returnLabel}>Security Deposit</span>
                {depositFee ? (
                  <span className={css.returnDetail}> ${depositFee}</span>
                ) : (
                  <span className={css.returnDetail}> 10% of the product amount</span>
                )}
              </div>
            </div>
            {PriceVariantFieldComponent ? (
              <PriceVariantFieldComponent
                priceVariants={priceVariants}
                priceVariantName={priceVariantName}
                onPriceVariantChange={onPriceVariantChange(formRenderProps)}
                disabled={!isPublishedListing}
              />
            ) : null}
            {!isOwnListing && productType == 'rent' ? (
              <FieldSelect
                id="deliveryMethod"
                name="deliveryMethod"
                className={css.inputBox}
                label={'Delivery Method'}
              >
                <option disabled value="">
                  {'Select delivery method'}
                </option>
                {isPickupMethodEnabled ? <option value="pickup">Pickup</option> : null}
                {isDeliveryMethodEnabled ? <option value="delivery">Delivery</option> : null}
              </FieldSelect>
            ) : null}
            {isDeliveryFeeEnabled ? (
              <p className={css.noAvailable}>
                Oops! Delivery not available here. Try somewhere else
              </p>
            ) : null}
            {productType == 'rent' && values?.deliveryMethod === 'delivery' ? (
              <FieldLocationAutocompleteInput
                className={css.locationInput}
                rootClassName={css.locationAddress}
                inputClassName={css.locationAutocompleteInput}
                iconClassName={css.locationAutocompleteInputIcon}
                predictionsClassName={css.predictionsRoot}
                validClassName={css.validLocation}
                autoFocus={autoFocus}
                name={'userLocation'}
                label="Location"
                placeholder="Enter your location"
                useDefaultPredictions={false}
                format={identity}
                // valueFromForm={values.userlocation}
                validate={required('This field is required')}
              />
            ) : null}
            <FieldDateRangePicker
              className={css.bookingDates}
              name="bookingDates"
              isDaily={isDaily}
              startDateId={`${formId}.bookingStartDate`}
              startDateLabel={intl.formatMessage({
                id: 'BookingDatesForm.bookingStartTitle',
              })}
              startDatePlaceholderText={startDatePlaceholderText}
              endDateId={`${formId}.bookingEndDate`}
              endDateLabel={intl.formatMessage({
                id: 'BookingDatesForm.bookingEndTitle',
              })}
              endDatePlaceholderText={endDatePlaceholderText}
              format={v => {
                const { startDate, endDate } = v || {};
                // Format the Final Form field's value for the DateRangePicker
                // DateRangePicker operates on local time zone, but the form uses listing's time zone
                const formattedStart = startDate
                  ? timeOfDayFromTimeZoneToLocal(startDate, timeZone)
                  : startDate;
                const endDateForPicker =
                  isDaily && endDate ? getInclusiveEndDate(endDate, timeZone) : endDate;
                const formattedEnd = endDateForPicker
                  ? timeOfDayFromTimeZoneToLocal(endDateForPicker, timeZone)
                  : endDateForPicker;
                return v ? { startDate: formattedStart, endDate: formattedEnd } : v;
              }}
              parse={v => {
                const { startDate, endDate } = v || {};
                return v ? getStartAndEndOnTimeZone(startDate, endDate, isDaily, timeZone) : v;
              }}
              useMobileMargins
              validate={composeValidators(
                required(
                  intl.formatMessage({
                    id: 'BookingDatesForm.requiredDate',
                  })
                ),
                bookingDatesRequired(startDateErrorMessage, endDateErrorMessage)
              )}
              isDayBlocked={isDayBlocked}
              isOutsideRange={isOutsideRange}
              isBlockedBetween={isBlockedBetween(relevantTimeSlots, timeZone)}
              disabled={fetchLineItemsInProgress || (priceVariants.length > 0 && !priceVariantName)}
              showLabelAsDisabled={priceVariants.length > 0 && !priceVariantName}
              showPreviousMonthStepper={showPreviousMonthStepper(currentMonth, timeZone)}
              showNextMonthStepper={showNextMonthStepper(
                currentMonth,
                dayCountAvailableForBooking,
                timeZone
              )}
              onMonthChange={date => {
                const localizedDate = timeOfDayFromLocalToTimeZone(date, timeZone);
                onMonthClick(localizedDate < currentMonth ? prevMonthFn : nextMonthFn);
                setCurrentMonth(localizedDate);
              }}
              onClose={() => {
                setCurrentMonth(startDate || endDate || startOfToday);
              }}
              onChange={values => {
                const { startDate: startDateFromValues, endDate: endDateFromValues } = values || {};
                const { startDate, endDate } = values
                  ? getStartAndEndOnTimeZone(
                    startDateFromValues,
                    endDateFromValues,
                    isDaily,
                    timeZone
                  )
                  : {};
                if (seatsEnabled) {
                  formApi.change('seats', 1);
                }
                onHandleFetchLineItems({
                  values: {
                    priceVariantName,
                    startDate,
                    endDate,
                    seats: seatsEnabled ? 1 : undefined,
                    deliveryfee: formApi.getState().values.deliveryfee / 100,
                    deliveryMethod: formApi.getState().values?.deliveryMethod,
                    productType: productType,
                  },
                });
              }}
            />

            {seatsEnabled ? (
              <FieldSelect
                name="seats"
                id="seats"
                label={intl.formatMessage({ id: 'BookingDatesForm.seatsTitle' })}
                // disabled={!(startDate && endDate)}
                // showLabelAsDisabled={!(startDate && endDate)}
                className={css.fieldSeats}
                onChange={values => {
                  onHandleFetchLineItems({
                    values: {
                      priceVariantName,
                      startDate: startDate,
                      endDate: endDate,
                      seats: values,
                    },
                  });
                }}
              >
                <option disabled value="">
                  {intl.formatMessage({ id: 'BookingDatesForm.seatsPlaceholder' })}
                </option>
                {rentStockArray.map((item, index) => (
                  <option key={index} value={item.option}>
                    {item.label}
                  </option>
                ))}
              </FieldSelect>
            ) : null}

            {showEstimatedBreakdown ? (
              <div className={css.priceBreakdownContainer}>
                <H6 as="h3" className={css.bookingBreakdownTitle}>
                  <FormattedMessage id="BookingDatesForm.priceBreakdownTitle" />
                </H6>
                {/* <hr className={css.totalDivider} /> */}
                <EstimatedCustomerBreakdownMaybe
                  breakdownData={breakdownData}
                  lineItems={lineItems}
                  timeZone={timeZone}
                  currency={unitPrice.currency}
                  marketplaceName={marketplaceName}
                  processName={BOOKING_PROCESS_NAME}
                />
              </div>
            ) : null}
            {fetchLineItemsError &&
              !fetchLineItemsInProgress &&
              !calculateLocationRequest &&
              !(
                productType === 'rent' &&
                values?.deliveryMethod === 'delivery' &&
                values?.userLocation?.selectedPlace?.address
              ) ? (
              <span className={css.sideBarError}>
                <FormattedMessage id="BookingDatesForm.fetchLineItemsError" />
              </span>
            ) : null}
            <div className={css.termPolicyLink}>
              {/* <div className={css.checkBox}>
                <input type="checkbox" />
              </div>
              <a href="#">dddd</a> */}
              <FieldCheckbox
                id={"checkboxName"}
                className={css.dayOfWeekContent}
                name="term"
               label={privacyPolicyText}
              />
            </div>
            <div className={css.feeHelp}>
              <BrandIconCard type="information" />
              <span>
                The fee helps us run this platform and provide the best possible service to you!
              </span>
            </div>
            <div className={css.submitButton}>
              <PrimaryButton
                type="submit"
                inProgress={fetchLineItemsInProgress}
                disabled={submitDisabled || areButtonsDisabled}
              >
                {productType == 'rent' ? (
                  <FormattedMessage id="BookingDatesForm.requestToRent" />
                ) : (
                  <FormattedMessage id="BookingDatesForm.requestToBook" />
                )}
              </PrimaryButton>
            </div>
            {!isOwnListing ? (
              <div className={css.addToCartBtns}>
                <PrimaryButton
                  type="button"
                  className={classNames(
                    bookmarks &&
                      Array.isArray(bookmarks) &&
                      bookmarks.findIndex(e => {
                        const startMoment = moment(e?.startDate);
                        const endMoment = moment(e?.endDate);
                        const dateMomentStart = moment(values?.bookingDates?.startDate);
                        const dateMomentEnd = moment(values?.bookingDates?.endDate);
                        return (
                          e.id == listingId &&
                          e?.userId == currentUser?.id?.uuid &&
                          (dateMomentStart.isBetween(startMoment, endMoment, null, '[]') ||
                            dateMomentEnd.isBetween(startMoment, endMoment, null, '[]'))
                        );
                      }) > -1
                      ? null
                      : css.bookmark
                  )}
                  onClick={e => {
                    !auth ? history.push('/login') : handleAddToCart(values);
                  }}
                  // disabled={submitDisable}
                  disabled={submitDisabled || areButtonsDisabled}
                >
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.3484 22.5H6.64844C4.17344 22.5 2.14844 20.475 2.14844 18V17.85L2.59844 5.85C2.67344 3.375 4.69844 1.5 7.09844 1.5H17.8984C20.2984 1.5 22.3234 3.375 22.3984 5.85L22.8484 17.85C22.9234 19.05 22.4734 20.175 21.6484 21.075C20.8234 21.975 19.6984 22.5 18.4984 22.5H18.3484ZM7.09844 3C5.44844 3 4.17344 4.275 4.09844 5.85L3.64844 18C3.64844 19.65 4.99844 21 6.64844 21H18.4984C19.3234 21 20.0734 20.625 20.5984 20.025C21.1234 19.425 21.4234 18.675 21.4234 17.85L20.9734 5.85C20.8984 4.2 19.6234 3 17.9734 3H7.09844Z"
                      fill="#222222"
                    />
                    <path
                      d="M12.5 10.5C9.575 10.5 7.25 8.175 7.25 5.25C7.25 4.8 7.55 4.5 8 4.5C8.45 4.5 8.75 4.8 8.75 5.25C8.75 7.35 10.4 9 12.5 9C14.6 9 16.25 7.35 16.25 5.25C16.25 4.8 16.55 4.5 17 4.5C17.45 4.5 17.75 4.8 17.75 5.25C17.75 8.175 15.425 10.5 12.5 10.5Z"
                      fill="#222222"
                    />
                  </svg>

                  {/* <IconCollection icon="Icon-bag" /> */}
                  {bookmarks &&
                    Array.isArray(bookmarks) &&
                    bookmarks?.find(bookmark => bookmark.id === listingId?.uuid) ? (
                    'Remove from Cart'
                  ) : (
                    <FormattedMessage id="BookingDatesForm.addToCart" />
                  )}
                </PrimaryButton>
              </div>
            ) : null}
            <p className={css.finePrint}>
              {payoutDetailsWarning ? (
                payoutDetailsWarning
              ) : (
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingDatesForm.ownListing'
                      : 'BookingDatesForm.youWontBeChargedInfo'
                  }
                />
              )}
            </p>
          </Form>
        );
      }}
    />
  );
};

export default BookingDatesForm;
