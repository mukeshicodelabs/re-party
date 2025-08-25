import React, { useEffect } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { displayDeliveryPickup, displayDeliveryShipping } from '../../../../util/configHelpers';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
  required,
} from '../../../../util/validators';
import arrayMutators from 'final-form-arrays';
import { types as sdkTypes } from '../../../../util/sdkLoader';
// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  Button,
  FieldCurrencyInput,
  FieldTextInput,
  FieldCheckbox,
  FieldCheckboxGroup,
} from '../../../../components';
import * as validators from '../../../../util/validators';
// Import modules from this directory
import css from './EditListingDeliveryForm.module.css';
import { formatMoney } from '../../../../util/currency';
import { customizableAddons, deliveryOptions, deliveryRanges } from '../../../../util/constants';
const { Money } = sdkTypes;
const identity = v => v;
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
/**
 * The EditListingDeliveryForm component.
 *
 * @component
 * @param {Object} props - The component props
 * @param {string} props.formId - The form ID
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.saveActionMsg - The save action message
 * @param {Object} props.selectedPlace - The selected place
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {boolean} props.hasStockInUse - Whether the stock is in use
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the form is in progress
 * @param {Object} props.fetchErrors - The fetch errors
 * @param {propTypes.error} [props.fetchErrors.showListingsError] - The show listings error
 * @param {propTypes.error} [props.fetchErrors.updateListingError] - The update listing error
 * @param {boolean} props.autoFocus - Whether the form is auto focused
 * @returns {JSX.Element} The EditListingDeliveryForm component
 */
