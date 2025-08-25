import React, { useEffect } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { STOCK_INFINITE_ITEMS, STOCK_MULTIPLE_ITEMS, propTypes } from '../../../../util/types';
import { isOldTotalMismatchStockError } from '../../../../util/errors';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { maxLength, required } from '../../../../util/validators';
import {
  Button,
  Form,
  FieldCurrencyInput,
  FieldCheckboxGroup,
  FieldTextInput,
  FieldSelect,
  InlineTextButton,
  Modal,
  FieldLocationAutocompleteInput,
  FieldCheckbox,
  FieldRadioButton,
} from '../../../../components';
import css from './EditListingPricingAndStockForm.module.css';
import EditListingAvailabilityPlanForm from '../EditListingAvailabilityPanel/EditListingAvailabilityPlanForm';
import EditListingAvailabilityExceptionForm from '../EditListingAvailabilityPanel/EditListingAvailabilityExceptionForm';
import WeeklyCalendar from '../EditListingAvailabilityPanel/WeeklyCalendar/WeeklyCalendar';
import { DAY } from '../../../../transactions/transaction';
import {
  composeValidators,
  autocompleteSearchRequired,
  autocompletePlaceSelected,
} from '../../../../util/validators';
import {
  categories,
  customizableAddons,
  deliveryOptions,
  deliveryRanges,
  sellDeliveryOptions,
  shippingBoxSizes,
  shippingOptions,
  States,
} from '../../../../util/constants';
import { FieldArray } from 'react-final-form-arrays';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';

const { Money } = sdkTypes;
const MILLION = 1000000;
const identity = v => v;
const TITLE_MAX_LENGTH = 60;

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsgId = { id: 'EditListingPricingAndStockForm.priceRequired' };
  const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsgId = { id: 'EditListingPricingAndStockForm.priceTooLow' };
  const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(
    priceTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};

const UpdateStockToInfinityCheckboxMaybe = ({ hasInfiniteStock, currentStock, formId, intl }) => {
  return hasInfiniteStock && currentStock != null && currentStock < MILLION ? (
    <div className={css.input}>
      <p>
        <FormattedMessage
          id="EditListingPricingAndStockForm.updateToInfiniteInfo"
          values={{
            currentStock,
            b: msgFragment => <b>{msgFragment}</b>,
          }}
        />
      </p>
      <FieldCheckboxGroup
        id={`${formId}.stockTypeInfinity`}
        name="stockTypeInfinity"
        options={[
          {
            key: 'infinity',
            label: intl.formatMessage({
              id: 'EditListingPricingAndStockForm.updateToInfinite',
            }),
          },
        ]}
      />
    </div>
  ) : null;
};


