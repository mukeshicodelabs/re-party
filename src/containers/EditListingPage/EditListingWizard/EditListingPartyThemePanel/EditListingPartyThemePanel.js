import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, STOCK_INFINITE_ITEMS, propTypes } from '../../../../util/types';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { isValidCurrencyForTransactionProcess } from '../../../../util/fieldHelpers';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPartyThemeForm from './EditListingPartyThemeForm';
import css from './EditListingPartyThemePanel.module.css';
import { getDefaultTimeZoneOnBrowser } from '../../../../util/dates';
import { isFullDay } from '../../../../transactions/transaction';
import Swal from 'sweetalert2';

const { Money } = sdkTypes;
const BILLIARD = 1000000000000000;

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};


const getInitialValues = props => {
  const { listing, listingTypes } = props;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const price = listing?.attributes?.price;
  const currentStock = listing?.currentStock;

  const publicData = listing?.attributes?.publicData;
  const {
    tags,
    category,
    event_type,
    select_color,
    theme_style,
    styleInspiration,
    selectedCategoryOptions,
    listingType,
    productType
  } = publicData || {};
 

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  // Note: infinite stock is refilled to billiard using "stockUpdateMaybe"

  return {
    tags,
    category,
    event_type,
    event_type,
    select_color,
    theme_style,
    styleInspiration,
    selectedCategoryOptions,
    listingType:productType
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
const EditListingPartyThemePanel = props => {
  // State is needed since re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props) });

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
    prevButton
  } = props;

  const { custom } = params || {};
  const getFieldMissingError = (message) => {
       Swal.fire({
        toast: true,
        position: 'top-end', // 'top-end' is better for toasts
        icon: 'error',
        text: message || 'Oops, something is missing',
        showConfirmButton: false,
        timer: 3000, // Closes after 5 seconds
        timerProgressBar: true,
        didOpen: (toast) => {
          // Change timer progress bar color to red
          const progressBar = toast.querySelector('.swal2-timer-progress-bar');
          if (progressBar) {
            progressBar.style.backgroundColor = 'red';
          }
        },
      })
    }

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = state.initialValues;

  // Form needs to know data from listingType
  const publicData = listing?.attributes?.publicData;
  const unitType = publicData.unitType;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);

  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  // Don't render the form if the assigned currency is different from the marketplace currency
  // or if transaction process is incompatible with selected currency
  const listingAttributes = listing?.attributes;

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
            id="EditListingPartyThemePanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      <div className={css.subText}>
         <FormattedMessage
            id="EditListingPartyThemePanel.createListingDescription"
          />
      </div>

      <EditListingPartyThemeForm
        className={css.form}
        initialValues={initialValues}
        prevButton={prevButton}
        onSubmit={values => {
          const {
            tags,
            category,
            event_type,
            select_color,
            theme_style,
            styleInspiration,
            selectedCategoryOptions,
            listingType
          } = values; 

          const updatedTransactionProcessalias = listingType == "sell" 
             ? "default-purchase/release-1"
             :listingType == "rent"
             ? "default-booking/release-1"
             :null

            const updatedUnitType = listingType == 'sell'
              ? 'item'
              : listingType == 'rent'
                ? 'day'
                : null;
            const updatedListingType = listingType == 'sell'
              ? 'sell-purchase'
              : listingType == 'rent'
                ? 'daily-rental'
                : null; 


          // New values for listing attributes
          const updateValues = {
            publicData: {
              tags,
              category,
              categoryLevel1:category,
              event_type,
              select_color,
              theme_style,
              styleInspiration,
              selectedCategoryOptions,
              listingType,
              productType:listingType,
              transactionProcessAlias:updatedTransactionProcessalias,
              unitType:updatedUnitType,
              listingType:updatedListingType,
            }
          };
          // Save the initialValues to state
          // Otherwise, re-rendering would overwrite the values during XHR call.
          // setState({
          //   initialValues: {
          //     price:rentalPrice,
          //     stock: stockUpdateMaybe?.stockUpdate?.newTotal || stock,
          //     stockTypeInfinity,
          //   },
          // });
          if (!event_type||event_type.length===0 || !select_color||select_color.length === 0||!listingType) {
            if(!listingType) {
              return getFieldMissingError('Listing type is missing');
            }
            if (!event_type||event_type.length===0) {
              return getFieldMissingError('Event type is missing');
            }
            if (!select_color||select_color.length === 0) {
              return getFieldMissingError('Color selection is missing');
            }
          } else {
            onSubmit(updateValues);
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
        onFetchExceptions={onFetchExceptions}
        params={params}
        locationSearch={locationSearch}
        routeConfiguration={routeConfiguration}
        history={history}
        listingAttributes={listingAttributes}
        listing={listing}
      />

    </div>
  );
};

export default EditListingPartyThemePanel;
