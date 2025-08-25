import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import getCountryCodes from '../../../translations/countryCodes';

import { Button, FieldSelect, FieldTextInput, Heading, IconSpinner } from '../../../components';

import css from './ShippingDetails.module.css';
import IconCard from '../../../components/SavedCardDetails/IconCard/IconCard';

/**
 * A component that displays the shipping details form on the checkout page.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name for the shipping details
 * @param {string} props.className - The class name for the shipping details
 * @param {string} props.locale - The locale
 * @param {intlShape} props.intl - The intl object
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {Object} props.formApi - The form API from React Final Form
 * @param {string} props.fieldId - The field ID
 */
const ShippingDetails = props => {
  const {
    rootClassName,
    className,
    locale,
    intl,
    disabled,
    formApi,
    fieldId,
    values,
    handleShippingRates,
    fetchRatesInProgress,
    fetchRatesError,
    shippingRates,
    checkisDeliveryAvilable,
    deliveryShippingMaybe,
    setDeliveryShippingMaybe
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const [isShippingDropdownOpen, setIsShippingDropdownOpen] = useState(false);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const optionalText = intl.formatMessage({
    id: 'ShippingDetails.optionalText',
  });


  const checkRequiredFields = (values) => {
    const { recipientAddressLine1, recipientPostal, recipientCity, recipientState, recipientCountry } = values || {};
    return (
      recipientAddressLine1 &&
      recipientPostal &&
      recipientCity &&
      recipientState &&
      recipientCountry
    );
  };

  useEffect(() => {
    const values = formApi.getState().values; // Get current form values
    const allFieldsFilled = checkRequiredFields(values);
    setSubmitDisabled(!allFieldsFilled); // Disable/Enable the button based on field validation
  }, [formApi]);


  // Use the language set in config.localization.locale to get the correct translations of the country names
  const countryCodes = getCountryCodes(locale);
  const handleShippingDropDown = (rate) => {
    setSelectedShippingOption(rate);
    handleShippingRates(rate.object_id)
    setIsShippingDropdownOpen(false);
    handleShippingRates(rate.object_id)
  };
  const toggleShippingDropdown = () => {
    setIsShippingDropdownOpen(!isShippingDropdownOpen);
  };
  const divRef = useRef(null);
  return (
    <div className={classes}>
      {fetchRatesInProgress ? (
        <div className={css.iconSpinner}>{<IconSpinner />}</div>
      ) : fetchRatesError ? (
        <span className={css.errorText}>
          {typeof fetchRatesError?.message == 'string' ? (
            fetchRatesError?.message
          ) : (
            <FormattedMessage id="ShippingDetails.fetchRatesErorMessage" />
          )}
        </span>
      ) : null}

      {/* Show Price For delivery address */}
      {Array.isArray(shippingRates) && shippingRates?.length && !shippingRates[0]?.message ? (
        <div className={css.mainBox} ref={divRef}>
          <label>
            {intl.formatMessage({ id: 'LocationOrShippingDetails.deliveryMethodLabel' })}
          </label>
          <div className={css.shippingDropdown}>
            <div className={css.selectLabel} onClick={toggleShippingDropdown}>
            <div>
              {selectedShippingOption
                ? `${selectedShippingOption.amount} ${selectedShippingOption.currency} - ${selectedShippingOption.servicelevel?.name
                } (${selectedShippingOption.duration_terms || 'No duration info'})`
                : 'Select options'}
                </div>
            </div>
            {isShippingDropdownOpen && Array.isArray(shippingRates) && shippingRates?.length > 0 && (
              <div className={css.selectDropdown}>
                <ul>
                  {shippingRates
                    ?.sort((a, b) => a.amount - b.amount)
                    ?.map(rate => (
                      <li key={rate.object_id} onClick={() => handleShippingDropDown(rate)}>
                        {rate.amount} {rate.currency} - {rate.servicelevel?.name} (
                        {rate.duration_terms || 'No duration info'})
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : shippingRates?.length && shippingRates[0]?.message && values?.deliveryAddress ? (
        <div className={css.noresultFound}>
          <FormattedMessage id="ShippingDetails.ratesNotFound" />
        </div>
      ) : null}

      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="ShippingDetails.title" />
      </Heading>
      <FieldTextInput
        id={`${fieldId}.recipientName`}
        name="recipientName"
        disabled={disabled}
        className={css.fieldFullWidth}
        type="text"
        autoComplete="shipping name"
        label={intl.formatMessage({ id: 'ShippingDetails.recipientNameLabel' })}
        placeholder={intl.formatMessage({
          id: 'ShippingDetails.recipientNamePlaceholder',
        })}
        validate={validators.required(
          intl.formatMessage({ id: 'ShippingDetails.recipientNameRequired' })
        )}
        onUnmount={() => formApi.change('recipientName', undefined)}
      />
      <FieldTextInput
        id={`${fieldId}.recipientPhoneNumber`}
        name="recipientPhoneNumber"
        disabled={disabled}
        className={css.fieldFullWidth}
        type="text"
        autoComplete="shipping phoneNumber"
        label={intl.formatMessage(
          { id: 'ShippingDetails.recipientPhoneNumberLabel' },
          { optionalText: optionalText }
        )}
        placeholder={intl.formatMessage({
          id: 'ShippingDetails.recipientPhoneNumberPlaceholder',
        })}
        onUnmount={() => formApi.change('recipientPhoneNumber', undefined)}
      />
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.recipientAddressLine1`}
          name="recipientAddressLine1"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-line1"
          label={intl.formatMessage({ id: 'ShippingDetails.addressLine1Label' })}
          placeholder={intl.formatMessage({
            id: 'ShippingDetails.addressLine1Placeholder',
          })}
          validate={validators.required(
            intl.formatMessage({ id: 'ShippingDetails.addressLine1Required' })
          )}
          onUnmount={() => formApi.change('recipientAddressLine1', undefined)}
        />

        <FieldTextInput
          id={`${fieldId}.recipientAddressLine2`}
          name="recipientAddressLine2"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-line2"
          label={intl.formatMessage(
            { id: 'ShippingDetails.addressLine2Label' },
            { optionalText: optionalText }
          )}
          placeholder={intl.formatMessage({
            id: 'ShippingDetails.addressLine2Placeholder',
          })}
          onUnmount={() => formApi.change('recipientAddressLine2', undefined)}
        />
      </div>
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.recipientPostalCode`}
          name="recipientPostal"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping postal-code"
          label={intl.formatMessage({ id: 'ShippingDetails.postalCodeLabel' })}
          placeholder={intl.formatMessage({
            id: 'ShippingDetails.postalCodePlaceholder',
          })}
          validate={validators.required(
            intl.formatMessage({ id: 'ShippingDetails.postalCodeRequired' })
          )}
          onUnmount={() => formApi.change('recipientPostal', undefined)}
        />

        <FieldTextInput
          id={`${fieldId}.recipientCity`}
          name="recipientCity"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-level2"
          label={intl.formatMessage({ id: 'ShippingDetails.cityLabel' })}
          placeholder={intl.formatMessage({ id: 'ShippingDetails.cityPlaceholder' })}
          validate={validators.required(intl.formatMessage({ id: 'ShippingDetails.cityRequired' }))}
          onUnmount={() => formApi.change('recipientCity', undefined)}
        />
      </div>
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.recipientState`}
          name="recipientState"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-level1"
          label={intl.formatMessage(
            { id: 'ShippingDetails.stateLabel' },
            { optionalText: optionalText }
          )}
          placeholder={intl.formatMessage({ id: 'ShippingDetails.statePlaceholder' })}
          onUnmount={() => formApi.change('recipientState', undefined)}
        />

        <FieldSelect
          id={`${fieldId}.recipientCountry`}
          name="recipientCountry"
          disabled={disabled}
          className={css.field}
          label={intl.formatMessage({ id: 'ShippingDetails.countryLabel' })}
          validate={validators.required(
            intl.formatMessage({ id: 'ShippingDetails.countryRequired' })
          )}
        >
          <option disabled value="">
            {intl.formatMessage({ id: 'ShippingDetails.countryPlaceholder' })}
          </option>
          {countryCodes.map(country => {
            return (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            );
          })}
        </FieldSelect>
 
        <Button
          className={css.checkAddressButton}
          type="button"
          disabled={submitDisabled}
          onClick={() => {
            checkisDeliveryAvilable(formApi.getState().values);
          }} 
        >
          Check address for delivery options
        </Button>
      </div>
    </div>
  );
};

export default ShippingDetails;
