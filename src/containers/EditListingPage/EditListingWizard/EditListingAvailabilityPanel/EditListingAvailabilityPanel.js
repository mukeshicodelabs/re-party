import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { getDefaultTimeZoneOnBrowser, timestampToDate } from '../../../../util/dates';
import { AVAILABILITY_MULTIPLE_SEATS, LISTING_STATE_DRAFT, STOCK_INFINITE_ITEMS } from '../../../../util/types';
import { DAY, isFullDay } from '../../../../transactions/transaction';

// Import shared components
import { Button, H3, InlineTextButton, ListingLink, Modal } from '../../../../components';
import { types as sdkTypes } from '../../../../util/sdkLoader';
// Import modules from this directory
import EditListingAvailabilityPlanForm from './EditListingAvailabilityPlanForm';
import EditListingAvailabilityExceptionForm from './EditListingAvailabilityExceptionForm';
import WeeklyCalendar from './WeeklyCalendar/WeeklyCalendar';

import css from './EditListingAvailabilityPanel.module.css';
import EditListingDetailsFormWithAi from './EditListingDetailsFormWithAi/EditListingDetailsFormWithAi';

// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const { Money } = sdkTypes;
// This is the order of days as JavaScript understands them
// The number returned by "new Date().getDay()" refers to day of week starting from sunday.
const rotateDays = (days, startOfWeek) => {
  return startOfWeek === 0 ? days : days.slice(startOfWeek).concat(days.slice(0, startOfWeek));
};

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'Etc/UTC';

///////////////////////////////////////////////////
// EditListingAvailabilityExceptionPanel - utils //
///////////////////////////////////////////////////

