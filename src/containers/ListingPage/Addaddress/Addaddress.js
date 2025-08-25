import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import {
  Form,
  PrimaryButton,
  FieldTextInput,
  IconInquiry,
  Heading,
  NamedLink,
  FieldSelect,
  H3,
} from '../../../components';
import css from './Addaddress.module.css';
import getCountryCodes from '../../../translations/countryCodes';
import { States } from '../../../util/constants';
const Addaddress = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        formId,
        values,
        showNotValidAddressError,
        checkingValidAdress,
        config,
        handleSubmit,
      } = fieldRenderProps;
      const intl = useIntl();
      const classes = classNames(css.root);
      const submitInProgress = checkingValidAdress;
      const submitDisabled = checkingValidAdress;
      const countryCodes = config ? getCountryCodes(config?.localization?.locale) : [];
      const addressLine1Required = validators.required(
        intl.formatMessage({
          id: 'StripePaymentAddress.addressLine1Required',
        })
      );
      const AptnumberRequired = validators.required(
        intl.formatMessage({
          id: 'addAddress.aptRequired',
        })
      );
      const NameRequired = validators.required(
        intl.formatMessage({
          id: 'addAddress.nameRequired',
        })
      );
      const postalCodeRequired = validators.required(
        intl.formatMessage({
          id: 'StripePaymentAddress.postalCodeRequired',
        })
      );
      const cityRequired = validators.required(
        intl.formatMessage({
          id: 'StripePaymentAddress.cityRequired',
        })
      );
      const countryLabel = intl.formatMessage({ id: 'StripePaymentAddress.countryLabel' });
      const countryPlaceholder = intl.formatMessage({
        id: 'StripePaymentAddress.countryPlaceholder',
      });
      const countryRequired = validators.required(
        intl.formatMessage({
          id: 'StripePaymentAddress.countryRequired',
        })
      );
      const stateLabel = intl.formatMessage({ id: 'addaddress.stateLabel' });
      const statePlaceholder = intl.formatMessage({ id: 'StripePaymentAddress.statePlaceholder' });
      const stateRequired = validators.required(
        intl.formatMessage({
          id: 'addaddress.stateRequired',
        })
      );
      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <H3>
            <FormattedMessage id="addAddress.modal.heading" />
          </H3>
          <FieldTextInput
            className={css.input}
            type="text"
            name="name"
            id={formId ? `${formId}.name` : 'name'}
            label={intl.formatMessage({ id: 'AddAddressForm.name' })}
            placeholder={intl.formatMessage({
              id: 'AddAddressForm.NamePlaceholder',
            })}
            validate={NameRequired}
          />

          <FieldTextInput
            className={css.input}
            type="text"
            name="Apt"
            id={formId ? `${formId}.Apt` : 'Apt'}
            label={intl.formatMessage({ id: 'AddAddressForm.Apt' })}
            placeholder={intl.formatMessage({
              id: 'AddAddressForm.AptPlaceholder',
            })}
            // validate={AptnumberRequired}
          />
          <FieldTextInput
            className={css.input}
            type="text"
            name="Street_address"
            id={formId ? `${formId}.Street_address` : 'Street_address'}
            label={intl.formatMessage({ id: 'AddAddressForm.Street_address' })}
            placeholder={intl.formatMessage({
              id: 'AddAddressForm.Street_addressPlaceholder',
            })}
            validate={addressLine1Required}
          />
          <FieldTextInput
            className={css.input}
            type="number"
            name="Postal_code"
            id={formId ? `${formId}.Postal_code` : 'Postal_code'}
            label={intl.formatMessage({ id: 'AddAddressForm.Postal_code' })}
            placeholder={intl.formatMessage({
              id: 'AddAddressForm.Postal_codePlaceholder',
            })}
            validate={postalCodeRequired}
          />
          <FieldTextInput
            className={css.input}
            type="text"
            name="city"
            id={formId ? `${formId}.city` : 'city'}
            label={intl.formatMessage({ id: 'AddAddressForm.city' })}
            placeholder={intl.formatMessage({
              id: 'AddAddressForm.cityPlaceholder',
            })}
            validate={cityRequired}
          />
          {/* <FieldTextInput
            className={css.input}
            type="text"
            name="state"
            id={formId ? `${formId}.state` : 'state'}
            label={stateLabel}
            placeholder={statePlaceholder}
            validate={stateRequired}
          /> */}  
          <label>state</label>
          <FieldSelect
            id={`${formId}.state`}
            name="state"
            className={css.stateinputField}
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
          <FieldSelect
            id={'country'}
            name="country"
            validate={countryRequired}
            className={css.field}
            label={countryLabel}
          >
            <option disabled value="">
              {countryPlaceholder}
            </option>
            {countryCodes?.map(country => {
              return (
                <option key={country?.code} value={country?.code}>
                  {country?.name}
                </option>
              );
            })}
          </FieldSelect>
          {/* Show delivery address is valid  */}
          {showNotValidAddressError && !checkingValidAdress ? (
            <div className={css.invalidAddress}>The Address is invalid for shippo</div>
          ) : null}
          <PrimaryButton className={css.submitButton} type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
            <FormattedMessage id="Addaddress.submitButtonText" />
          </PrimaryButton>
        </Form>
      );
    }}
  />
);
export default Addaddress;
