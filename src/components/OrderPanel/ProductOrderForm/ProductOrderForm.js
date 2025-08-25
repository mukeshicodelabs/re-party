import React, { useEffect, useRef, useState } from 'react';
import { Field, Form as FinalForm, FormSpy } from 'react-final-form';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { numberAtLeast, required } from '../../../util/validators';
import { PURCHASE_PROCESS_NAME } from '../../../transactions/transaction';

import {
  Form,
  FieldSelect,
  FieldTextInput,
  InlineTextButton,
  PrimaryButton,
  H3,
  H6,
  Button,
  IconSpinner,
  FieldLocationAutocompleteInput,
} from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './ProductOrderForm.module.css';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';

// Browsers can't render huge number of select options.
// (stock is shown inside select element)
// Note: input element could allow ordering bigger quantities
const MAX_QUANTITY_FOR_DROPDOWN = 100;
const identity = v => v;
const handleFetchLineItems = ({
  quantity,
  deliveryMethod,
  displayDeliveryMethod,
  listingId,
  isOwnListing,
  fetchLineItemsInProgress,
  onFetchTransactionLineItems,
  productType,
  deliveryfee,
  selectedrateObjectId,
  formValues,
}) => { 
  const {customDeliveryfee}=formValues?.values||{};
  const stockReservationQuantity = Number.parseInt(quantity, 10);
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};
  const isBrowser = typeof window !== 'undefined';  
  if (
    isBrowser &&
    stockReservationQuantity &&
    // (!displayDeliveryMethod || deliveryMethod) &&
    !fetchLineItemsInProgress
  ) {
    onFetchTransactionLineItems({
      orderData: {
        stockReservationQuantity,
        productType,
        deliveryfee: deliveryMethod == 'customDelivery' ? customDeliveryfee : deliveryMethod == 'delivery' ? deliveryfee : null,
        selectedrateObjectId,
        ...deliveryMethodMaybe
      },
      listingId,
      isOwnListing,
    });
  }
};