// Create initial entry mapping for form's initial values
const createEntryDayGroups = (entries = {}) => {
  // Collect info about which days are active in the availability plan form:
  let activePlanDays = [];
  return entries.reduce((groupedEntries, entry) => {
    const { startTime, endTime: endHour, dayOfWeek, seats } = entry;
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
          seats,
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
    activePlanDays: WEEKDAYS
  };
};
// Create initial values for the availability plan
const createInitialPlanValues = availabilityPlan => {
  const { timezone, entries } = availabilityPlan || {};
  const tz = timezone || defaultTimeZone();
  return {
    timezone: tz,
    ...createEntryDayGroups(entries),
  };
};

// Create entries from submit values
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

// Create availabilityPlan from submit values
const createAvailabilityPlan = values => ({
  availabilityPlan: {
    type: 'availability-plan/time',
    timezone: values.timezone,
    entries: createEntriesFromSubmitValues(values),
  },
});

//////////////////////////////////
// EditListingAvailabilityPanel //
//////////////////////////////////

/**
 * @typedef {Object} AvailabilityException
 * @property {string} id
 * @property {'availabilityException'} type 'availabilityException'
 * @property {Object} attributes attributes
 * @property {Date} attributes.start The start of availability exception (inclusive)
 * @property {Date} attributes.end The end of availability exception (exclusive)
 * @property {Number} attributes.seats the number of seats available (0 means 'unavailable')
 */
/**
 * @typedef {Object} ExceptionQueryInfo
 * @property {Object|null} fetchExceptionsError
 * @property {boolean} fetchExceptionsInProgress
 */

/**
 * A panel where provider can set availabilityPlan (weekly default schedule)
 * and AvailabilityExceptions.
 * In addition, it combines the set values of both of those and shows a weekly schedule.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object} props.params pathparams
 * @param {Object?} props.locationSearch parsed search params
 * @param {Object?} props.listing listing entity from API (draft/published/etc.)
 * @param {Array<Object>} props.listingTypes listing type config from asset delivery API
 * @param {boolean} props.disabled
 * @param {boolean} props.ready
 * @param {Object.<string, ExceptionQueryInfo>?} props.monthlyExceptionQueries E.g. '2022-12': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {Object.<string, ExceptionQueryInfo>?} props.weeklyExceptionQueries E.g. '2022-12-14': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {Array<AvailabilityException>} props.allExceptions
 * @param {Function} props.onAddAvailabilityException
 * @param {Function} props.onDeleteAvailabilityException
 * @param {Function} props.onFetchExceptions
 * @param {Function} props.onSubmit
 * @param {Function} props.onManageDisableScrolling
 * @param {Function} props.onNextTab
 * @param {string} props.submitButtonText
 * @param {boolean} props.updateInProgress
 * @param {Object} props.errors
 * @param {Object} props.config app config
 * @param {Object} props.routeConfiguration
 * @param {Object} props.history history from React Router
 * @returns {JSX.Element} containing form that allows adding availability exceptions
 */
const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
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

  const publicData = listing?.attributes?.publicData;
  const {
    flatPrice,
    rentalPrice,
    tags,
    category,
    event_type,
    select_color,
    theme_style,
    styleInspiration,
    salePrice,
     } = publicData || {};


  const flatPriceAsMoney = flatPrice ? new Money(flatPrice.amount, flatPrice.currency) : null;

  const rentalPriceAsMoney = rentalPrice ? new Money(rentalPrice.amount, rentalPrice.currency) : null;

  const salePriceMoney = salePrice ? new Money(salePrice.amount, salePrice.currency) : null;
  // Convert deliveryFee array into nested object structure

  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);
  const listingAvailabilityPlan = props?.listing?.availabilityPlan || defaultAvailabilityPlan;
  const availabilityPlan = createInitialPlanValues(listingAvailabilityPlan);

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
    price,
    stock,
    stockTypeInfinity,
    availabilityPlan,
    tags,
    category,
    event_type,
    select_color,
    theme_style,
    styleInspiration,
    flatPrice: flatPriceAsMoney,
    rentalPrice: rentalPriceAsMoney,
    salePrice: salePriceMoney,
  };
};
const EditListingAvailabilityPanel = props => {
  const [state, setState] = useState({ initialValues: getInitialValues(props) });
  const {
    className,
    rootClassName,
    params,
    locationSearch,
    listing,
    listingTypes,
    monthlyExceptionQueries,
    weeklyExceptionQueries,
    allExceptions = [],
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    disabled,
    ready,
    onFetchExceptions,
    onSubmit,
    onManageDisableScrolling,
    onNextTab,
    submitButtonText,
    updateInProgress,
    errors,
    config,
    routeConfiguration,
    history,
    listingMinimumPriceSubUnits,
    marketplaceCurrency,
    panelUpdated,
    prevButton
  } = props;
  const { publicData } = listing?.attributes || {}
  const { updateListingError, showListingsError, setStockError } = errors || {}
  const initialValues = state.initialValues;

  const defaultAvailabilityPlan = {
    type: 'availability-plan/time',
    timezone: defaultTimeZone(),
    entries: [
      { dayOfWeek: 'mon', startTime: '09:00', endTime: '17:00', seats: 1 },
      { dayOfWeek: 'tue', startTime: '09:00', endTime: '17:00', seats: 1 },
      { dayOfWeek: 'wed', startTime: '09:00', endTime: '17:00', seats: 1 },
      { dayOfWeek: 'thu', startTime: '09:00', endTime: '17:00', seats: 1 },
      { dayOfWeek: 'fri', startTime: '09:00', endTime: '17:00', seats: 1 },
      { dayOfWeek: 'sat', startTime: '09:00', endTime: '17:00', seats: 1 },
      { dayOfWeek: 'sun', startTime: '09:00', endTime: '17:00', seats: 1 },
    ],
  };
  // Hooks
  const [customeAv, setCustomeAv] = useState({
    availabilityPlan: listing?.attributes?.availabilityPlan || defaultAvailabilityPlan
  });
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isEditExceptionsModalOpen, setIsEditExceptionsModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [isNextTab, setNextTab] = useState(false);
  const { state: listingState } = listing?.attributes || {};

  // useEffect(() => {
  //   setCustomeAv({availabilityPlan: defaultAvailabilityPlan})
  // }, [])
  const firstDayOfWeek = config.localization.firstDayOfWeek;
  const classes = classNames(rootClassName || css.root, className);
  const listingAttributes = listing?.attributes;
  const { listingType, unitType } = listingAttributes?.publicData || {};
  const listingTypeConfig = listingTypes.find(conf => conf.listingType === listingType);

  const useFullDays = isFullDay(unitType);
  const useMultipleSeats = listingTypeConfig?.availabilityType === AVAILABILITY_MULTIPLE_SEATS;

  const hasAvailabilityPlan = !!listingAttributes?.availabilityPlan;
  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;

  const availabilityPlan = listingAttributes?.availabilityPlan || defaultAvailabilityPlan;
  const initialPlanValues = valuesFromLastSubmit
    ? valuesFromLastSubmit
    : createInitialPlanValues(availabilityPlan);

  const intialAvailabilityPlan = createInitialValues(
    listing?.availabilityPlan || defaultAvailabilityPlan
  );
  const handleAvailabilitySubmit = values => {
    setValuesFromLastSubmit(values);
    const availability = createAvailabilityPlan(values);
    setCustomeAv(availability || defaultAvailabilityPlan);
    setIsEditPlanModalOpen(false);
  };
  const handlePlanSubmit = values => {
    setValuesFromLastSubmit(values);

    // Final Form can wait for Promises to return.
    return onSubmit(createAvailabilityPlan(values))
      .then(() => {
        const availability = createAvailabilityPlan(values);

        setCustomeAv(availability || defaultAvailabilityPlan);
        setIsEditPlanModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const sortedAvailabilityExceptions = allExceptions;

  // Save exception click handler
  const saveException = values => {
    const { availability, exceptionStartTime, exceptionEndTime, exceptionRange, seats } = values;

    const seatCount = seats != null ? seats : availability === 'available' ? 1 : 0;

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
      seats: seatCount,
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

  return (
    <main className={classes}>
      <H3 as="h1" className={css.heading}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingAvailabilityPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingDetailsFormWithAi
        className={css.form}
        initialValues={initialValues}
        prevButton={prevButton}
        onSubmit={values => {
          const {
            price,
            stock,
            stockTypeInfinity,
            tags,
            rentalPrice,
            flatPrice,
            styleInspiration,
            salePrice,
            category,
            event_type,
            select_color,
            theme_style
          } = values;


          // Update stock only if the value has changed, or stock is infinity in stockType,
          // but not current stock is a small number (might happen with old listings)
          // NOTE: this is going to be used on a separate call to API
          // in EditListingPage.duck.js: sdk.stock.compareAndSet();

          const hasStockTypeInfinityChecked = stockTypeInfinity?.[0] === 'infinity';
          const hasNoCurrentStock = listing?.currentStock?.attributes?.quantity == null;
          const hasStockQuantityChanged = stock && stock !== initialValues.stock;
          const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingTypeConfig?.stockType);
          // currentStockQuantity is null or undefined, return null - otherwise use the value
          const oldTotal = hasNoCurrentStock ? null : initialValues.stock;
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
                    newTotal: stock,
                  },
                }
                : {};

          const customizeAvaliablity =
            (publicData?.productType === 'rent' || publicData?.productType === 'both') &&
              !props?.listing?.availabilityPlan &&
              customeAv?.availabilityPlan
              ? {
                availabilityPlan: customeAv.availabilityPlan,
              }
              : {};

          // New values for listing attributes
          const updateValues = {
            price: rentalPrice ? rentalPrice : salePrice,
            ...stockUpdateMaybe,
            ...customizeAvaliablity,
            publicData: {
              tags,
              category,
              event_type,
              select_color,
              theme_style,
              salePrice: salePrice ? { amount: salePrice?.amount, currency: salePrice?.currency } : null,
              rentalPrice: rentalPrice ? { amount: rentalPrice?.amount, currency: rentalPrice?.currency } : null,
              flatPrice: flatPrice ? { amount: flatPrice?.amount, currency: flatPrice?.currency } : null,
              styleInspiration,
            }
          };

          // Return the promise from onSubmit and chain the onNextTab call
          return onSubmit(updateValues)
            .then(() => {
              setNextTab(true)
              if(listingState === "draft" ){
                onNextTab()
              }
            })
            .catch(error => {
              // Handle error if needed
              console.error('Submission failed:', error);
              throw error; // Re-throw to let FinalForm handle the error
            });
        }}
        listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
        marketplaceCurrency={marketplaceCurrency}
        listingType={listingTypeConfig}
        listingTypeConfig={listingTypeConfig}
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
        useMultipleSeats={useMultipleSeats}
        intialAvailabilityPlan={intialAvailabilityPlan}
        initialPlanValues={initialPlanValues}
        isEditExceptionsModalOpen={isEditExceptionsModalOpen}
        allExceptions={allExceptions}
        monthlyExceptionQueries={monthlyExceptionQueries}
        saveException={saveException}
        rotateDays={rotateDays}
        WEEKDAYS={WEEKDAYS}
        handleAvailabilitySubmit={handleAvailabilitySubmit}
        listing={listing}
        handlePlanSubmit={handlePlanSubmit}
      />
      {/* <div className={css.planInfo}>
        {!hasAvailabilityPlan ? (
          <p>
            <FormattedMessage id="EditListingAvailabilityPanel.availabilityPlanInfo" />
          </p>
        ) : null}

        <InlineTextButton
          className={css.editPlanButton}
          onClick={() => setIsEditPlanModalOpen(true)}
        >
          {hasAvailabilityPlan ? (
            <FormattedMessage id="EditListingAvailabilityPanel.editAvailabilityPlan" />
          ) : (
            <FormattedMessage id="EditListingAvailabilityPanel.setAvailabilityPlan" />
          )}
        </InlineTextButton>
      </div> */}

      {/* {hasAvailabilityPlan ? (
        <>
          <WeeklyCalendar
            className={css.section}
            headerClassName={css.sectionHeader}
            listingId={listing.id}
            availabilityPlan={availabilityPlan}
            availabilityExceptions={sortedAvailabilityExceptions}
            weeklyExceptionQueries={weeklyExceptionQueries}
            isDaily={unitType === DAY}
            useFullDays={useFullDays}
            useMultipleSeats={useMultipleSeats}
            onDeleteAvailabilityException={onDeleteAvailabilityException}
            onFetchExceptions={onFetchExceptions}
            params={params}
            locationSearch={locationSearch}
            firstDayOfWeek={firstDayOfWeek}
            routeConfiguration={routeConfiguration}
            history={history}
          />

          <section className={css.section}>
            <InlineTextButton
              className={css.addExceptionButton}
              onClick={() => setIsEditExceptionsModalOpen(true)}
              disabled={disabled || !hasAvailabilityPlan}
              ready={ready}
            >
              <FormattedMessage id="EditListingAvailabilityPanel.addException" />
            </InlineTextButton>
          </section>
        </>
      ) : null} */}

      {/* {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      ) : null} */}

      {/* 
      {!isPublished ? (
        <Button
          className={css.goToNextTabButton}
          onClick={onNextTab}
          disabled={!hasAvailabilityPlan}
        >
          {submitButtonText}
        </Button>
      ) : null}

      {onManageDisableScrolling && isEditPlanModalOpen ? (
        <Modal
          id="EditAvailabilityPlan"
          isOpen={isEditPlanModalOpen}
          onClose={() => setIsEditPlanModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAvailabilityPlanForm
            formId="EditListingAvailabilityPlanForm"
            listingTitle={listingAttributes?.title}
            availabilityPlan={availabilityPlan}
            weekdays={rotateDays(WEEKDAYS, firstDayOfWeek)}
            onSubmit={handlePlanSubmit}
            initialValues={initialPlanValues}
            inProgress={updateInProgress}
            fetchErrors={errors}
            useFullDays={useFullDays}
            useMultipleSeats={useMultipleSeats}
            unitType={unitType}
          />
        </Modal>
      ) : null}

      {onManageDisableScrolling && isEditExceptionsModalOpen ? (
        <Modal
          id="EditAvailabilityExceptions"
          isOpen={isEditExceptionsModalOpen}
          onClose={() => setIsEditExceptionsModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAvailabilityExceptionForm
            formId="EditListingAvailabilityExceptionForm"
            listingId={listing.id}
            allExceptions={allExceptions}
            monthlyExceptionQueries={monthlyExceptionQueries}
            fetchErrors={errors}
            onFetchExceptions={onFetchExceptions}
            onSubmit={saveException}
            timeZone={availabilityPlan.timezone}
            unitType={unitType}
            updateInProgress={updateInProgress}
            useFullDays={useFullDays}
            listingTypeConfig={listingTypeConfig}
          />
        </Modal>
      ) : null} */}
    </main>
  );
};

export default EditListingAvailabilityPanel;