export const EditListingPricingAndStockForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        formId = 'EditListingPricingAndStockForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready, 
        handleSubmit,
        invalid,
        pristine,
        marketplaceCurrency,
        unitType,
        listingMinimumPriceSubUnits = 0,
        listingType,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        config,
        hasAvailabilityPlan,
        availabilityPlan,
        sortedAvailabilityExceptions,
        weeklyExceptionQueries,
        useFullDays,
        onDeleteAvailabilityException,
        onFetchExceptions,
        params,
        locationSearch,
        firstDayOfWeek,
        routeConfiguration,
        history,
        errors,
        onManageDisableScrolling,
        isEditPlanModalOpen,
        setIsEditPlanModalOpen,
        listingAttributes,
        intialAvailabilityPlan,
        isEditExceptionsModalOpen,
        allExceptions,
        monthlyExceptionQueries,
        saveException,
        rotateDays,
        WEEKDAYS,
        handleAvailabilitySubmit,
        listing,
        setIsEditExceptionsModalOpen,
        form,
        prevButton,
        productType,
        notValidAddress,
        validatingAddress
      } = formRenderProps;

      const hasSellPickupAddress =
        !!values?.sellPickupAddress &&
        !!values?.sellPickupCity &&
        !!values?.sellPickupState &&
        !!values?.sellPickupZipCode;

      const hasRentPickupAddress =
        !!values?.rentPickupAddress &&
        !!values?.rentPickupCity &&
        !!values?.rentPickupState &&
        !!values?.rentPickupZipCode;
      // Consolidated useEffect hooks for better performance
      // Handle rent delivery options and related field resets
      useEffect(() => {
        const rentDeliveryOptions = values?.rentDeliveryOptions || [];
        const rentDeliveryAddressOption = values?.rentDeliveryAddressOption;

        if (rentDeliveryOptions.includes('shipping') && rentDeliveryAddressOption != 'sameAsPickupAddress') {
          form.change('rentDeliveryAddressOption', 'anotherShippingAddress');
        }

        // Reset pickup location if 'pickup' is unchecked
        if (!rentDeliveryOptions.includes('pickup')) {
          form.change('rentPickupLocation', null);
          form.change('rentPickupAddress', null);
          form.change('rentPickupCity', null);
          form.change('rentPickupState', null);
          form.change('rentPickupZipCode', null);
          form.change('rentPickupAddress2', null);
        }
       
        // Reset shipping fields if 'shipping' is unchecked
        if (!rentDeliveryOptions.includes('shipping')) {

          form.change('rentDeliveryAddressOption', null);
          form.change('rentShippingLocation', null);
          form.change('rentShippingAddress', null);
          form.change('rentShippingCity', null);
          form.change('rentShippingState', null);
          form.change('rentShippingZipCode', null);
          form.change('rentShippingAddress2', null);
          form.change('deliveryZipCode', null);
          deliveryRanges.forEach(({ key }) => {
            form.change(`rentDelivery[${key}].rangeFee`, null);
          });
        }


        // Handle rent pickup address availability in the same effect
        if (!hasRentPickupAddress) {
          form.change('rentDeliveryAddressOption', 'anotherShippingAddress');
        }

      }, [values?.rentDeliveryOptions, values?.rentDeliveryAddressOption, hasRentPickupAddress])
      useEffect(() => {
        if (values?.rentPickupLocation?.selectedPlace?.address) {
          const selectedPlace = values?.rentPickupLocation?.selectedPlace; 
          const { street, postcode, city, state } = selectedPlace || {}
          form.change('rentPickupAddress', street);
          form.change('rentPickupCity', city);
          form.change('rentPickupState', States.find(value=> value.label==state)?.option);
          form.change('rentPickupZipCode', postcode);
        }
        if(values?.rentShippingLocation?.selectedPlace?.address){
           const selectedPlace = values?.rentShippingLocation?.selectedPlace; 
          const { street, postcode, city, state } = selectedPlace || {}
          form.change('rentShippingAddress', street);
          form.change('rentShippingCity', city);
          form.change('rentShippingState', States.find(value=> value.label==state)?.option);
          form.change('rentShippingZipCode', postcode);
        }
        if (values?.sellPickupLocation?.selectedPlace?.address) {
          const selectedPlace = values?.sellPickupLocation?.selectedPlace;
          const { street, postcode, city, state } = selectedPlace || {}
          form.change('sellPickupAddress', street);
          form.change('sellPickupCity', city);
          form.change('sellPickupState', States.find(value => value.label == state)?.option);
          form.change('sellPickupZipCode', postcode);
        }
        if (values?.sellShippingLocation?.selectedPlace?.address) {
          const selectedPlace = values?.sellShippingLocation?.selectedPlace;
          const { street, postcode, city, state } = selectedPlace || {}
          form.change('sellShippingAddress', street);
          form.change('sellShippingCity', city);
          form.change('sellShippingState', States.find(value => value.label == state)?.option);
          form.change('sellShippingZipCode', postcode);
        }
        if (values?.customSellShippingLocation?.selectedPlace?.address) {
          const selectedPlace = values?.customSellShippingLocation?.selectedPlace;
          const { street, postcode, city, state } = selectedPlace || {}
          form.change('customSellShippingAddress', street);
          form.change('customSellShippingCity', city);
          form.change('customSellShippingState', States.find(value => value.label == state)?.option);
          form.change('customSellShippingZipCode', postcode);
        }
      }, [values?.rentPickupLocation ,values?.rentShippingLocation,values?.sellPickupLocation,values?.sellShippingLocation,values?.customSellShippingLocation])
      // Handle sell delivery options, shipping options, and related field resets
      useEffect(() => {
        const sellDeliveryOptions = values?.sellDeliveryOptions || [];
        const sellShippingOptions = values?.sellShippingOptions;
        const selectedShippingOption = values?.sellShippingOptions;
        const customSellShippingOption = values?.customSellShippingOption;

        if (sellDeliveryOptions.includes('shipping') && sellShippingOptions != 'sameAsPickupAddress') {
          form.change('sellShippingOptions', 'addNewAddress');
        }
        if (sellDeliveryOptions.includes('customShipping') && customSellShippingOption != 'sameAsPickupAddress') {
          form.change('customSellShippingOption', 'addNewAddress');
        }
        // Reset pickup location if 'pickup' is unchecked
        if (!sellDeliveryOptions.includes('pickup')) {
          form.change('sellPickupAddress', null);
          form.change('sellPickupCity', null);
          form.change('sellPickupState', null);
          form.change('sellPickupZipCode', null);
          form.change('sell', null);
          form.change('sellPickupAddress2', null);
        }

        // Reset shipping fields if 'shipping' is unchecked
        if (!sellDeliveryOptions.includes('shipping')) {
          form.change('sellShippingOptions', null);
          form.change('sellShippingAddress', null);
          form.change('sellShippingCity', null);
          form.change('sellShippingState', null);
          form.change('sellShippingZipCode', null);
          form.change('sellShippingAddress2', null);
          // form.change('sellPackageHeight', null);
          // form.change('sellPackageLength', null);
          form.change('sellPackageWeight', null);
          // form.change('sellPackageWidth', null);
          form.change('shippingBoxSize', null);
        }
        // Reset custom shipping fields if 'shipping' is unchecked
        if (!sellDeliveryOptions.includes('customShipping')) {
          
          form.change('customSellShippingLocation', null);
          form.change('customSellShippingOption', null);
          form.change('customSellShippingAddress', null);
          form.change('customSellShippingCity', null);
          form.change('customSellShippingState', null);
          form.change('customSellShippingZipCode', null);
          form.change('customSellShippingAddress2', null);
          deliveryRanges.forEach(({ key }) => {
            form.change(`customSellShippingFee[${key}].rangeFee`, null);
          });
        }

        // Handle shipping options changes in the same effect
        if (selectedShippingOption && selectedShippingOption === 'sameAsPickupAddress') {
          form.change('sellShippingAddress', null);
          form.change('sellShippingCity', null);
          form.change('sellShippingState', null);
          form.change('sellShippingZipCode', null);
          form.change('sellShippingAddress2', null);
          form.change('sellShippingLocation', null);
        }

        // Handle sell pickup address availability in the same effect
        if (!hasSellPickupAddress) {
          form.change('sellShippingOptions', 'addNewAddress');
        }
      }, [values?.sellDeliveryOptions, values?.sellShippingOptions, hasSellPickupAddress,values?.customSellShippingOption]);
      
      // Handle product dimensions

      // useEffect(() => {
      //   if (!values?.sellProductDimensions) {
      //     form.change('sellPackageHeight', null);
      //     form.change('sellPackageLength', null);
      //     form.change('sellPackageWeight', null);
      //     form.change('sellPackageWidth', null);
      //   }

      // }, [values?.sellProductDimensions]);

      const { publicData } = listing?.attributes || {};
      const intl = useIntl();
      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,
        marketplaceCurrency,
        intl
      );
      // Note: outdated listings don't have listingType!
      // I.e. listings that are created with previous listing type setup.
      const hasStockManagement = listingType?.stockType === STOCK_MULTIPLE_ITEMS;
      const stockValidator = validators.numberAtLeast(
        intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockIsRequired' }),
        0
      );

      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titleRequired',
      });
      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.addressNotRecognized',
      });
      const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingType?.stockType);
      const currentStock = values.stock;

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
        invalid || disabled || submitInProgress || !values?.listingLocation?.search;
      const { updateListingError, showListingsError, setStockError } = fetchErrors || {};
      const greaterThanZero = msg => value => {
        if (value == null || value === '') return undefined;
        const num = Number(value);
        return num <= 0 ? msg : undefined;
      };
      const stockErrorMessage = isOldTotalMismatchStockError(setStockError)
        ? intl.formatMessage({ id: 'EditListingPricingAndStockForm.oldStockTotalWasOutOfSync' })
        : intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockUpdateFailed' });

      const handleCheckboxChange = (event, key) => {
        const checked = event.target.checked;
        const updatedAddOns = checked
          ? [...(values.rentCustomAddOns || []), key]
          : (values.rentCustomAddOns || []).filter(val => val !== key);
        form.change('rentCustomAddOns', updatedAddOns);
        if (!checked) {
          // Reset corresponding fields
          switch (key) {
            case 'setUpFee':
              form.change('rentSetupPrice', null);
              break;
            case 'deposit':
              form.change('rentDepositFee', null);
              break;
            // case 'pickup':
            //   form.change('pickupFee', null);
            //   break;
            case 'lateFee':
              form.change('rentLateFee', null);
              break;
            // case 'delivery':
            //   form.change('deliveryZipCode', null);
            //   deliveryRanges.forEach(({ key }) => {
            //     form.change(`delivery[${key}].rangeFee`, null);
            //   });
            // break;
            default:
              break;
          }
        }
      }; 

 
      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingAndStockForm.updateFailed" />
            </p>
          ) : null}
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingAndStockForm.showListingFailed" />
            </p>
          ) : null}
          <div>
            <div className={css.textFieldWrapper}>
              <label className={css.imageHeading}>
                {productType == 'sell' ? (
                  <>
                    <FormattedMessage id="EditListingPricingAndStockForm.salesPriceheading" />
                    <p className={css.subHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.salesPriceSubheading" />
                    </p>
                  </>
                ) : (
                  <>
                    <FormattedMessage id="EditListingPricingAndStockForm.rentPriceheading" />
                    <p className={css.subHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.rentPriceSubheading" />
                    </p>
                  </>
                )}
              </label>

              {publicData?.productType === 'sell' ? (
                <>
                  <div className={css.singleInput}>
                    <FieldCurrencyInput
                      id={`${formId}.sellPrice`}
                      name="sellPrice"
                      className={css.input}
                      autoFocus={autoFocus}
                      label={intl.formatMessage(
                        { id: 'EditListingPricingAndStockForm.sellPricePerProduct' },
                        { unitType }
                      )}
                      placeholder={'$'}
                      currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                      // validate={priceValidators}
                    />
                  </div>

                  <div className={css.textFieldWrapper}>
                    <label className={css.imageHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.sellStockHeading" />
                      <p className={css.subHeading}>
                        <FormattedMessage id="EditListingPricingAndStockForm.sellStockSubHeading" />
                      </p>
                    </label>
                    <FieldTextInput
                      className={css.singleInput}
                      id={`${formId}.sellStock`}
                      name="sellStock"
                      placeholder={intl.formatMessage({
                        id: 'EditListingPricingAndStockForm.sellStockPlaceholder',
                      })}
                      type="number"
                      min={0}
                      // validate={stockValidator}
                      onWheel={e => {
                        if (e.target === document.activeElement) {
                          e.target.blur();
                          setTimeout(() => {
                            e.target.focus();
                          }, 0);
                        }
                      }}
                    />
                  </div>

                  <div>
                    <div className={css.checkboxSelect}>
                      <label className={css.imageHeading}>
                        <FormattedMessage id="EditListingPricingAndStockForm.sellDeliveryHeading" />
                        <p className={css.subHeading}>
                          <FormattedMessage id="EditListingPricingAndStockForm.sellDeliverySubHeading" />
                        </p>
                      </label>
                      <div className={css.customField}>
                        <div className={css.tagCheck}>
                          <FieldCheckboxGroup
                            id="sellDeliveryOptions"
                            name="sellDeliveryOptions"
                            options={sellDeliveryOptions}
                            className={css.radioBox}
                          />
                        </div>
                        <div className={css.gridWrapper}>
                          <div className={css.innerSpaceHold}>
                            {values?.sellDeliveryOptions?.includes('pickup') ? (
                              <div className={css.formWrapper}>       
                                <FieldLocationAutocompleteInput
                                  className={css.locationInput}
                                  rootClassName={css.locationAddress}
                                  inputClassName={css.locationAutocompleteInput}
                                  iconClassName={css.locationAutocompleteInputIcon}
                                  predictionsClassName={css.predictionsRoot}
                                  validClassName={css.validLocation}
                                  autoFocus={autoFocus}
                                  name="sellPickupLocation"
                                  label={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupLocationLabel',
                                  })}
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.sellPickupLocationPlaceholder',
                                  })}
                                  useDefaultPredictions={false}
                                  format={identity}
                                  valueFromForm={values.sellPickupLocation}
                                // validate={composeValidators(
                                //   autocompleteSearchRequired(addressRequiredMessage),
                                //   autocompletePlaceSelected(addressNotRecognizedMessage)
                                // )}
                                />
                                <FieldTextInput
                                  className={css.extraInput}
                                  type="text"
                                  id={formId ? `${formId}.sellPickupAddress` : 'sellPickupAddress'}
                                  name="sellPickupAddress"
                                  label={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupAddressLabel',
                                  })}
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupAddressPlaceholder',
                                  })}
                                  // validate={required(addressRequiredMessage)}
                                />
                                <FieldTextInput
                                  className={css.extraInputs}
                                  type="text"
                                  id={formId ? `${formId}.sellPickupCity` : 'sellPickupCity'}
                                  name="sellPickupCity"
                                  // placeholder={'City'}
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupCityPlaceholder',
                                  })}
                                  // validate={required(addressRequiredMessage)}
                                />
                                <FieldSelect
                                  id={`${formId}.sellPickupState`}
                                  name="sellPickupState"
                                  className={css.extraInput}
                                  // validate={required(addressRequiredMessage)}
                                >
                                  <option disabled value="" style={{ opacity: 0.5 }}>
                                    <FormattedMessage id="EditListingPricingAndStockForm.statePlaceholder" />
                                  </option>
                                  {States?.map(st => (
                                    <option key={st.option} value={st.option}>
                                      {st.label}
                                    </option>
                                  ))}
                                </FieldSelect>
                                <FieldTextInput
                                  className={css.extraInput}
                                  type="text"
                                  id={formId ? `${formId}.sellPickupZipCode` : 'sellPickupZipCode'}
                                  name="sellPickupZipCode"
                                  // placeholder={'Zip Code'}
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupZipCodePlaceholder',
                                  })}
                                  // validate={required(addressRequiredMessage)}
                                />
                                <FieldTextInput
                                  className={css.extraInput}
                                  type="text"
                                  id={
                                    formId ? `${formId}.sellPickupAddress2` : 'sellPickupAddress2'
                                  }
                                  name="sellPickupAddress2"
                                  // label={'Other Pickup Info'}
                                  label={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupAddress2Label',
                                  })}
                                  // placeholder={'Pick up at front door'}
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingPricingAndStockForm.sellPickupAddress2Placeholder',
                                  })}
                                />
                              </div>
                            ) : null}
                          </div>
                          <div className={css.innerSpaceHoldBox}>
                            {values?.sellDeliveryOptions?.includes('shipping') ? (
                              <div className={css.inputWrappers}>
                                {shippingOptions && shippingOptions.length > 0 && (
                                  <div className={css.borderCheck}>
                                    {shippingOptions
                                      .filter(option => {
                                        if (option.key === 'sameAsPickupAddress') {
                                          return hasSellPickupAddress; // only include if hasSellPickupAddress is true
                                        }
                                        return true; // include all others
                                      })
                                      .map(option => (
                                        <FieldRadioButton
                                          key={option.key}
                                          id={`sellShippingOption_${option.key}`}
                                          name="sellShippingOptions"
                                          label={option.label}
                                          value={option.key}
                                          className={css.radioBox}
                                        />
                                      ))}
                                  </div>
                                )}
                                {values?.sellShippingOptions?.includes('addNewAddress') ? (
                                  <div className={css.formWrapper}>
                                    <FieldLocationAutocompleteInput
                                  className={css.locationInput}
                                  rootClassName={css.locationAddress}
                                  inputClassName={css.locationAutocompleteInput}
                                  iconClassName={css.locationAutocompleteInputIcon}
                                  predictionsClassName={css.predictionsRoot}
                                  validClassName={css.validLocation}
                                  autoFocus={autoFocus}
                                  name="sellShippingLocation"
                                  label={intl.formatMessage({
                                    id: 'EditListingLocationForm.sellShippingLocationLabel',
                                  })}                                  
                                  // placeholder="Enter your location"
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.sellShippingLocationPlaceholder',
                                  })}
                                  useDefaultPredictions={false}
                                  format={identity}
                                  valueFromForm={values.sellShippingLocation}
                                // validate={composeValidators(
                                //   autocompleteSearchRequired(addressRequiredMessage),
                                //   autocompletePlaceSelected(addressNotRecognizedMessage)
                                // )}
                                />
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId
                                          ? `${formId}.sellShippingAddress`
                                          : 'sellShippingAddress'
                                      }
                                      name="sellShippingAddress"
                                      label={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddressLabel',
                                      })}
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddressPlaceholder',
                                      })}
                                    // validate={required(addressRequiredMessage)}
                                    />
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId ? `${formId}.sellShippingCity` : 'sellShippingCity'
                                      }
                                      name="sellShippingCity"
                                      // placeholder={'City'}
                                        placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingCityPlaceholder',
                                      })}
                                      // validate={required(addressRequiredMessage)}
                                    />
                                    <FieldSelect
                                      id={`${formId}.sellShippingState`}
                                      name="sellShippingState"
                                      className={css.extraInput}
                                      // validate={required(addressRequiredMessage)}
                                    >
                                      <option disabled value="" style={{ opacity: 0.5 }}>
                                        <FormattedMessage id="EditListingPricingAndStockForm.sellShippingState" />
                                      </option>
                                      {States?.map(st => (
                                        <option key={st.option} value={st.option}>
                                          {st.label}
                                        </option>
                                      ))}
                                    </FieldSelect>
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId
                                          ? `${formId}.sellShippingZipCode`
                                          : 'sellShippingZipCode'
                                      }
                                      name="sellShippingZipCode"
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingZipCodePlaceholder',
                                      })}
                                      // placeholder={'Zip Code'}
                                      // validate={required(addressRequiredMessage)}
                                    />
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId
                                          ? `${formId}.sellShippingAddress2`
                                          : 'sellShippingAddress2'
                                      }
                                      name="sellShippingAddress2"
                                      // label={'Other Shipping Info'}
                                      label={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddress2Label',
                                      })}
                                      // placeholder={'Shipping at front door'}
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddress2Placeholder',
                                      })}
                                    />
                                  </div>
                                ) : null}
                                {/* <div className={css.borderCheckBox}>
                                  <FieldCheckbox
                                    id="sellProductDimensions"
                                    name="sellProductDimensions"
                                    label="Item dimensions"
                                    className={css.radioBox}
                                  />
                                </div> */}
                                {/* {values?.sellProductDimensions ? ( */}
                                <>
                                  {/* <label className={css.dimensionsLabel}>Item dimensions</label> */}
                                  <label className={css.dimensionsLabel}>
                                    <FormattedMessage id='EditListingPricingAndStockForm.shippingboxHeading'/> 
                                  </label>
                                  
                                  <FieldSelect 
                                    id="shippingBoxSize" 
                                    name="shippingBoxSize" 
                                    className={css.inputBox}
                                  >
                                    <option value="" disabled>
                                      <FormattedMessage id="EditListingPricingAndStockForm.shippingBoxSizePlaceholder" />
                                    </option>
                                    {shippingBoxSizes.map(boxsize => {
                                      // For header items, render as disabled option with custom styling
                                      if (boxsize.isHeader) {
                                        return (
                                          <optgroup 
                                            key={boxsize.key} 
                                            label={boxsize.label} 
                                            className={css.optionGroup}
                                          />
                                        );
                                      }
                                      // For regular options
                                      return (
                                        <option key={boxsize.key} value={boxsize.key}>
                                          {boxsize.label}
                                        </option>
                                      );
                                    })}
                                  </FieldSelect>
                                  {/* <FieldTextInput
                                    id={`${formId}.sellPackageWidth`}
                                    name="sellPackageWidth"
                                    className={css.packageInput}
                                    type="number"
                                    label={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageWidth',
                                    })}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageWidthPlaceholder',
                                    })}
                                    // validate={greaterThanZero(
                                    //   intl.formatMessage({
                                    //     id: 'EditListingDetailsForm.packageWidthInvalid',
                                    //   })
                                    // )}
                                    onKeyDown={e => {
                                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                  <FieldTextInput
                                    id={`${formId}.sellPackageLength`}
                                    name="sellPackageLength"
                                    className={css.packageInput}
                                    type="number"
                                    label={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageLength',
                                    })}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageLengthPlaceholder',
                                    })}
                                    // validate={greaterThanZero(
                                    //   intl.formatMessage({
                                    //     id: 'EditListingDetailsForm.packageLengthInvalid',
                                    //   })
                                    // )}
                                    onKeyDown={e => {
                                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                  <FieldTextInput
                                    id={`${formId}.sellPackageHeight`}
                                    name="sellPackageHeight"
                                    className={css.packageInput}
                                    type="number"
                                    label={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageHeight',
                                    })}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageHeightPlaceholder',
                                    })}
                                    // validate={greaterThanZero(
                                    //   intl.formatMessage({
                                    //     id: 'EditListingDetailsForm.packageHeightInvalid',
                                    //   })
                                    // )}
                                    onKeyDown={e => {
                                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  /> */}
                                  <FieldTextInput
                                    id={`${formId}.sellPackageWeight`}
                                    name="sellPackageWeight"
                                    className={css.packageInput}
                                    type="number"
                                    label={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageWeight',
                                    })}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingDetailsForm.packageWeightPlaceholder',
                                    })}
                                    // validate={greaterThanZero(
                                    //   intl.formatMessage({
                                    //     id: 'EditListingDetailsForm.packageWeightInvalid',
                                    //   })
                                    // )}
                                    onKeyDown={e => {
                                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                </>
                                {/* ) : null} */}
                              </div>
                            ) : null}
                          </div>
                          <div className={css.innerSpaceHoldBox}>
                            {values?.sellDeliveryOptions?.includes('customShipping') ? (
                              <div className={css.inputWrappers}>
                                {shippingOptions && shippingOptions.length > 0 && (
                                  <div className={css.borderCheck}>
                                    {shippingOptions
                                      .filter(option => {
                                        if (option.key === 'sameAsPickupAddress') {
                                          return hasSellPickupAddress; // only include if hasSellPickupAddress is true
                                        }
                                        return true; // include all others
                                      })
                                      .map(option => (
                                        <FieldRadioButton
                                          key={option.key}
                                          id={`customeSellShippingOption_${option.key}`}
                                          name="customSellShippingOption"
                                          label={option.label}
                                          value={option.key}
                                          className={css.radioBox}
                                        />
                                      ))}
                                  </div>
                                )}
                                {values?.customSellShippingOption?.includes('addNewAddress') ? (
                                  <div className={css.formWrapper}>
                                    <FieldLocationAutocompleteInput
                                  className={css.locationInput}
                                  rootClassName={css.locationAddress}
                                  inputClassName={css.locationAutocompleteInput}
                                  iconClassName={css.locationAutocompleteInputIcon}
                                  predictionsClassName={css.predictionsRoot}
                                  validClassName={css.validLocation}
                                  autoFocus={autoFocus}
                                  name="customSellShippingLocation"
                                  // label={intl.formatMessage({
                                  //   id: 'EditListingLocationForm.sellShippingLocationLabel',
                                  // })}  
                                  label="Enter your Shipping location (In Suggested Format → Street, City, State, ZIP)"                                
                                  // placeholder="Enter your location"
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.sellShippingLocationPlaceholder',
                                  })}
                                  useDefaultPredictions={false}
                                  format={identity}
                                  valueFromForm={values.customSellShippingLocation}
                                // validate={composeValidators(
                                //   autocompleteSearchRequired(addressRequiredMessage),
                                //   autocompletePlaceSelected(addressNotRecognizedMessage)
                                // )}
                                />
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId
                                          ? `${formId}.customSellShippingAddress`
                                          : 'customSellShippingAddress'
                                      }
                                      name="customSellShippingAddress"
                                      // label={intl.formatMessage({
                                      //   id: 'EditListingLocationForm.sellShippingAddressLabel',
                                      // })}
                                      label="Enter the exact street address for shipping"
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddressPlaceholder',
                                      })}
                                    // validate={required(addressRequiredMessage)}
                                    />
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId ? `${formId}.customSellShippingCity` : 'customSellShippingCity'
                                      }
                                      name="customSellShippingCity"
                                      // placeholder={'City'}
                                        placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingCityPlaceholder',
                                      })}
                                      // validate={required(addressRequiredMessage)}
                                    />
                                    <FieldSelect
                                      id={`${formId}.customSellShippingState`}
                                      name="customSellShippingState"
                                      className={css.extraInput}
                                      // validate={required(addressRequiredMessage)}
                                    >
                                      <option disabled value="" style={{ opacity: 0.5 }}>
                                        <FormattedMessage id="EditListingPricingAndStockForm.sellShippingState" />
                                      </option>
                                      {States?.map(st => (
                                        <option key={st.option} value={st.option}>
                                          {st.label}
                                        </option>
                                      ))}
                                    </FieldSelect>
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId
                                          ? `${formId}.customSellShippingZipCode`
                                          : 'customSellShippingZipCode'
                                      }
                                      name="customSellShippingZipCode"
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingZipCodePlaceholder',
                                      })}
                                      // placeholder={'Zip Code'}
                                      // validate={required(addressRequiredMessage)}
                                    />
                                    <FieldTextInput
                                      className={css.extraInput}
                                      type="text"
                                      id={
                                        formId
                                          ? `${formId}.customSellShippingAddress2`
                                          : 'customSellShippingAddress2'
                                      }
                                      name="customSellShippingAddress2"
                                      // label={'Other Shipping Info'}
                                      label={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddress2Label',
                                      })}
                                      // placeholder={'Shipping at front door'}
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingLocationForm.sellShippingAddress2Placeholder',
                                      })}
                                    />
                                  </div>
                                ) : null}                             
                                 
                                <div className={css.shippingFeeSection}>
                                  <div className={css.addressLabel}>
                                    <FormattedMessage id="EditListingPricingAndStockForm.shippingFeeLabel" />
                                  </div>
                                  {deliveryRanges.map(({ key, label }, index) => (
                                    <div key={key} className={css.rangeBlock}>
                                      <div className={css.rangeLabel}>{label}</div>
                                      <div className={css.inputPair}>
                                        <FieldCurrencyInput
                                          id={`${formId}.customSellShippingFee_${key}_rangeFee`}
                                          name={`customSellShippingFee[${key}].rangeFee`}
                                          className={css.input}
                                          placeholder={intl.formatMessage({
                                            id: 'EditListingPricingAndStockForm.pricePlaceholder',
                                          })}
                                          currencyConfig={appSettings.getCurrencyFormatting(
                                            marketplaceCurrency
                                          )}
                                        // validate={priceValidators}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                               
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {notValidAddress ? (
                          <div className={css.error}>
                            <FormattedMessage id='EditListingPricingAndStockForm.novalidShippoAddresMessage'/>
                            {' '}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={css.doubleInput}>
                    <div>
                      <div className={css.mainLabel}>Quantity</div>
                      <div className={css.subLabel}>
                         <FormattedMessage id='EditListingPricingAndStockForm.rentStockLabel'/>
                      </div>
                      <FieldTextInput
                        className={css.singleInpust}
                        id={`${formId}.rentStock`}
                        name="rentStock"
                        placeholder={intl.formatMessage({
                          id: 'EditListingPricingAndStockForm.rentStockPlaceholder',
                        })}
                        type="number"
                        min={0}
                        // validate={stockValidator}
                        onWheel={e => {
                          if (e.target === document.activeElement) {
                            e.target.blur();
                            setTimeout(() => {
                              e.target.focus();
                            }, 0);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className={css.mainLabel}>
                        <FormattedMessage
                          id="EditListingPricingAndStockForm.rentPricePerProduct"
                          values={{ unitType }}
                        />
                      </div>
                      <div className={css.subLabel}>
                         <FormattedMessage id='EditListingPricingAndStockForm.rentPriceLabel'/>
                         <b> <FormattedMessage id='EditListingPricingAndStockForm.rentPriceperunitLabel'/></b>.
                      </div>
                      <FieldCurrencyInput
                        id={`${formId}.rentPrice`}
                        name="rentPrice"
                        className={css.input}
                        autoFocus={autoFocus}
                        // label={intl.formatMessage(
                        //   { id: 'EditListingPricingAndStockForm.rentPricePerProduct' },
                        //   { unitType }
                        // )}
                        placeholder={intl.formatMessage({
                          id: 'EditListingPricingAndStockForm.pricePlaceholder',
                        })}
                        currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                        // validate={priceValidators}
                      />
                    </div>
                    <div>
                      <div className={css.mainLabel}>
                        <FormattedMessage
                          id="EditListingPricingAndStockForm.rentFlatPricePerProduct"
                          values={{ unitType }}
                        />
                      </div>
                      <div className={css.subLabel}>
                         <FormattedMessage
                          id="EditListingPricingAndStockForm.rentFlatPriceLabel" />
                      </div>
                      <FieldCurrencyInput
                        id={`${formId}.rentFlatPrice`}
                        name="rentFlatPrice"
                        className={css.input}
                        autoFocus={autoFocus}
                        // label={intl.formatMessage(
                        //   { id: 'EditListingPricingAndStockForm.rentFlatPricePerProduct' },
                        //   { unitType }
                        // )}
                        placeholder={intl.formatMessage({
                          id: 'EditListingPricingAndStockForm.pricePlaceholder',
                        })}
                        currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                        // validate={priceValidators}
                      />
                    </div>
                  </div>
                  {/* <div className={css.textFieldWrapper}>
                    <label className={css.imageHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.rentStockHeading" />
                      <p className={css.subHeading}>
                        <FormattedMessage id="EditListingPricingAndStockForm.rentStockSubHeading" />
                      </p>
                    </label>
                    
                  </div> */}
                  <div className={css.formContainer}>
                    <div className={css.imageHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.rentDeliveryOptionsHeading" />
                      <p className={css.subHeading}>
                        <FormattedMessage id="EditListingPricingAndStockForm.rentDeliveryOptionsSubHeading" />
                      </p>
                    </div>
                    <div className={css.rentWrapper}>
                      <div className={css.tagCheck}>
                        <FieldCheckboxGroup
                          id="rentDeliveryOptions"
                          name="rentDeliveryOptions"
                          options={deliveryOptions}
                          className={css.radioBox}
                        />
                      </div>

                      {values?.rentDeliveryOptions?.includes('pickup') && (
                        <div className={css.formWrapper}>
                          <FieldLocationAutocompleteInput
                            className={css.locationInput}
                            rootClassName={css.locationAddress}
                            inputClassName={css.locationAutocompleteInput}
                            iconClassName={css.locationAutocompleteInputIcon}
                            predictionsClassName={css.predictionsRoot}
                            validClassName={css.validLocation}
                            autoFocus={autoFocus}
                            name="rentPickupLocation"
                            label={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupLocationLabel',
                            })}
                            // placeholder="Enter your location"
                            placeholder={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupLocationPlaceholder',
                            })}
                            useDefaultPredictions={false}
                            format={identity}
                            valueFromForm={values.rentPickupLocation}
                            // validate={composeValidators(
                            //   autocompleteSearchRequired(addressRequiredMessage),
                            //   autocompletePlaceSelected(addressNotRecognizedMessage)
                            // )}
                          />
                          <FieldTextInput
                            className={css.extraInput}
                            type="text"
                            id={formId ? `${formId}.rentPickupAddress` : 'rentPickupAddress'}
                            name="rentPickupAddress"
                            label={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupAddressLabel',
                            })}
                            placeholder={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupAddressPlaceholder',
                            })}
                            // validate={required(addressRequiredMessage)}
                          />
                          <div className={css.row}>
                            <FieldTextInput
                              className={css.extraInput}
                              type="text"
                              id={formId ? `${formId}.rentPickupCity` : 'rentPickupCity'}
                              name="rentPickupCity"
                              placeholder={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupCityPlaceholder',
                            })}
                              // validate={required(addressRequiredMessage)}
                            />
                            <FieldSelect
                              id={`${formId}.rentPickupState`}
                              name="rentPickupState"
                              className={css.extraInputBox}
                              // validate={required(addressRequiredMessage)}
                            >
                              <option disabled value="" style={{ opacity: 0.5 }}>
                                <FormattedMessage id="EditListingPricingAndStockForm.rentPickupStatePlaceholder" />
                              </option>
                              {States?.map(st => (
                                <option key={st.option} value={st.option}>
                                  {st.label}
                                </option>
                              ))}
                            </FieldSelect>
                            <FieldTextInput
                              className={css.extraInput}
                              type="text"
                              id={formId ? `${formId}.rentPickupZipCode` : 'rentPickupZipCode'}
                              name="rentPickupZipCode"
                              placeholder={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupZipCodePlaceholder',
                            })}
                              // validate={required(addressRequiredMessage)}
                            />
                          </div>
                          <FieldTextInput
                            className={css.extraInputWrapper}
                            type="text"
                            id={formId ? `${formId}.rentPickupAddress2` : 'rentPickupAddress2'}
                            name="rentPickupAddress2"
                            label={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupAddress2Label',
                            })}
                            // placeholder="Pick up at front door"
                            placeholder={intl.formatMessage({
                              id: 'EditListingLocationForm.rentPickupAddress2Placeholder',
                            })}
                          />
                        </div>
                      )}
                      {values?.rentDeliveryOptions?.includes('shipping') && (
                        <div>
                          <div className={css.optionsInputRow}>
                            {hasRentPickupAddress ? (
                              <>
                                <FieldRadioButton
                                  id="rentSameAsPickupAddress"
                                  name="rentDeliveryAddressOption"
                                  // label="Same as pick up address"
                                    label={intl.formatMessage({
                                      id: 'EditListingLocationForm.rentDeliveryAddressOptionLabel',
                                    })}
                                  value="sameAsPickupAddress"
                                />

                                <FieldRadioButton
                                  id="rentAnotherShippingAddress"
                                  name="rentDeliveryAddressOption"
                                  // label="Add new"
                                  label={intl.formatMessage({
                                      id: 'EditListingLocationForm.rentDeliveryAddressOptionAddNewLabel',
                                    })}
                                  value="anotherShippingAddress"
                                />
                              </>
                            ) : null}
                          </div>
                          {values?.rentDeliveryAddressOption === 'anotherShippingAddress' && (
                            <>
                              <div className={css.addressLabel}>Delivery Address</div>
                              <div className={css.formWrapper}>
                                <FieldLocationAutocompleteInput
                                  className={css.locationInput}
                                  rootClassName={css.locationAddress}
                                  inputClassName={css.locationAutocompleteInput}
                                  iconClassName={css.locationAutocompleteInputIcon}
                                  predictionsClassName={css.predictionsRoot}
                                  validClassName={css.validLocation}
                                  autoFocus={autoFocus}
                                  name="rentShippingLocation"
                                  label={intl.formatMessage({
                                      id: 'EditListingLocationForm.rentShippingLocationLabel',
                                    })}
                                 
                                  // placeholder="Enter your location"
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.rentShippingLocationPlaceholder',
                                  })}
                                  useDefaultPredictions={false}
                                  format={identity}
                                  valueFromForm={values.rentShippingLocation}
                                  // validate={composeValidators(
                                  //   autocompleteSearchRequired(addressRequiredMessage),
                                  //   autocompletePlaceSelected(addressNotRecognizedMessage)
                                  // )}
                                />
                                <FieldTextInput
                                  className={css.extraInput}
                                  type="text"
                                  id={
                                    formId ? `${formId}.rentShippingAddress` : 'rentShippingAddress'
                                  }
                                  name="rentShippingAddress"
                                  // label="Enter the exact street address for delivery"
                                  label={intl.formatMessage({
                                      id: 'EditListingLocationForm.rentShippingAddressLabel',
                                    })}
                                  // placeholder="123 Example Street"
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.rentShippingAddressPlaceholder',
                                  })}
                                  // validate={required(addressRequiredMessage)}
                                />
                                <div className={css.row}>
                                  <FieldTextInput
                                    className={css.extraInput}
                                    type="text"
                                    id={formId ? `${formId}.rentShippingCity` : 'rentShippingCity'}
                                    name="rentShippingCity"
                                    placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.rentShippingCityPlaceholder',
                                  })}
                                    // placeholder="City"
                                    // validate={required(addressRequiredMessage)}
                                  />
                                  <FieldSelect
                                    id={`${formId}.rentShippingState`}
                                    name="rentShippingState"
                                    className={css.extraInputBox}
                                    // validate={required(addressRequiredMessage)}
                                  >
                                    <option disabled value="" style={{ opacity: 0.5 }}>
                                      State
                                    </option>
                                    {States?.map(st => (
                                      <option key={st.option} value={st.option}>
                                        {st.label}
                                      </option>
                                    ))}
                                  </FieldSelect>
                                  <FieldTextInput
                                    className={css.extraInput}
                                    type="text"
                                    id={
                                      formId
                                        ? `${formId}.rentShippingZipCode`
                                        : 'rentShippingZipCode'
                                    }
                                    name="rentShippingZipCode"
                                    placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.rentShippingZipCodePlaceholder',
                                  })}
                                    // placeholder="Zip Code"
                                    // validate={required(addressRequiredMessage)}
                                  />
                                </div>
                                <FieldTextInput
                                  className={css.extraInput}
                                  type="text"
                                  id={
                                    formId
                                      ? `${formId}.rentShippingAddress2`
                                      : 'rentShippingAddress2'
                                  }
                                  name="rentShippingAddress2"
                                  label={intl.formatMessage({
                                    id: 'EditListingLocationForm.rentShippingAddress2Label',
                                  })}
                                  // placeholder="Delivery at front door"
                                  placeholder={intl.formatMessage({
                                    id: 'EditListingLocationForm.rentShippingAddress2Placeholder',
                                  })}
                                />
                              </div>
                            </>
                          )}
                          <div className={css.shippingFeeSection}>
                            <div className={css.addressLabel}>
                              <FormattedMessage id="EditListingPricingAndStockForm.deliveryFeeLabel" />
                            </div>
                            {deliveryRanges.map(({ key, label }, index) => (
                              <div key={key} className={css.rangeBlock}>
                                <div className={css.rangeLabel}>{label}</div>
                                <div className={css.inputPair}>
                                  <FieldCurrencyInput
                                    id={`${formId}.rentDelivery_${key}_rangeFee`}
                                    name={`rentDelivery[${key}].rangeFee`}
                                    className={css.input}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingPricingAndStockForm.pricePlaceholder',
                                    })}
                                    currencyConfig={appSettings.getCurrencyFormatting(
                                      marketplaceCurrency
                                    )}
                                    // validate={priceValidators}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={css.checkboxSelect}>
                    <div className={css.imageHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.rentAddOns" />
                      <p className={css.subHeading}>
                        <FormattedMessage id="EditListingPricingAndStockForm.rentAddExtrasSubHeading" />
                      </p>
                    </div>
                    <div className={css.flexBoxWrapper}>
                      {customizableAddons.map(option => (
                        <React.Fragment key={option.key}>
                          <div className={css.inputNoptionsWrapper}>
                            <Field name="rentCustomAddOns" type="checkbox" value={option.key}>
                              {({ input }) => (
                                <label className={css.customCheckbox}>
                                  <input
                                    {...input}
                                    id={`rent_${option.key}`}
                                    className={css.nativeCheckbox}
                                    onChange={event => {
                                      input.onChange(event);
                                      handleCheckboxChange(event, option.key);
                                    }}
                                  />
                                  <span>{option.label}</span>
                                </label>
                              )}
                            </Field>

                            {option.key === 'setUpFee' &&
                            values?.rentCustomAddOns?.includes('setUpFee') ? (
                              <div className={css.optionsInput}>
                                <FieldCurrencyInput
                                  id={`${formId}.rentSetupPrice`}
                                  name="rentSetupPrice"
                                  className={css.input}
                                  autoFocus={autoFocus}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingPricingAndStockForm.pricePlaceholder',
                                    })}
                                  currencyConfig={appSettings.getCurrencyFormatting(
                                    marketplaceCurrency
                                  )}
                                  // validate={priceValidators}
                                />
                              </div>
                            ) : null}

                            {option.key === 'deposit' &&
                            values?.rentCustomAddOns?.includes('deposit') ? (
                              <div className={css.optionsInput}>
                                <FieldCurrencyInput
                                  id={`${formId}.rentDepositFee`}
                                  name="rentDepositFee"
                                  className={css.input}
                                  autoFocus={autoFocus}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingPricingAndStockForm.pricePlaceholder',
                                    })}
                                  currencyConfig={appSettings.getCurrencyFormatting(
                                    marketplaceCurrency
                                  )}
                                  // validate={priceValidators}
                                />
                              </div>
                            ) : null}

                            {option.key === 'lateFee' &&
                            values?.rentCustomAddOns?.includes('lateFee') ? (
                              <div className={css.optionsInput}>
                                <FieldCurrencyInput
                                  id={`${formId}.rentLateFee`}
                                  name="rentLateFee"
                                  className={css.input}
                                  autoFocus={autoFocus}
                                    placeholder={intl.formatMessage({
                                      id: 'EditListingPricingAndStockForm.pricePlaceholder',
                                    })}
                                  currencyConfig={appSettings.getCurrencyFormatting(
                                    marketplaceCurrency
                                  )}
                                  // validate={priceValidators}
                                />
                              </div>
                            ) : null}

                            <div className={css.optionsInput}>
                              {option.key === 'delivery' &&
                                values?.rentCustomAddOns?.includes('delivery') && (
                                  <div className={css.deliveryWrapper}>
                                    <FieldTextInput
                                      className={css.input}
                                      id={`${formId}.rentDeliveryZipCode`}
                                      name="rentDeliveryZipCode"
                                      label=""
                                      placeholder={intl.formatMessage({
                                        id: 'EditListingPricingAndStockForm.zipCodePlaceholder',
                                      })}
                                      // validate={required(
                                      //   intl.formatMessage({
                                      //     id: 'EditListingDetailsForm.zipCodeRequired',
                                      //   })
                                      // )}
                                    />
                                    {values?.rentCustomAddOns?.includes('delivery') ? (
                                      <>
                                        {deliveryRanges.map(({ key, label }, index) => (
                                          <div key={key} className={css.rangeBlock}>
                                            <div className={css.rangeLabel}>{label}</div>
                                            <div className={css.inputPair}>
                                              <FieldCurrencyInput
                                                id={`${formId}.rentDelivery_${key}_rangeFee`}
                                                name={`rentDelivery[${key}].rangeFee`}
                                                className={css.input}
                                                label=""
                                                placeholder={intl.formatMessage({
                                                  id: 'EditListingPricingAndStockForm.pricePlaceholder',
                                                })}
                                                currencyConfig={appSettings.getCurrencyFormatting(
                                                  marketplaceCurrency
                                                )}
                                                // validate={priceValidators}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </>
                                    ) : null}
                                  </div>
                                )}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className={`${css.textFieldWrapper} ${css.lastWrapper}`}>
                    <label className={css.imageHeading}>
                      <FormattedMessage id="EditListingPricingAndStockForm.rentAvailabilityHeading" />
                      <p className={css.subHeading}>
                        <FormattedMessage id="EditListingPricingAndStockForm.rentAvailabilitySubHeading" />
                      </p>
                    </label>
                    <div className={css.availability}>
                      {hasAvailabilityPlan ? (
                        <div className={css.sectionAvalability}>
                          <WeeklyCalendar
                            className={css.section}
                            headerClassName={css.sectionHeader}
                            listingId={listing.id}
                            availabilityPlan={availabilityPlan}
                            availabilityExceptions={sortedAvailabilityExceptions}
                            weeklyExceptionQueries={weeklyExceptionQueries}
                            isDaily={unitType === DAY}
                            useFullDays={useFullDays}
                            onDeleteAvailabilityException={onDeleteAvailabilityException}
                            onFetchExceptions={onFetchExceptions}
                            params={params}
                            locationSearch={locationSearch}
                            firstDayOfWeek={firstDayOfWeek}
                            routeConfiguration={routeConfiguration}
                            history={history}
                          />
                        </div>
                      ) : null}
                      <div className={css.infoBox}>
                        <Button
                          type="button"
                          className={css.editPlanButton}
                          onClick={() => setIsEditPlanModalOpen(true)}
                        >
                          {hasAvailabilityPlan ? (
                            <div className={css.editAvailabilityPlan}>
                              <FormattedMessage id="EditListingAvailabilityPanel.editAvailabilityPlan" />
                            </div>
                          ) : (
                            <>
                              <FormattedMessage id="EditListingAvailabilityPanel.setAvailabilityPlan" />
                            </>
                          )}
                        </Button>
                      </div>
                      <div className={css.linkText}>
                  <InlineTextButton
                    type='button'
                    className={css.addExceptionButton}
                    onClick={() => setIsEditExceptionsModalOpen(true)}
                    disabled={disabled || !hasAvailabilityPlan}
                    ready={ready}
                  >
                    <FormattedMessage id="EditListingAvailabilityPanel.addException" />
                  </InlineTextButton>
                </div>
                      {errors.showListingsError ? (
                        <p className={css.error}>
                          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
                        </p>
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
                            useFullDays={useFullDays}
                            onSubmit={handleAvailabilitySubmit}
                            initialValues={intialAvailabilityPlan}
                            inProgress={updateInProgress}
                            fetchErrors={errors}
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
                            isDaily={unitType === DAY}
                            updateInProgress={updateInProgress}
                            useFullDays={useFullDays}
                          />
                        </Modal>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
            <UpdateStockToInfinityCheckboxMaybe
              formId={formId}
              hasInfiniteStock={hasInfiniteStock}
              currentStock={currentStock}
              intl={intl}
            />

            {setStockError ? <p className={css.error}>{stockErrorMessage}</p> : null}
            <div className={css.bottomButton}>
              <div className={css.bottomMaxContain}>
                <button type="button" className={css.backButton} onClick={() => prevButton()}>
                  <BrandIconCard type="back" />
                  <FormattedMessage id="EditListingWizard.back" />
                </button>
                <Button
                  className={css.nextButton}
                  type="submit"
                  inProgress={submitInProgress || validatingAddress}
                  // disabled={submitDisabled}
                  ready={submitReady}
                >
                  {saveActionMsg}
                </Button>
              </div>
            </div>
          </div>
        </Form>
      );
    }}
  />
);

export default EditListingPricingAndStockForm;
