import React from 'react';

// Import configs and util modules
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  LISTING_PAGE_PARAM_TYPE_NEW,
} from '../../../util/urlHelpers';
import { ensureListing } from '../../../util/data';
import { createResourceLocatorString } from '../../../util/routes';

// Import modules from this directory
import EditListingAvailabilityPanel from './EditListingAvailabilityPanel/EditListingAvailabilityPanel';
import EditListingDetailsPanel from './EditListingDetailsPanel/EditListingDetailsPanel';
import EditListingDeliveryPanel from './EditListingDeliveryPanel/EditListingDeliveryPanel';
import EditListingLocationPanel from './EditListingLocationPanel/EditListingLocationPanel';
import EditListingPhotosPanel from './EditListingPhotosPanel/EditListingPhotosPanel';
import EditListingPricingPanel from './EditListingPricingPanel/EditListingPricingPanel';
import EditListingPricingAndStockPanel from './EditListingPricingAndStockPanel/EditListingPricingAndStockPanel';
import EditListingPartyThemePanel from './EditListingPartyThemePanel/EditListingPartyThemePanel';
import EditListingAdditionalForm from './EditListingAdditionalForm/EditListingAdditionalFormPanel';
import css from './EditListingWizardTab.module.css';

export const DETAILS = 'details';
export const PRICING = 'pricing';
export const PRICING_AND_STOCK = 'pricing-and-stock';
export const DELIVERY = 'delivery';
export const LOCATION = 'location';
export const AVAILABILITY = 'availability';
export const PHOTOS = 'photos';
export const PARTY_THEME = 'party-theme';
export const ADDITIONAL_FORM = 'additional-form';

// EditListingWizardTab component supports these tabs
export const SUPPORTED_TABS = [
  DETAILS,
  PRICING,
  PRICING_AND_STOCK,
  DELIVERY,
  LOCATION,
  AVAILABILITY,
  PHOTOS,
  PARTY_THEME,
  ADDITIONAL_FORM
];

const pathParamsToNextTab = (params, tab, marketplaceTabs) => {
  const nextTabIndex = marketplaceTabs.findIndex(s => s === tab) + 1;
  const nextTab =
    nextTabIndex < marketplaceTabs.length
      ? marketplaceTabs[nextTabIndex]
      : marketplaceTabs[marketplaceTabs.length - 1];
  return { ...params, tab: nextTab };
};

// When user has update draft listing, he should be redirected to next EditListingWizardTab
const redirectAfterDraftUpdate = (listingId, params, tab, marketplaceTabs, history, routes) => {
  const listingUUID = listingId.uuid;
  const currentPathParams = {
    ...params,
    type: params?.type == "edit" ? LISTING_PAGE_PARAM_TYPE_EDIT : LISTING_PAGE_PARAM_TYPE_DRAFT,
    id: listingUUID,
  };

  // Replace current "new" path to "draft" path.
  // Browser's back button should lead to editing current draft instead of creating a new one.
  if (params.type === LISTING_PAGE_PARAM_TYPE_NEW) {
    const draftURI = createResourceLocatorString('EditListingPage', routes, currentPathParams, {});
    history.replace(draftURI);
  }

  // Redirect to next tab
  const nextPathParams = pathParamsToNextTab(currentPathParams, tab, marketplaceTabs);
  const to = createResourceLocatorString('EditListingPage', routes, nextPathParams, {});
  history.push(to);
};

/**
 * A single tab on the EditListingWizard.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element} EditListingWizardTab component
 */
