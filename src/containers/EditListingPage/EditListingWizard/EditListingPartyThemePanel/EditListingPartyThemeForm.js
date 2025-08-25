import React, { useEffect, useRef } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { STOCK_INFINITE_ITEMS, STOCK_MULTIPLE_ITEMS, propTypes } from '../../../../util/types';
import { isOldTotalMismatchStockError } from '../../../../util/errors';
import * as validators from '../../../../util/validators';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { maxLength, required } from '../../../../util/validators';

// Import shared components
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

// Import modules from this directory
import css from './EditListingPartyThemeForm.module.css';

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
} from '../../../../util/constants';
import { FieldArray } from 'react-final-form-arrays';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';

const { Money } = sdkTypes;
const MILLION = 1000000;
const identity = v => v;
// const TITLE_MAX_LENGTH = 60;

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
 * If stock type is changed to infinity (on the fly),
 * we show checkbox for providers to update their current stock to infinity.
 * This is created to avoid overselling problem, if operator changes stock type
 * from finite to infinite. I.e. the provider notices, if stock management configuration has changed.
 *
 * Note 1: infinity is faked using billiard aka 10^15
 * Note 2: If stock is less than a million (10^6) items, we show this checkbox component.
 *
 * @param {Object} props contains { hasInfiniteStock, currentStock, formId, intl }
 * @returns a component containing checkbox group (stockTypeInfinity) with one key: infinity
 */
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
        validate={validators.requiredFieldArrayCheckbox(
          intl.formatMessage({
            id: 'EditListingPricingAndStockForm.updateToInfiniteRequired',
          })
        )}
      />
    </div>
  ) : null;
};

/**
 * The EditListingPricingAndStockForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form id
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {propTypes.listingType} props.listingType - The listing types config
 * @param {string} props.unitType - The unit type (e.g. 'item')
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {boolean} [props.autoFocus] - Whether the form should autofocus
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the form is updating
 * @param {Object} props.fetchErrors - The fetch errors
 * @param {propTypes.error} [props.fetchErrors.showListingsError] - The show listings error
 * @param {propTypes.error} [props.fetchErrors.updateListingError] - The update listing error
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.saveActionMsg - The save action message
 * @returns {JSX.Element}
 */