const DeliveryMethodMaybe = props => {
  const {
    displayDeliveryMethod,
    hasMultipleDeliveryMethods,
    deliveryMethod,
    hasStock,
    formId,
    intl,
  } = props;
  const showDeliveryMethodSelector = displayDeliveryMethod && hasMultipleDeliveryMethods;
  const showSingleDeliveryMethod = displayDeliveryMethod && deliveryMethod;
  return !hasStock ? null : showDeliveryMethodSelector ? (
    <FieldSelect
      id={`${formId}.deliveryMethod`}
      className={css.deliveryField}
      name="deliveryMethod"
      label={intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodLabel' })}
      validate={required(intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodRequired' }))}
    >
      <option disabled value="">
        {intl.formatMessage({ id: 'ProductOrderForm.selectDeliveryMethodOption' })}
      </option>
      <option value={'pickup'}>
        {intl.formatMessage({ id: 'ProductOrderForm.pickupOption' })}
      </option>
      <option value={'shipping'}>
        {intl.formatMessage({ id: 'ProductOrderForm.shippingOption' })}
      </option>
    </FieldSelect>
  ) : showSingleDeliveryMethod ? (
    <div className={css.deliveryField}>
      <H3 rootClassName={css.singleDeliveryMethodLabel}>
        {intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodLabel' })}
      </H3>
      <p className={css.singleDeliveryMethodSelected}>
        {deliveryMethod === 'shipping'
          ? intl.formatMessage({ id: 'ProductOrderForm.shippingOption' })
          : intl.formatMessage({ id: 'ProductOrderForm.pickupOption' })}
      </p>
      <FieldTextInput
        id={`${formId}.deliveryMethod`}
        className={css.deliveryField}
        name="deliveryMethod"
        type="hidden"
      />
    </div>
  ) : (
    <FieldTextInput
      id={`${formId}.deliveryMethod`}
      className={css.deliveryField}
      name="deliveryMethod"
      type="hidden"
    />
  );
};

const renderForm = formRenderProps => {
  const [mounted, setMounted] = useState(false);
  const {
    // FormRenderProps from final-form
    handleSubmit,
    form: formApi,
    // Custom props passed to the form component
    intl,
    formId,
    currentStock,
    allowOrdersOfMultipleItems,
    hasMultipleDeliveryMethods,
    displayDeliveryMethod,
    listingId,
    isOwnListing,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    price,
    payoutDetailsWarning,
    marketplaceName,
    values,
    addressModal,
    setAddressModal,
    currentUser,
    handleAddToCart,
    isBothpicupAndShipping,
    productType,
    setDeliveryShippingMaybe,
    deliveryShippingMaybe,
    shippingRates,
    fetchRatesError,
    fetchRatesInProgress,
    listing,
    openOrderModal,
    closeOrderModal,
    isClosed,
    history,
    location,
    userShippoAddress,
    autoFocus,
    onCalculateDistance,
    calculatedDistance
  } = formRenderProps; 
  const{sellDeliveryOptions=[]}=listing?.attributes?.publicData||{};
 
  const {deliveryFee}=calculatedDistance||{};
  if (deliveryFee?.amount && values?.deliveryMethod=='customDelivery'&& values?.userLocation?.selectedPlace?.address) {
    formApi.change('customDeliveryfee', deliveryFee?.amount/100);
  }

  const isDeliveryFeeEnabled = deliveryFee?.amount < 1 || deliveryFee?.amount == 0;
  useEffect(() => {
    if (isDeliveryFeeEnabled && values?.deliveryMethod == 'customDelivery' && values?.userLocation?.selectedPlace?.address) {
      Swal.fire({
        toast: true,
        position: 'top-end', // 'top-end' is better for toasts
        icon: 'error',
        text: 'Not Available at your location',
        showConfirmButton: false,
        timer: 5000, // Closes after 5 seconds
        timerProgressBar: true,
        didOpen: toast => {
          // Change timer progress bar color to red
          const progressBar = toast.querySelector('.swal2-timer-progress-bar');
          if (progressBar) {
            progressBar.style.backgroundColor = 'red';
          }
        },
      });
    }
  }, [deliveryFee, isDeliveryFeeEnabled,]);
  useEffect(() => {
    const isLocation =
      values?.userLocation?.search && values?.userLocation?.selectedPlace?.address;
    const userLocation = { address: values?.userLocation?.selectedPlace?.address };
    const customDeliveryfee=values?.customDeliveryfee;

    if (values?.deliveryMethod !== 'customDelivery'&& !values?.userLocation?.selectedPlace?.address) {
      // Clear fields that should not persist outside custom delivery
      formApi.change('userLocation', null);
      // formApi.change('customDeliveryfee', null);
    }
    if(values?.deliveryMethod !== 'customDelivery'){
       formApi.change('userLocation', null);
    }

    if (isLocation && values?.deliveryMethod == 'customDelivery') {
      onCalculateDistance({ listingId, userLocation });
    }
    
  }, [values?.userLocation, values?.deliveryMethod,values?.customDeliveryfee]);

  
  formApi.change("userShippoAddress",userShippoAddress)
  const divRef = useRef(null);  
  // Delivery and shipping option for sell/purchase
  // All possible delivery methods with keys + labels
const allDeliveryMethodOptions = [
  {key: 'delivery', label: 'Shipping by Shippo',option:'shipping' },
  { key: 'customDelivery', label: 'Shipping by ReParty' ,option:'customShipping'},
  { key: 'pickup', label: 'Pick-Up',option:'pickup' },
];

// Only include those present in sellDeliveryOptions
const deliveryPickupMethodOptions = allDeliveryMethodOptions.filter(option =>
  sellDeliveryOptions?.includes(option.option)
);

  const favoriteItems =
    (currentUser && currentUser?.attributes?.profile?.publicData?.favoriteItems) || {};
  const auth = useSelector(state => state.auth.isAuthenticated);
  // Note: don't add custom logic before useEffect
  useEffect(() => {
    setMounted(true); 
    // Side-effect: fetch line-items after mounting if possible
    const { quantity, deliveryMethod } = values;    
    console.log('ProductOrderForm mounted',  !formRenderProps.hasMultipleDeliveryMethods);
    if (quantity && !formRenderProps.hasMultipleDeliveryMethods) { 
      handleFetchLineItems({
        quantity,
        deliveryMethod,
        displayDeliveryMethod,
        listingId,
        isOwnListing,
        fetchLineItemsInProgress,
        onFetchTransactionLineItems,
      });
    }
  }, []);

  // If form values change, update line-items for the order breakdown
  const handleOnChange = formValues => { 
    const {
      quantity,
      deliveryMethod,
      productType,
      deliveryfee,
      selectedrateObjectId,
      userShippoAddress
    } = formValues.values; 
    if (mounted) {
      handleFetchLineItems({
        quantity,
        deliveryMethod: deliveryShippingMaybe == 'delivery' ? 'delivery' : deliveryMethod,
        listingId,
        isOwnListing,
        fetchLineItemsInProgress,
        onFetchTransactionLineItems,
        productType,
        deliveryfee,
        selectedrateObjectId,
        userShippoAddress,
        formValues
      });
    }
  };

  // In case quantity and deliveryMethod are missing focus on that select-input.
  // Otherwise continue with the default handleSubmit function.
  const handleFormSubmit = e => {
    const { quantity, deliveryMethod = 'pickup' } = values || {};
    if (!quantity || quantity < 1) {
      e.preventDefault();
      // Blur event will show validator message
      formApi.blur('quantity');
      formApi.focus('quantity');
    } else if (displayDeliveryMethod && !deliveryMethod) {
      e.preventDefault();
      // Blur event will show validator message
      formApi.blur('deliveryMethod');
      formApi.focus('deliveryMethod');
    } else {
      handleSubmit(e);
    }
  };

  const breakdownData = {};
  // const showBreakdown =
  //   breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;
  // const showBreakdown =
  //   breakdownData &&
  //   lineItems &&
  //   !fetchLineItemsInProgress &&
  //   !fetchLineItemsError &&
  //  !missingCustomDeliveryLocation &&
  // !missingCustomDeliveryFee;


  const showContactUser = typeof onContactUser === 'function';

  const onClickContactUser = e => {
    e.preventDefault();
    onContactUser();
  };

  const contactSellerLink = (
    <InlineTextButton onClick={onClickContactUser}>
      <FormattedMessage id="ProductOrderForm.finePrintNoStockLinkText" />
    </InlineTextButton>
  );
  const quantityRequiredMsg = intl.formatMessage({ id: 'ProductOrderForm.quantityRequired' });

  // Listing is out of stock if currentStock is zero.
  // Undefined/null stock means that stock has never been set.
  const hasNoStockLeft = typeof currentStock != null && currentStock === 0;
  const hasStock = currentStock && currentStock > 0;
  const hasOneItemLeft = currentStock === 1;
  const selectableStock =
    currentStock > MAX_QUANTITY_FOR_DROPDOWN ? MAX_QUANTITY_FOR_DROPDOWN : currentStock;
  const quantities = hasStock ? [...Array(selectableStock).keys()].map(i => i + 1) : [];

  const submitInProgress = fetchLineItemsInProgress;
  formApi.change('productType', productType);
  const bookmarks =
    (currentUser && currentUser.attributes?.profile?.protectedData?.bookmarks) || {};
  const isCartButtonDisabled = !!(values?.quantity < 1); 
  const missingCustomDeliveryLocation =
    values?.deliveryMethod == 'customDelivery' &&
    !values?.userLocation?.selectedPlace?.address && (!deliveryFee || deliveryFee?.amount <= 0); 
    const missingCustomDeliveryFee =
  values?.deliveryMethod === 'customDelivery' &&
  (!deliveryFee|| deliveryFee?.amount <= 0);
  const submitDisabled = !hasStock || isCartButtonDisabled||missingCustomDeliveryLocation||missingCustomDeliveryFee;
  const showBreakdown =
    breakdownData &&
    lineItems &&
    !fetchLineItemsInProgress &&
    !fetchLineItemsError &&
   !missingCustomDeliveryLocation &&
   !missingCustomDeliveryFee
  const [isShippingDropdownOpen, setIsShippingDropdownOpen] = useState(false);
  const [selectedShippingOption, setSelectedShippingOption] = useState(null);  
  const isbothdeliveryandpickwithSelectedmethod = deliveryShippingMaybe=='pickup'?true:  !!( deliveryShippingMaybe=='delivery' &&  selectedShippingOption?.object_id);
  const disableButton =  !!selectedShippingOption?.object_id;   
  const handleShippingDropDown = rate => { 
    formApi.change("deliveryfee",rate?.amount)
    formApi.change("deliveryMethod",'delivery')
    formApi.change("selectedrateObjectId",(rate?.object_id))
    setSelectedShippingOption(rate);
    // handleShippingRates(rate.object_id)
    setIsShippingDropdownOpen(false);
    // handleShippingRates(rate.object_id)
  };
  const toggleShippingDropdown = () => {
    setIsShippingDropdownOpen(!isShippingDropdownOpen);
  };
 
  return (
    <Form onSubmit={handleFormSubmit}>
      <FormSpy subscription={{ values: true }} onChange={handleOnChange} />
      {/* {isBothpicupAndShipping ? ( */}
        <div className={css.selectedMethod}>
          <FieldSelect
            id={'deliveryMethod'}
            name={'deliveryMethod'}
            className={css.field}
            label={intl.formatMessage({
              id: 'stripePaymentFormSelectDeliverypickupMethod.label',
            })}
            onChange={e => {
              setDeliveryShippingMaybe(e);
            }}
          >
            <option disabled value="">
              {'select Any one'}
            </option>
            {deliveryPickupMethodOptions?.map(optionConfig => {
              const key = optionConfig.key;
              return (
                <option key={key} value={key}>
                  {optionConfig.label}
                </option>
              );
            })}
          </FieldSelect>
        </div>
       {/* ) : null} */}

      {deliveryShippingMaybe == 'delivery' ? (
        <div className={css.addAddressBtn}>
          <Button 
          type="button" 
          className={css.addDeliveryModal}
          onClick={() => {
            if(location.search){
              closeOrderModal(history, location)
            }
            setAddressModal(true)}}>
            {' '}
            Add address for delivery{' '}
          </Button>
        </div>
      ) : null}
      {productType == 'sell' && values?.deliveryMethod === 'customDelivery' ? (
        <FieldLocationAutocompleteInput
          className={css.locationInput}
          rootClassName={css.locationAddress}
          inputClassName={css.locationAutocompleteInput}
          iconClassName={css.locationAutocompleteInputIcon}
          predictionsClassName={css.predictionsRoot}
          validClassName={css.validLocation}
          autoFocus={autoFocus}
          name={'userLocation'}
          label="Location"
          placeholder="Enter your location"
          useDefaultPredictions={false}
          format={identity}
          // valueFromForm={values.userlocation}
          // validate={required('This field is required')}
        />
      ) : null}
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
      {Array.isArray(shippingRates) && shippingRates?.length && !shippingRates[0]?.message&& values?.deliveryMethod=='delivery' ? (
        <div className={css.mainBox} ref={divRef}>
          <label>
            {intl.formatMessage({ id: 'LocationOrShippingDetails.deliveryMethodLabel' })}
          </label>
          <div className={css.shippingDropdown}>
            <div className={css.selectLabel} onClick={toggleShippingDropdown}>
              {selectedShippingOption
                ? `${selectedShippingOption.amount} ${selectedShippingOption.currency} - ${
                    selectedShippingOption.servicelevel?.name
                  } (${selectedShippingOption.duration_terms || 'No duration info'})`
                : 'Select options'}
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

      <div className={css.quantityFieldWrapper}>
        <label htmlFor={`${formId}.quantity`} className={css.label}>
          {intl.formatMessage({ id: 'ProductOrderForm.quantityLabel' })}
        </label>
        <Field name="quantity" validate={numberAtLeast(quantityRequiredMsg, 0)}>
          {({ input, meta }) => {
            const value = input.value !== undefined && input.value !== '' ? Number(input.value) : 0;
            const increment = () => {
              if (value < selectableStock) {
                input.onChange(value + 1);
              }
            };
            const decrement = () => {
              if (value > 0) {
                input.onChange(value - 1);
              }
            };
            return (
              <div className={css.customQuantityInput}>
                <button type="button" className={css.quantityButton} onClick={decrement}>
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z"
                      fill="#F9F5ED"
                    />
                    <path
                      d="M10.7969 18H25.1969"
                      stroke="#C4984D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <span className={css.quantityValue}>{value}</span>
                <button type="button" className={css.quantityButton} onClick={increment}>
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z"
                      fill="#F9F5ED"
                    />
                    <path
                      d="M18 10.7998V25.1998"
                      stroke="#C4984D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.7969 18H25.1969"
                      stroke="#C4984D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            );
          }}
        </Field>
      </div>

      {showBreakdown ? (
        <div className={css.breakdownWrapper}>
          <H6 as="h3" className={css.bookingBreakdownTitle}>
            <FormattedMessage id="ProductOrderForm.breakdownTitle" />
          </H6>
          <hr className={css.totalDivider} />
          <EstimatedCustomerBreakdownMaybe
            breakdownData={breakdownData}
            lineItems={lineItems}
            currency={price.currency}
            marketplaceName={marketplaceName}
            processName={PURCHASE_PROCESS_NAME}
          />
        </div>
      ) : null}

      <div className={css.submitButton}>
      
        <PrimaryButton type="submit" inProgress={submitInProgress} 
        disabled={submitDisabled || 
        // !isbothdeliveryandpickwithSelectedmethod ||
         !deliveryShippingMaybe }>
          {hasStock ? (
            <FormattedMessage id="ProductOrderForm.ctaButton" />
          ) : (
            <FormattedMessage id="ProductOrderForm.ctaButtonNoStock" />
          )}
        </PrimaryButton>
      </div>
      {!isOwnListing ? (
        <div className={css.addToCartBtns}>
          <PrimaryButton
            type="button"
            key={values?.quantity}
            className={classNames(
              bookmarks &&
                Array.isArray(bookmarks) &&
                bookmarks.findIndex(e => e.id == listingId?.uuid) > -1
                ? null
                : css.bookmark
            )}
            onClick={e => {
              !auth ? history.push('/login') : handleAddToCart(values);
            }}
            disabled={!values?.quantity||missingCustomDeliveryLocation}
          >
            <svg
              width="25"
              height="24"
              viewBox="0 0 25 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.3484 22.5H6.64844C4.17344 22.5 2.14844 20.475 2.14844 18V17.85L2.59844 5.85C2.67344 3.375 4.69844 1.5 7.09844 1.5H17.8984C20.2984 1.5 22.3234 3.375 22.3984 5.85L22.8484 17.85C22.9234 19.05 22.4734 20.175 21.6484 21.075C20.8234 21.975 19.6984 22.5 18.4984 22.5H18.3484ZM7.09844 3C5.44844 3 4.17344 4.275 4.09844 5.85L3.64844 18C3.64844 19.65 4.99844 21 6.64844 21H18.4984C19.3234 21 20.0734 20.625 20.5984 20.025C21.1234 19.425 21.4234 18.675 21.4234 17.85L20.9734 5.85C20.8984 4.2 19.6234 3 17.9734 3H7.09844Z"
                fill="#222222"
              />
              <path
                d="M12.5 10.5C9.575 10.5 7.25 8.175 7.25 5.25C7.25 4.8 7.55 4.5 8 4.5C8.45 4.5 8.75 4.8 8.75 5.25C8.75 7.35 10.4 9 12.5 9C14.6 9 16.25 7.35 16.25 5.25C16.25 4.8 16.55 4.5 17 4.5C17.45 4.5 17.75 4.8 17.75 5.25C17.75 8.175 15.425 10.5 12.5 10.5Z"
                fill="#222222"
              />
            </svg>
            {/* <IconCollection icon="Icon-bag" /> */}
            {bookmarks &&
            Array.isArray(bookmarks) &&
            bookmarks.find(bookmark => bookmark.id === listingId?.uuid) ? (
              <FormattedMessage id="BookingDatesForm.removeToCart" />
            ) : (
              <FormattedMessage id="BookingDatesForm.addToCart" />
            )}
          </PrimaryButton>
        </div>
      ) : null}
      <p className={css.finePrint}>
        {payoutDetailsWarning ? (
          payoutDetailsWarning
        ) : hasStock && isOwnListing ? (
          <FormattedMessage id="ProductOrderForm.ownListing" />
        ) : hasStock ? (
          <FormattedMessage id="ProductOrderForm.finePrint" />
        ) : showContactUser ? (
          <FormattedMessage id="ProductOrderForm.finePrintNoStock" values={{ contactSellerLink }} />
        ) : null}
      </p>
    </Form>
  );
};

/**
 * A form for ordering a product.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.marketplaceName - The name of the marketplace
 * @param {string} props.formId - The ID of the form
 * @param {Function} props.onSubmit - The function to handle the form submission
 * @param {propTypes.uuid} props.listingId - The ID of the listing
 * @param {propTypes.money} props.price - The price of the listing
 * @param {number} props.currentStock - The current stock of the listing
 * @param {boolean} props.isOwnListing - Whether the listing is owned by the current user
 * @param {boolean} props.pickupEnabled - Whether pickup is enabled
 * @param {boolean} props.shippingEnabled - Whether shipping is enabled
 * @param {boolean} props.displayDeliveryMethod - Whether the delivery method is displayed
 * @param {Object} props.lineItems - The line items
 * @param {Function} props.onFetchTransactionLineItems - The function to fetch the transaction line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether the line items are being fetched
 * @param {propTypes.error} props.fetchLineItemsError - The error for fetching the line items
 * @param {Function} props.onContactUser - The function to contact the user
 * @returns {JSX.Element}
 */
const ProductOrderForm = props => {
  const intl = useIntl();
  const {
    price,
    currentStock,
    pickupEnabled,
    shippingEnabled,
    displayDeliveryMethod,
    allowOrdersOfMultipleItems,
  } = props;

  // Always start with quantity 0
  const quantityMaybe = { quantity: '0' };
  const deliveryMethodMaybe =
    shippingEnabled && !pickupEnabled
      ? { deliveryMethod: 'shipping' }
      : !shippingEnabled && pickupEnabled
      ? { deliveryMethod: 'pickup' }
      : !shippingEnabled && !pickupEnabled
      ? { deliveryMethod: 'none' }
      : {};
  const hasMultipleDeliveryMethods = pickupEnabled && shippingEnabled;
  const initialValues = { ...quantityMaybe };

  return (
    <FinalForm
      initialValues={initialValues}
      hasMultipleDeliveryMethods={hasMultipleDeliveryMethods}
      // displayDeliveryMethod={displayDeliveryMethod}
      {...props}
      intl={intl}
      render={renderForm}
    />
  );
};

export default ProductOrderForm;
