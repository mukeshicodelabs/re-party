// EditListingDetailsFormWithAi
import React, { useEffect, useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';
// Import configs and util modules
import appSettings from '../../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../../util/reactIntl';
import { STOCK_INFINITE_ITEMS, STOCK_MULTIPLE_ITEMS, propTypes } from '../../../../../util/types';
import { displayDeliveryPickup, displayDeliveryShipping } from '../../../../../util/configHelpers';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
  required,
} from '../../../../../util/validators';
import * as validators from '../../../../../util/validators';
// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  Button,
  FieldCurrencyInput,
  FieldTextInput,
  FieldCheckbox,
  FieldCheckboxGroup,
  FieldSelect,
  InlineTextButton,
  Modal,
} from '../../../../../components';

// Import modules from this directory
import css from './EditListingDetailsFormWithAi.module.css';
import { types as sdkTypes } from '../../../../../util/sdkLoader';
import { formatMoney } from '../../../../../util/currency';
import EditListingAvailabilityExceptionForm from '../EditListingAvailabilityExceptionForm';
import EditListingAvailabilityPlanForm from '../EditListingAvailabilityPlanForm';
import WeeklyCalendar from '../WeeklyCalendar/WeeklyCalendar';
import { isOldTotalMismatchStockError } from '../../../../../util/errors';
import { DAY } from '../../../../../transactions/transaction';
const identity = v => v;
const { Money } = sdkTypes;
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
export const EditListingDetailsFormWithAi = props => (
    <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        formId = 'EditListingDetailsFormWithAi',
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
        useMultipleSeats,
        handlePlanSubmit,
        initialPlanValues,
        listingTypeConfig,
        prevButton
      } = formRenderProps;

      const tagOptions =
        config?.listing?.listingFields?.find(item => item.key === 'tags')?.enumOptions || [];
      const categoryOptions =
        config?.listing?.listingFields?.find(item => item.key === 'category')?.enumOptions || [];
      const eventTypeOptions =
        config?.listing?.listingFields?.find(item => item.key === 'event_type')?.enumOptions || [];
      const selectColorOptions =
        config?.listing?.listingFields?.find(item => item.key === 'select_color')?.enumOptions || [];
      const themeStyleOptions =
        config?.listing?.listingFields?.find(item => item.key === 'theme_style')?.enumOptions || [];

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

      const titleRequiredMessage = intl.formatMessage({ id: 'EditListingDetailsForm.titleRequired' });
      const addressRequiredMessage = intl.formatMessage({ id: 'EditListingDetailsForm.addressRequired' });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.addressNotRecognized',
      });
      const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(listingType?.stockType);
      const currentStock = values.stock;

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress || !values?.category || !values?.event_type || !values?.select_color || !values?.theme_style || !values?.availabilityPlan

      const { updateListingError, showListingsError, setStockError } = fetchErrors || {};

      const stockErrorMessage = isOldTotalMismatchStockError(setStockError)
        ? intl.formatMessage({ id: 'EditListingPricingAndStockForm.oldStockTotalWasOutOfSync' })
        : intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockUpdateFailed' });
      

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
          <div className={css.pricingWrapper}>
            <FieldSelect id="category" name="category" className={css.inputBox} label={'Select Category'}>
              <option disabled value="">
                {'Select Category'}
              </option>
              {categoryOptions.map(category => {
                return (
                  <option key={category.option} value={category.option}>
                    {category.label}
                  </option>
                );
              })}
            </FieldSelect>
            <FieldSelect id="event_type" name="event_type" className={css.inputBox} label={'Event Type'}>
              <option disabled value="">
                {'Select event type'}
              </option>
              {eventTypeOptions.map(type => {
                return (
                  <option key={type.option} value={type.option}>
                    {type.label}
                  </option>
                );
              })}
            </FieldSelect>
            <FieldSelect id="select_color" name="select_color" className={css.inputBox} label={'Color Palette'}>
              <option disabled value="">
                {'Select color'}
              </option>
              {selectColorOptions.map(tag => {
                return (
                  <option key={tag.option} value={tag.option}>
                    {tag.label}
                  </option>
                );
              })}
            </FieldSelect>
            <FieldSelect id="theme_style" name="theme_style" className={css.inputBox} label={'Theme Style '}>
              <option disabled value="">
                {'Select theme style'}
              </option>
              {themeStyleOptions.map(theme => {
                return (
                  <option key={theme.option} value={theme.option}>
                    {theme.label}
                  </option>
                );
              })}
            </FieldSelect>
            <FieldTextInput
              id={`${formId}styleInspiration`}
              name="styleInspiration"
              className={css.inputBox}
              type="text"
              label={intl.formatMessage({ id: 'EditListingDetailsForm.styleInspiration' })}
              placeholder={intl.formatMessage({
                id: 'EditListingDetailsForm.styleInspirationPlaceholder',
              })}
              maxLength="60"
              validate={composeValidators(required(titleRequiredMessage))}
              autoFocus={autoFocus}
            />
            <FieldSelect id="tags" name="tags" className={css.inputBox} label={'Tags'}>
              <option disabled value="">
                {'Select tag'}
              </option>
              {tagOptions.map(tag => {
                return (
                  <option key={tag.option} value={tag.option}>
                    {tag.label}
                  </option>
                );
              })}
            </FieldSelect>
            <label>
              <FormattedMessage id='EditListingPricingAndStockForm.priceLabel' />
            </label>
            {publicData?.productType == 'sell' || publicData?.productType == 'both' ? (
              <FieldCurrencyInput
                id={`${formId}.salePrice`}
                name="salePrice"
                className={css.input}
                autoFocus={autoFocus}
                label={intl.formatMessage(
                  { id: 'EditListingPricingAndStockForm.salePricePerProduct' },
                  { unitType }
                )}
                placeholder={intl.formatMessage({
                  id: 'EditListingPricingAndStockForm.salePriceInputPlaceholder',
                })}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                validate={priceValidators}
              />
            ) : null}
            {publicData?.productType == 'rent' || publicData?.productType == 'both' ? (
              <FieldCurrencyInput
                id={`${formId}.rentalPrice`}
                name="rentalPrice"
                className={css.input}
                autoFocus={autoFocus}
                label={intl.formatMessage(
                  { id: 'EditListingPricingAndStockForm.rentalPricePerProduct' },
                  { unitType }
                )}
                placeholder={intl.formatMessage({
                  id: 'EditListingPricingAndStockForm.rentalPriceInputPlaceholder',
                })}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                validate={priceValidators}
              />
            ) : null}
            {publicData?.productType == 'rent' || publicData?.productType == 'both' ? (
              <FieldCurrencyInput
                id={`${formId}.flatPrice`}
                name="flatPrice"
                className={css.input}
                autoFocus={autoFocus}
                label={intl.formatMessage(
                  { id: 'EditListingPricingAndStockForm.flatPricePerProduct' },
                  { unitType }
                )}
                placeholder={intl.formatMessage({
                  id: 'EditListingPricingAndStockForm.flatPriceInputPlaceholder',
                })}
                currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                validate={priceValidators}
              />
            ) : null}
           

            {publicData?.productType == 'sell' || publicData?.productType == 'both' ? (
              <FieldTextInput
                className={css.input}
                id={`${formId}.stock`}
                name="stock"
                label={intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockLabel' })}
                placeholder={intl.formatMessage({
                  id: 'EditListingPricingAndStockForm.stockPlaceholder',
                })}
                type="number"
                min={0}
                validate={stockValidator}
                onWheel={e => {
                  // fix: number input should not change value on scroll
                  if (e.target === document.activeElement) {
                    // Prevent the input value change, because we prefer page scrolling
                    e.target.blur();

                    // Refocus immediately, on the next tick (after the current function is done)
                    setTimeout(() => {
                      e.target.focus();
                    }, 0);
                  }
                }}
              />
            ) : null}
            <UpdateStockToInfinityCheckboxMaybe
              formId={formId}
              hasInfiniteStock={hasInfiniteStock}
              currentStock={currentStock}
              intl={intl}
            />
            {setStockError ? <p className={css.error}>{stockErrorMessage}</p> : null}
             {publicData?.productType == 'rent' || publicData?.productType == 'both' ? (
              <div>
                <div className={css.infoBox}>
                  <Button
                    type="button"
                    className={css.editPlanButton}
                    onClick={() => setIsEditPlanModalOpen(true)}
                  >
                    {hasAvailabilityPlan ? (
                      <>
                        <FormattedMessage id="EditListingAvailabilityPanel.editAvailabilityPlan" />
                      </>
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
                {hasAvailabilityPlan ? (
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
                      onDeleteAvailabilityException={onDeleteAvailabilityException}
                      onFetchExceptions={onFetchExceptions}
                      params={params}
                      locationSearch={locationSearch}
                      firstDayOfWeek={firstDayOfWeek}
                      routeConfiguration={routeConfiguration}
                      history={history}
                    />
                  </>
                ) : null}
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
            ) : null}
            <UpdateStockToInfinityCheckboxMaybe
              formId={formId}
              hasInfiniteStock={hasInfiniteStock}
              currentStock={currentStock}
              intl={intl}
            />

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
              // ready={submitReady}
              >
                {saveActionMsg}
              </Button>
            </div>
          </div>
        </Form>
      );
    }}
  />
);

export default EditListingDetailsFormWithAi;