export const EditListingPartyThemeForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        formId = 'EditListingPartyThemeForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        config,
        listing,
        form,
        prevButton,
      } = formRenderProps;

      const prevCategoryRef = useRef();
      useEffect(() => {
        if (prevCategoryRef.current && prevCategoryRef.current !== values?.category) {
          // Reset the FieldArray when category changes
          form.change('selectedCategoryOptions', []);
        }
        prevCategoryRef.current = values.category;
      }, [values?.category, form]);
      const tagOptions =
        config?.listing?.listingFields?.find(item => item.key === 'tags')?.enumOptions || [];
      // const categoryOptions =
      //   config?.listing?.listingFields?.find(item => item.key === 'category')?.enumOptions || [];
      const eventTypeOptions =
        config?.listing?.listingFields?.find(item => item.key === 'event_type')?.enumOptions || [];
      const selectColorOptions =
        config?.listing?.listingFields?.find(item => item.key === 'select_color')?.enumOptions ||
        [];
      const themeStyleOptions =
        config?.listing?.listingFields?.find(item => item.key === 'theme_style')?.enumOptions || [];

      const {
        backdrops: backdropsOptions = [],
        party_decor: partyDecorOptions = [],
        diy_kits: diyKitsOptions = [],
        rentals_near_you: rentalOptions = [],
      } = Object.fromEntries(
        ['backdrops', 'party_decor', 'diy_kits', 'rentals_near_you'].map(key => [
          key,
          config?.listing?.listingFields?.find(item => item.key === key)?.enumOptions || [],
        ])
      );
      const optionsMap = {
        backdrops: backdropsOptions,
        party_decor: partyDecorOptions,
        diy_kits: diyKitsOptions,
        rentals_near_you: rentalOptions,
      };
      const selectedCategory = values.category;
      const selectedCategoryOptionsList = optionsMap[selectedCategory] || [];
      const { publicData } = listing?.attributes || {};
      const isAiListing = publicData?.isAiListing;
      const intl = useIntl();
      // Note: outdated listings don't have listingType!
      // I.e. listings that are created with previous listing type setup.

      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titleRequired',
      });

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
        invalid ||
        disabled ||
        submitInProgress ||
        values?.tags?.length <= 0 ||
        (values?.category &&
          (!values?.selectedCategoryOptions || values?.selectedCategoryOptions?.length === 0));
      const { updateListingError, showListingsError, setStockError } = fetchErrors || {};

      return (
        <div className={css.formWrapper}>
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
            <div className={css.pricingWrapper}>
              <div className={`${css.textFieldWrapper} ${css.lastWrapper}`}>
                <span className={css.imageHeading}>
                  <div className={css.imageText}>
                    <FormattedMessage id="EditListingDetailsForm.selectListingType" />
                  </div>
                  <p className={css.sublabel}>
                    <FormattedMessage id="EditListingDetailsForm.selectListingTypeDetails" />
                  </p>
                </span>
                <div className={css.radioCheckButton}>
                  <FieldRadioButton
                    id="sell"
                    name="listingType"
                    label={intl.formatMessage({
                      id: 'EditListingDetailsForm.sell',
                    })}
                    value="sell"
                  />
                  <FieldRadioButton
                    id="rent"
                    name="listingType"
                    label={intl.formatMessage({
                      id: 'EditListingDetailsForm.rent',
                    })}
                    value="rent"
                  />
                </div>
              </div>

              <div className={css.categoryWrapper}>
                <div className={css.header}>
                  <label>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectEventTypeLabel" />
                  </label>
                  <p>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectEventTypeLabelDetails" />
                  </p>
                </div>

                <div className={css.selectCategory}>
                  <div className={`${css.gridRadioBoxWrapper} ${css.radioBoxWrapperCheckbox}`}>
                    {eventTypeOptions?.map(type => {
                      const { option, label } = type;
                      return (
                        <>
                          <Field
                            key={option}
                            type="checkbox"
                            name="event_type"
                            value={option}
                          // validate={required('This field is required')}
                          >
                            {({ input }) => (
                              <label htmlFor={`event_type.${option}`} className={css.radioBox}>
                                <span>{label}</span>
                                <input
                                  {...input}
                                  type="checkbox"
                                  id={`event_type.${option}`}
                                  className={css.hiddenInput}
                                />
                                <span className={css.radioBtn} />
                              </label>
                            )}
                          </Field>
                          {/* <label for={`eventType.${option}`} className={css.radioBox}>
                            <span>{label}</span>

                            <input
                              type="radio"
                              key={option}
                              id={`eventType.${option}`}
                              name="eventType"
                              value={option}
                              checkedClassName={css.eventType}
                              validate={required('This field is required')}
                            />
                            <span className={css.radioBtn} />

                            {/* <FieldRadioButton
                              key={option}
                              id={`eventType.${option}`}
                              name="eventType"
                              label={label}
                              value={option}
                              checkedClassName={css.eventType}
                              validate={required('This field is required')}
                            /> 
                          </label> */}
                        </>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={css.categoryWrapper}>
                <div className={css.header}>
                  <label className={css.colorLabel}>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectColorLabel" />
                  </label>
                  <p className={css.colorSubLabel}>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectColorLabelDetails" />
                  </p>
                </div>
                {/* <div className={css.selectCategory}>
                  <div className={`${css.gridRadioBoxWrapper} ${css.radioBoxWrapperBox}`}>
                    {selectColorOptions.map(({ label, option }) => (
                      <div className={css.radioBox}>
                        <Field
                          key={option}
                          name="select_color"
                          type="radio"
                          value={option}
                          // validate={required('This field is required')}
                        >
                          {({ input }) => (
                            <label
                              className={`${css.colorOption} ${input.checked ? css.selected : ''}`}
                            >
                              <input type="radio" {...input} className={css.hiddenInput} />
                              {label}
                            </label>
                          )}
                        </Field>
                      </div>
                    ))}
                  </div>
                </div> */}
                <div className={`${css.categoryWrappers} ${css.lastWrapper}`}>
                  <div>
                    <div className={css.tagCheck}>
                      <FieldCheckboxGroup
                        className={css.radioBox}
                        id="select_color"
                        name="select_color"
                        options={selectColorOptions.map(({ label, option }) => ({
                          key: option,
                          label,
                        }))}
                      // validate={required('This field is required')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* <div className={css.categoryWrapper}>
                <div className={css.header}>
                  <label>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectThemeStyleLabel" />
                  </label>
                  <p>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectThemeStyleLabelDetails" />
                  </p>
                </div>
                <div className={css.selectCategory}>
                  <div
                    className={` ${css.customWidthSuppy} ${css.gridRadioBoxWrapper} ${css.radioBoxWrapper}`}
                  >
                    {themeStyleOptions?.map(type => {
                      const { option, label } = type;
                      return (
                        <Field
                          key={option}
                          type="radio"
                          name="theme_style"
                          value={option}
                        // validate={required('This field is required')}
                        >
                          {({ input }) => (
                            <label htmlFor={`theme_style.${option}`} className={css.radioBox}>
                              <span>{label}</span>
                              <input
                                {...input}
                                type="radio"
                                id={`theme_style.${option}`}
                                className={css.hiddenInput}
                              />
                              <span className={css.radioBtn} />
                            </label>
                          )}
                        </Field>
                      );
                    })}
                  </div>
                </div>
              </div> */}
              {/* <div className={css.categoryWrapper}>
                <div className={css.header}>
                  <label>
                    <FormattedMessage id="EditListingDetailsForm.styleInspiration" />
                  </label>
                  <p>
                    <FormattedMessage id="EditListingDetailsForm.styleInspirationDetails" />
                  </p>
                </div>
                <div className={css.selectCategory}>
                  <div className={css.textareaWrapper}>
                    <FieldTextInput
                      id={`${formId}styleInspiration`}
                      name="styleInspiration"
                      className={css.inputBox}
                      type="textarea"
                      // label={intl.formatMessage({ id: 'EditListingDetailsForm.styleInspiration' })}
                      placeholder={intl.formatMessage({
                        id: 'EditListingDetailsForm.styleInspirationPlaceholder',
                      })}
                      // maxLength={TITLE_MAX_LENGTH}
                      validate={composeValidators(required(titleRequiredMessage))}
                      autoFocus={autoFocus}
                    />
                  </div>
                </div>
              </div> */}
              <div className={css.bottomButton}>
                <button type="button" className={css.backButton} onClick={() => prevButton()}>
                  <BrandIconCard type="back" />
                  <FormattedMessage id="EditListingWizard.back" />
                </button>
                <Button
                  className={css.nextButton}
                  type="submit"
                  inProgress={submitInProgress}
                  // disabled={submitDisabled}
                  ready={submitReady}
                >
                  {saveActionMsg}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      );
    }}
  />
);

export default EditListingPartyThemeForm;
