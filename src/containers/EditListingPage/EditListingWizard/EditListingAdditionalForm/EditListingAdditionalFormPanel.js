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
import css from './EditListingPartyAdditionalFromPanel.module.css';
import EditListingAdditionalForm from './EditListingAdditionalForm';
import { categories } from '../../../../util/constants';
import Swal from 'sweetalert2';

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};


const getInitialValues = props => {
  const { listing, listingTypes } = props;
  const{images=[]}= listing|| {};
  const {title,description,publicData} = listing?.attributes;
  const {
    tags,
    category,
    selectedCategoryOptions,
    tagsType
  } = publicData || {};
  
  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  // Note: infinite stock is refilled to billiard using "stockUpdateMaybe"

  return {
    images,
    title: title =="dummy"? "": title,
    description:description=="dummy"? "": description,
    tags,
    category: category,
    selectedCategoryOptions,
     tagsType: tagsType ?tagsType :'keep_ai_tags',
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
    onFetchExceptions,
    routeConfiguration,
    history,
    prevButton,
    onRemoveImage,
    onManageDisableScrolling
  } = props;

const listingImageConfig = config.layout.listingImage;

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
            id="EditListingAdditionalForm.createListingDescription"
          />
      </div>

      <EditListingAdditionalForm
        className={css.form}
        initialValues={initialValues}
        prevButton={prevButton}
        onRemoveImage={onRemoveImage}
onManageDisableScrolling={onManageDisableScrolling}
        onSubmit={values => {
          const {
            title,
            description,
            tags,
            category,
            selectedCategoryOptions,
            tagsType,
            images
          } = values;


          const aiTags = listing?.attributes?.publicData?.aiTags;
          // New values for listing attributes
          const updateValues = {
            title,
            images,
            description,
            publicData: {
              tags:tagsType == 'keep_ai_tags'? aiTags : tags,
              category,
              selectedCategoryOptions,
              tagsType: tagsType ? tagsType : 'keep_ai_tags',
            }
          };
          if(!title || !description || !category||!selectedCategoryOptions||selectedCategoryOptions?.length==0||tagsType) {
            if(!title) {
              return getFieldMissingError("Title is missing");
            }
            if(!description) {
              return getFieldMissingError("Description is missing");
            }
            if(!category) {
              return getFieldMissingError("Category is missing");
            }
            if(!selectedCategoryOptions || selectedCategoryOptions?.length==0) {
              return getFieldMissingError("Sub Categories are missing");
            }
            if(tagsType=='keep_manual_tags') {
              if(!tags||tags?.length==0) {
                return getFieldMissingError("Please select Tags");
              }
            }
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
        listingImageConfig={listingImageConfig}
        
      />

    </div>
  );
};

export default EditListingPartyThemePanel;