const EditListingWizardTab = props => {
  const {
    tab,
    marketplaceTabs,
    params,
    oncheckDeliveryLocation,
    locationSearch,
    errors,
    fetchInProgress,
    newListingPublished,
    handleCreateFlowTabScrolling,
    handlePublishListing,
    history,
    images,
    refineImage,
    listing,
    weeklyExceptionQueries,
    monthlyExceptionQueries,
    allExceptions,
    onFetchExceptions,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onUpdateListing,
    onCreateListingDraft,
    onImageUpload,
    onManageDisableScrolling,
    onListingTypeChange,
    onRemoveImage,
    updatedTab,
    updateInProgress,
    tabSubmitButtonText,
    config,
    routeConfiguration,
    onGetAiListingCreationData,
    onGetAiListingImage,
    onfetchImageDesc,
    onupdateNumberOfAiImagesCreation,
    aiData,
    aiDataError,
    aiDataInProgress,
    aiImage,
    aiImageError,
    aiImageInProgress,
    uploadImageInProgress,
    currentUser
  } = props;

  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;

  const currentListing = ensureListing(listing);

  // New listing flow has automatic redirects to new tab on the wizard
  // and the last panel calls publishListing API endpoint.
  const automaticRedirectsForNewListingFlow = (tab, listingId) => {
    const type=params?.type; 
    if (tab !== marketplaceTabs[marketplaceTabs.length - 1]) { 
      // Create listing flow: smooth scrolling polyfill to scroll to correct tab
      handleCreateFlowTabScrolling(false); 
      // After successful saving of draft data, user should be redirected to next tab
      redirectAfterDraftUpdate(
        listingId,
        params,
        tab,
        marketplaceTabs,
        history,
        routeConfiguration
      );
    }
    // else if(type =='edit' && tab == marketplaceTabs[marketplaceTabs.length - 1]){
    //   redirectAfterDraftUpdate(
    //     listingId,
    //     params,
    //     tab,
    //     marketplaceTabs,
    //     history,
    //     routeConfiguration
    //   );
    // } 
    else {
      handlePublishListing(listingId);
    }
  };

  const onCompleteEditListingWizardTab = (tab, updateValues) => {
    const onUpdateListingOrCreateListingDraft = isNewURI
      ? (tab, values) => onCreateListingDraft(values, config)
      : (tab, values) => onUpdateListing(tab, values, config);

    const updateListingValues = isNewURI
      ? updateValues
      : { ...updateValues, id: currentListing.id };

    return onUpdateListingOrCreateListingDraft(tab, updateListingValues)
      .then(r => {
        // In Availability tab, the submitted data (plan) is inside a modal
        // We don't redirect provider immediately after plan is set
        // if (isNewListingFlow && tab !== AVAILABILITY) {
        if ( tab) {
          const listingId = r.data.data.id;
          automaticRedirectsForNewListingFlow(tab, listingId);
        }
        // else if(!isNewListingFlow && tab !== AVAILABILITY){
        //   const listingId = r.data.data.id;
        //   automaticRedirectsForNewListingFlow(tab, listingId);
        // }
      })
      .catch(e => {
        // No need for extra actions
      });
  };

  const panelProps = tab => {
    return {
      className: css.panel,
      errors,
      listing,
      panelUpdated: updatedTab === tab,
      params,
      locationSearch,
      updateInProgress,
      // newListingPublished and fetchInProgress are flags for the last wizard tab
      ready: newListingPublished,
      disabled: fetchInProgress,
      submitButtonText: tabSubmitButtonText,
      listingTypes: config.listing.listingTypes,
      onManageDisableScrolling,
      onSubmit: values => {
        return onCompleteEditListingWizardTab(tab, values);
      },
    };
  };
  const prevButton = () => {
    const currentTabIndex = marketplaceTabs.findIndex(tabName => tabName === tab);
    const prevTab =
      currentTabIndex > 0 ? marketplaceTabs[currentTabIndex - 1] : marketplaceTabs[0];
    const prevTabParams = { ...params, tab: prevTab };
    const to = createResourceLocatorString(
      'EditListingPage',
      routeConfiguration,
      prevTabParams,
    );
    history.push(to);
  }
  // TODO: add missing cases for supported tabs
  switch (tab) {
    case DETAILS: {
      return (
        <EditListingDetailsPanel
          {...panelProps(DETAILS)}
          onListingTypeChange={onListingTypeChange}
          config={config}
          images={images}
          refineImage={refineImage}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          onGetAiListingCreationData={onGetAiListingCreationData}
          aiData={aiData}
          aiDataError={aiDataError}
          aiDataInProgress={aiDataInProgress}
          prevButton={prevButton}
          uploadImageInProgress={uploadImageInProgress}
          currentUser={currentUser}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      );
    }
    case ADDITIONAL_FORM: {
      return (
        <EditListingAdditionalForm
          {...panelProps(ADDITIONAL_FORM)}
          onRemoveImage={onRemoveImage}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
          config={config}
          history={history}
          allExceptions={allExceptions}
          weeklyExceptionQueries={weeklyExceptionQueries}
          monthlyExceptionQueries={monthlyExceptionQueries}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          prevButton={prevButton}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      );
    }
    case PARTY_THEME: {
      return (
        <EditListingPartyThemePanel
          {...panelProps(PARTY_THEME)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
          config={config}
          history={history}
          allExceptions={allExceptions}
          weeklyExceptionQueries={weeklyExceptionQueries}
          monthlyExceptionQueries={monthlyExceptionQueries}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          prevButton={prevButton}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      );
    }
    case PRICING_AND_STOCK: {
      return (
        <EditListingPricingAndStockPanel
          {...panelProps(PRICING_AND_STOCK)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
          config={config}
          oncheckDeliveryLocation={oncheckDeliveryLocation}
          history={history}
          allExceptions={allExceptions}
          weeklyExceptionQueries={weeklyExceptionQueries}
          monthlyExceptionQueries={monthlyExceptionQueries}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          prevButton={prevButton}
        />
      );
    }
    case PRICING: {
      return (
        <EditListingPricingPanel
          {...panelProps(PRICING)}
          marketplaceCurrency={config.currency}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
          prevButton={prevButton}
        />
      );
    }
    case DELIVERY: {
      return (
        <EditListingDeliveryPanel 
        {...panelProps(DELIVERY)} 
        marketplaceCurrency={config.currency}  
        listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
        prevButton={prevButton}/>
      );
    }
    case LOCATION: {
      return <EditListingLocationPanel 
      {...panelProps(LOCATION)} 
      prevButton={prevButton}/>;
    }
    case AVAILABILITY: {
      return (
        <EditListingAvailabilityPanel
          allExceptions={allExceptions}
          prevButton={prevButton}
          weeklyExceptionQueries={weeklyExceptionQueries}
          monthlyExceptionQueries={monthlyExceptionQueries}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onNextTab={() =>
            redirectAfterDraftUpdate(
              listing.id,
              params,
              tab,
              marketplaceTabs,
              history,
              routeConfiguration
            )
          }
          config={config}
          history={history}
          routeConfiguration={routeConfiguration}
          listingMinimumPriceSubUnits={config.listingMinimumPriceSubUnits}
          marketplaceCurrency={config.currency}
          {...panelProps(AVAILABILITY)}
        />
      );
    }
    case PHOTOS: {
      return (
        <EditListingPhotosPanel
          {...panelProps(PHOTOS)}
          listingImageConfig={config.layout.listingImage}
          images={images}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          onGetAiListingImage={onGetAiListingImage}
          onfetchImageDesc={onfetchImageDesc}
          onupdateNumberOfAiImagesCreation={onupdateNumberOfAiImagesCreation}
          prevButton={prevButton}
          aiImage={aiImage}
          aiImageError={aiImageError}
          aiImageInProgress={aiImageInProgress}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      );
    }
    default:
      return null;
  }
};

export default EditListingWizardTab;