export const EditListingDeliveryForm = props => (
  <FinalForm
    {...props}
    keepDirtyOnReinitialize
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        formId = 'EditListingDeliveryForm',
        form,
        autoFocus,
        className,
        disabled,
        ready,
        handleSubmit,
        pristine,
        invalid,
        listingTypeConfig,
        marketplaceCurrency,
        hasStockInUse = true,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        listing,
        listingMinimumPriceSubUnits='0',
        prevButton
      } = formRenderProps;
      const intl = useIntl();
      const { publicData } = listing?.attributes || {}

      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,
        marketplaceCurrency,
        intl
      );
      // This is a bug fix for Final Form.
      // Without this, React will return a warning:
      //   "Cannot update a component (`ForwardRef(Field)`)
      //   while rendering a different component (`ForwardRef(Field)`)"
      // This seems to happen because validation calls listeneres and
      // that causes state to change inside final-form.
      // https://github.com/final-form/react-final-form/issues/751
      //
      // TODO: it might not be worth the trouble to show these fields as disabled,
      // if this fix causes trouble in future dependency updates.
      const { pauseValidation, resumeValidation } = form;
      pauseValidation(false);
      useEffect(() => resumeValidation(), [values]);
      useEffect(() => {
        const deliveryOptions = values?.deliveryOptions || [];

        // Reset pickup location if 'pickup' is unchecked
        if (!deliveryOptions.includes('pickup')) {
          form.change('pickuplocation', null);
          form.change('building',null)
        }

        // Reset shipping fields if 'shipping' is unchecked
        if (!deliveryOptions.includes('shipping')) {
          form.change('packageWidth', null);
          form.change('packageLength', null);
          form.change('packageHeight', null);
          form.change('packageWeight', null);
        }
      }, [values?.deliveryOptions]);
      const displayShipping = displayDeliveryShipping(listingTypeConfig);
      const displayPickup = displayDeliveryPickup(listingTypeConfig);
      const displayMultipleDelivery = displayShipping && displayPickup;
      const shippingEnabled = displayShipping && values.deliveryOptions?.includes('shipping');
      const pickupEnabled = displayPickup && values.deliveryOptions?.includes('pickup');

      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingDeliveryForm.addressNotRecognized',
      });

      const optionalText = intl.formatMessage({
        id: 'EditListingDeliveryForm.optionalText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
      invalid || 
      disabled || 
      submitInProgress ||
      (publicData?.productType === 'sell' && (!values.deliveryOptions || values?.deliveryOptions?.length === 0)) ||
      (publicData?.productType === 'rent' && (!values?.customAddOns || values?.customAddOns?.length === 0))||
      (publicData?.productType === 'both' && ((!values?.customAddOns||values?.customAddOns?.length === 0) && (!values?.deliveryOptions||!values?.pickuplocation &&(!values?.packageHeight||!values?.packageLength||!values?.packageWidth||!values?.packageWeight)) ));

      const shippingLabel = intl.formatMessage({ id: 'EditListingDeliveryForm.shippingLabel' });
      const pickupLabel = intl.formatMessage({ id: 'EditListingDeliveryForm.pickupLabel' });

      const pickupClasses = classNames({
        [css.deliveryOption]: displayMultipleDelivery,
        [css.disabled]: !pickupEnabled,
        [css.hidden]: !displayPickup,
      });
      const shippingClasses = classNames({
        [css.deliveryOption]: displayMultipleDelivery,
        [css.disabled]: !shippingEnabled,
        [css.hidden]: !displayShipping,
      });
      const currencyConfig = appSettings.getCurrencyFormatting(marketplaceCurrency);

      const handleCheckboxChange = (event, key) => {
        const checked = event.target.checked;
        const updatedAddOns = checked
          ? [...(values.customAddOns || []), key]
          : (values.customAddOns || []).filter(val => val !== key);

        form.change('customAddOns', updatedAddOns);

        if (!checked) {
          // Reset corresponding fields
          switch (key) {
            case 'setUpFee':
              form.change('setupPrice', null);
              break;
            case 'deposit':
              form.change('depositFee', null);
              break;
            case 'pickup':
              form.change('pickupFee', null);
              break;
            case 'lateFee':
              form.change('lateFee', null);
              break;
            case 'delivery':
              form.change('zipCode', null);
              deliveryRanges.forEach(({ key }) => {
                form.change(`delivery[${key}].rangeFee`, null);
              });
              break;
            default:
              break;
          }
        }
      };
      const greaterThanZero = (msg) => (value) => {
        if (value == null || value === '') return undefined;
        const num = Number(value);
        return num <= 0 ? msg : undefined;
      };
      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {/* 
          <FieldCheckbox
            id={formId ? `${formId}.pickup` : 'pickup'}
            className={classNames(css.deliveryCheckbox, { [css.hidden]: !displayMultipleDelivery })}
            name="deliveryOptions"
            label={pickupLabel}
            value="pickup"
          />
          <div className={pickupClasses}>
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDeliveryForm.updateFailed" />
              </p>
            ) : null}

            {showListingsError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDeliveryForm.showListingFailed" />
              </p>
            ) : null}

            <FieldLocationAutocompleteInput
              disabled={!pickupEnabled}
              rootClassName={css.input}
              inputClassName={css.locationAutocompleteInput}
              iconClassName={css.locationAutocompleteInputIcon}
              predictionsClassName={css.predictionsRoot}
              validClassName={css.validLocation}
              autoFocus={autoFocus}
              name="location"
              label={intl.formatMessage({ id: 'EditListingDeliveryForm.address' })}
              placeholder={intl.formatMessage({
                id: 'EditListingDeliveryForm.addressPlaceholder',
              })}
              useDefaultPredictions={false}
              format={identity}
              valueFromForm={values.location}
              validate={
                pickupEnabled
                  ? composeValidators(
                      autocompleteSearchRequired(addressRequiredMessage),
                      autocompletePlaceSelected(addressNotRecognizedMessage)
                    )
                  : () => {}
              }
              hideErrorMessage={!pickupEnabled}
              // Whatever parameters are being used to calculate
              // the validation function need to be combined in such
              // a way that, when they change, this key prop
              // changes, thus reregistering this field (and its
              // validation function) with Final Form.
              // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
              key={pickupEnabled ? 'locationValidation' : 'noLocationValidation'}
            />

            <FieldTextInput
              className={css.input}
              type="text"
              name="building"
              id={formId ? `${formId}.building` : 'building'}
              label={intl.formatMessage(
                { id: 'EditListingDeliveryForm.building' },
                { optionalText }
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingDeliveryForm.buildingPlaceholder',
              })}
              disabled={!pickupEnabled}
            />
          </div>

          <FieldCheckbox
            id={formId ? `${formId}.shipping` : 'shipping'}
            className={classNames(css.deliveryCheckbox, { [css.hidden]: !displayMultipleDelivery })}
            name="deliveryOptions"
            label={shippingLabel}
            value="shipping"
          />

          <div className={shippingClasses}>
            <FieldCurrencyInput
              id={
                formId
                  ? `${formId}.shippingPriceInSubunitsOneItem`
                  : 'shippingPriceInSubunitsOneItem'
              }
              name="shippingPriceInSubunitsOneItem"
              className={css.input}
              label={intl.formatMessage({
                id: 'EditListingDeliveryForm.shippingOneItemLabel',
              })}
              placeholder={intl.formatMessage({
                id: 'EditListingDeliveryForm.shippingOneItemPlaceholder',
              })}
              currencyConfig={currencyConfig}
              disabled={!shippingEnabled}
              validate={
                shippingEnabled
                  ? required(
                      intl.formatMessage({
                        id: 'EditListingDeliveryForm.shippingOneItemRequired',
                      })
                    )
                  : null
              }
              hideErrorMessage={!shippingEnabled}
              // Whatever parameters are being used to calculate
              // the validation function need to be combined in such
              // a way that, when they change, this key prop
              // changes, thus reregistering this field (and its
              // validation function) with Final Form.
              // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
              key={shippingEnabled ? 'oneItemValidation' : 'noOneItemValidation'}
            />

            {hasStockInUse ? (
              <FieldCurrencyInput
                id={
                  formId
                    ? `${formId}.shippingPriceInSubunitsAdditionalItems`
                    : 'shippingPriceInSubunitsAdditionalItems'
                }
                name="shippingPriceInSubunitsAdditionalItems"
                className={css.input}
                label={intl.formatMessage({
                  id: 'EditListingDeliveryForm.shippingAdditionalItemsLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'EditListingDeliveryForm.shippingAdditionalItemsPlaceholder',
                })}
                currencyConfig={currencyConfig}
                disabled={!shippingEnabled}
                validate={
                  shippingEnabled
                    ? required(
                        intl.formatMessage({
                          id: 'EditListingDeliveryForm.shippingAdditionalItemsRequired',
                        })
                      )
                    : null
                }
                hideErrorMessage={!shippingEnabled}
                // Whatever parameters are being used to calculate
                // the validation function need to be combined in such
                // a way that, when they change, this key prop
                // changes, thus reregistering this field (and its
                // validation function) with Final Form.
                // See example: https://codesandbox.io/s/changing-field-level-validators-zc8ei
                key={shippingEnabled ? 'additionalItemsValidation' : 'noAdditionalItemsValidation'}
              />
            ) : null}
          </div> */}
          {publicData?.productType == 'sell' || publicData?.productType == 'both' ? (
             <div>
             <div className={css.checkboxSelect}>
               <FieldCheckboxGroup
                 className={css.customField}
                 id="deliveryOptions"
                 name="deliveryOptions"
                 options={deliveryOptions}
               />
             </div>
             {values && values?.deliveryOptions?.includes('pickup') ? (
               <FieldLocationAutocompleteInput
                 className={css.locationInput}
                 rootClassName={css.locationAddress}
                 inputClassName={css.locationAutocompleteInput}
                 iconClassName={css.locationAutocompleteInputIcon}
                 predictionsClassName={css.predictionsRoot}
                 validClassName={css.validLocation}
                 autoFocus={autoFocus}
                 name={'pickuplocation'}
                 label={intl.formatMessage({ id: 'EditListingLocationForm.address' })}
                 placeholder={intl.formatMessage({
                   id: 'EditListingLocationForm.addressPlaceholder',
                 })}
                 useDefaultPredictions={false}
                 format={identity}
                 valueFromForm={values.location}
               />
             ) : null}
             {values && values?.deliveryOptions?.includes('shipping') ? (
               <div>
                 <FieldTextInput
                   id={`${formId}packageWidth`}
                   name="packageWidth"
                   className={css.inputBox}
                   type="number"
                   label={intl.formatMessage({ id: 'EditListingDetailsForm.packageWidth' })}
                   placeholder={intl.formatMessage({
                     id: 'EditListingDetailsForm.packageWidthPlaceholder',
                   })}
                   validate={composeValidators(
                     required(intl.formatMessage({ id: 'EditListingDetailsForm.packageWidthRequired' })),
                     greaterThanZero('Width must be greater than 0')
                   )}
                   onKeyDown={(e) => {
                     if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                       e.preventDefault();
                     }
                   }}
                 />
                 <FieldTextInput
                   id={`${formId}packageLength`}
                   name="packageLength"
                   className={css.inputBox}
                   type="number"
                   label={intl.formatMessage({ id: 'EditListingDetailsForm.packageLength' })}
                   placeholder={intl.formatMessage({
                     id: 'EditListingDetailsForm.packageLengthPlaceholder',
                   })}
                   validate={composeValidators(
                     required(intl.formatMessage({id: 'EditListingDetailsForm.packageLengthRequired' })),
                     greaterThanZero('Length must be greater than 0')
                   )}
                   onKeyDown={(e) => {
                     if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                       e.preventDefault();
                     }
                   }}
                 />
                 <FieldTextInput
                   id={`${formId}packageHeight`}
                   name="packageHeight"
                   className={css.inputBox}
                   type="number"
                   label={intl.formatMessage({ id: 'EditListingDetailsForm.packageHeight' })}
                   placeholder={intl.formatMessage({
                     id: 'EditListingDetailsForm.packageHeightPlaceholder',
                   })}
                   validate={composeValidators(
                     required(intl.formatMessage({id: 'EditListingDetailsForm.packageHeightRequired' })),
                     greaterThanZero('Height must be greater than 0')
                   )}
                   onKeyDown={(e) => {
                     if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                       e.preventDefault();
                     }
                   }}
                 />
                 <FieldTextInput
                   id={`${formId}packageWeight`}
                   name="packageWeight"
                   className={css.inputBox}
                   type="number"
                   label={intl.formatMessage({ id: 'EditListingDetailsForm.packageWeight' })}
                   placeholder={intl.formatMessage({
                     id: 'EditListingDetailsForm.packageWeightPlaceholder',
                   })}
                   validate={composeValidators(
                     required(intl.formatMessage({id: 'EditListingDetailsForm.packageWeightRequired' })),
                     greaterThanZero('Weight must be greater than 0')
                   )}
                   onKeyDown={(e) => {
                     if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                       e.preventDefault();
                     }
                   }}
                 />
               </div>
             ) : null}
           </div>
          ) : null}
          {publicData?.productType == 'rent' || publicData?.productType == 'both' ?
            (<div className={css.checkboxSelect}>
              <div className={css.addsLabel}>
                <FormattedMessage id="EditListingPricingAndStockForm.addOns" />
              </div>
              {/* Render each checkbox manually */}
              {customizableAddons.map(option => (
                <React.Fragment key={option.key}>
                  <FieldCheckbox
                    className={css.customCheckbox}
                    id={option.key}
                    name="customAddOns"
                    label={option.label}
                    value={option.key}
                    onChange={event => handleCheckboxChange(event, option.key)}
                  />

                  {option.key === 'setUpFee' && values?.customAddOns?.includes('setUpFee') ? (
                    <FieldCurrencyInput
                      id={`${formId}.setupPrice`}
                      name="setupPrice"
                      className={css.input}
                      autoFocus={autoFocus}
                      // label={intl.formatMessage(
                      //   { id: 'EditListingPricingAndStockForm.setupPrice' },
                      //   { unitType }
                      // )}
                      placeholder={intl.formatMessage({
                        id: 'EditListingPricingAndStockForm.setupPricePlaceholder',
                      })}
                      currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                    validate={priceValidators}
                    />) : null}


                  {option.key === 'deposit' && values?.customAddOns?.includes('deposit') ? (
                    <FieldCurrencyInput
                      id={`${formId}.depositFee`}
                      name="depositFee"
                      className={css.input}
                      autoFocus={autoFocus}
                      // label={intl.formatMessage(
                      //   { id: 'EditListingPricingAndStockForm.extraPrice' },
                      //   { unitType }
                      // )}
                      placeholder={intl.formatMessage({
                        id: 'EditListingPricingAndStockForm.depositPlaceholder',
                      })}
                      currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                    validate={priceValidators}
                    />
                  ) : null}

                  {option.key === 'pickup' && values?.customAddOns?.includes('pickup') ? (
                    <FieldCurrencyInput
                      id={`${formId}.pickupFee`}
                      name="pickupFee"
                      className={css.input}
                      autoFocus={autoFocus}
                      // label={intl.formatMessage(
                      //   { id: 'EditListingPricingAndStockForm.extraPrice' },
                      //   { unitType }
                      // )}
                      placeholder={intl.formatMessage({
                        id: 'EditListingPricingAndStockForm.pickupPlaceholder',
                      })}
                      currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                    validate={priceValidators}
                    />
                  ) : null}

                  {option.key === 'lateFee' && values?.customAddOns?.includes('lateFee') ? (
                    <FieldCurrencyInput
                      id={`${formId}.lateFee`}
                      name="lateFee"
                      className={css.input}
                      autoFocus={autoFocus}
                      // label={intl.formatMessage(
                      //   { id: 'EditListingPricingAndStockForm.extraPrice' },
                      //   { unitType }
                      // )}
                      placeholder={intl.formatMessage({
                        id: 'EditListingPricingAndStockForm.lateFeePlaceholder',
                      })}
                      currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                    validate={priceValidators}
                    />
                  ) : null}

                  {option.key === 'delivery' && values?.customAddOns?.includes('delivery') && (
                    <div className={css.deliveryWrapper}>
                      {/* ZIP Code input */}
                      <FieldTextInput
                        className={css.input}
                        id={`${formId}.zipCode`}
                        name="zipCode"
                        label=""
                        placeholder={intl.formatMessage({
                          id: 'EditListingPricingAndStockForm.zipCodePlaceholder',
                        })}
                        validate={required(
                          intl.formatMessage({
                            id: 'EditListingDetailsForm.zipCodeRequired',
                          })
                        )}
                      />

                      {values?.customAddOns?.includes('delivery') ? (
                        <>
                          {deliveryRanges.map(({ key, label }, index) => (
                            <div key={key} className={css.rangeBlock}>
                              <div className={css.rangeLabel}>{label}</div>

                              <div className={css.inputPair}>
                                <FieldCurrencyInput
                                  id={`${formId}.delivery_${key}_rangeFee`}
                                  name={`delivery[${key}].rangeFee`}
                                  className={css.input}
                                  label=""
                                  placeholder="Enter fee"
                                  currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                                validate={priceValidators}
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      ) : null}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>) : null}
           <div className={css.buttonGroup}>
              <Button
                type='button'
                className={css.submitButton}
                onClick={() => prevButton()}>
                <FormattedMessage id='EditListingWizard.back' />
              </Button>
              <Button
                className={css.submitButton}
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
                ready={submitReady}
              >
                {saveActionMsg}
              </Button>
            </div>
        </Form>
      );
    }}
  />
);

export default EditListingDeliveryForm;
