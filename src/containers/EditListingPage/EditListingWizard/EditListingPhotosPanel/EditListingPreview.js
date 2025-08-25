import React from 'react';
import css from './EditListingPreview.module.css';
import { useConfiguration } from '../../../../context/configurationContext';
import { FormattedMessage, useIntl } from 'react-intl';
import { ensureUser, userDisplayNameAsString } from '../../../../util/data';
import SectionGallery from '../../../ListingPage/SectionGallery';
import CustomListingFields from '../../../ListingPage/CustomListingFields';
import { isBookingProcess, resolveLatestProcessName } from '../../../../transactions/transaction';
import { displayPrice } from '../../../../util/configHelpers';
import { priceData } from '../../../ListingPage/ListingPage.shared';
import SectionTextMaybe from '../../../ListingPage/SectionTextMaybe';
import classNames from 'classnames';
import { Button, FieldLocationAutocompleteInput, FieldSelect, PrimaryButton } from '../../../../components';
import { Field } from 'react-final-form';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';
import Swal from 'sweetalert2';
const identity = v => v;
const formatMoneyIfSupportedCurrency = (price, intl) => {
    try {
        return formatMoney(intl, price);
    } catch (e) {
        return `(${price.currency})`;
    }
};
const PriceMaybe = props => {
    const {
        price,
        publicData,
        validListingTypes,
        intl,
        marketplaceCurrency,
        showCurrencyMismatch = false,

    } = props;
    const { listingType, unitType, transactionProcessAlias } = publicData || {};
    const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
    const isBooking = isBookingProcess(processName);
    const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
    const showPrice = displayPrice(foundListingTypeConfig);
    const isPriceVariationsInUse = !!publicData?.priceVariationsEnabled;
    const hasMultiplePriceVariants = publicData?.priceVariants?.length > 1;

    if (!showPrice || !price || (isPriceVariationsInUse && hasMultiplePriceVariants)) {
        return null;
    }

    // Get formatted price or currency code if the currency does not match with marketplace currency
    const { formattedPrice, priceTitle } = priceData(price, marketplaceCurrency, intl);

    const priceValue = (
        <span className={css.priceValue}>{formatMoneyIfSupportedCurrency(price, intl)}</span>
    );
    const pricePerUnit = (
        <span className={css.perUnit}>
            <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
        </span>
    );

    // TODO: In CTA, we don't have space to show proper error message for a mismatch of marketplace currency
    //       Instead, we show the currency code in place of the price
    return true ? (
        <div className={css.priceContainerInCTA}>
            <span className={css.priceValueInCTA} title={priceTitle}>
                <FormattedMessage
                    id="OrderPanel.priceInMobileCTA"
                    values={{ priceValue: formattedPrice }}
                />
            </span>
            <span className={css.perUnitInCTA}>
                {/* <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} /> */}
                {isBooking ? (
                    <FormattedMessage id="OrderPanel.perUnitDailyPrice" />
                ) : (
                    <FormattedMessage id="OrderPanel.perUnitFixedPrice" />
                )}
            </span>
        </div>
    ) : (
        <div className={css.priceContainer}>
            <p className={css.price}>
                <FormattedMessage id="OrderPanel.price" values={{ priceValue, pricePerUnit }} />
            </p>
        </div>
    );
};

export default function EditListingPreview(props) {
    const {
        listing,
        imageUrl,
        setShowPreview,
        isPublished,
        isStripeAccountConnected,
        onManageDisableScrolling,
        handleSubmit,
        setOpenSubmitModal,
        form,
    } = props || {};
    const config = useConfiguration();
    const intl = useIntl()
    const {
        description = '',
        geolocation = null,
        price = null,
        title = '',
        publicData = {},
        metadata = {},
    } = listing?.attributes;
    const { listingLocation, productType, rentFlatPrice, rentDeliveryOptions, rentShippingLocation, depositFee, lateFee,sellDeliveryOptions } = publicData || {};
    const ensuredAuthor = listing?.author ? ensureUser(listing?.author) : null;
    const authorDisplayName = userDisplayNameAsString(ensuredAuthor, '');
    const isDeliveryMethodEnabled =
        rentDeliveryOptions?.includes('shipping') && rentShippingLocation?.selectedPlace?.address;
    const isPickupMethodEnabled = rentDeliveryOptions?.includes('pickup');

    const listingConfig = config.listing;
    // const deliveryPickupMethodOptions = [
    //     {
    //         key: 'delivery',
    //         label: 'Shipping',
    //     },
    //     {
    //         key: 'pickup',
    //         label: 'Pick-Up',
    //     },
    // ];
     const deliveryPickupMethodOptions = [];
   

  if (sellDeliveryOptions?.includes('shipping')) {
    deliveryPickupMethodOptions.push({
      key: 'delivery',
      label: intl.formatMessage({ id: 'ProductOrderForm.deliveryLabel' }),
    });
  }
  if (sellDeliveryOptions?.includes('pickup')) {
    deliveryPickupMethodOptions.push({
      key: 'pickup',
      label: intl.formatMessage({ id: 'ProductOrderForm.pickupLabel' }),
    });
  }
    return (
        <>
        <div className={css.prviewPage}>
            <div className={css.previewLeftSide}>
                <div className={css.listingHero}>
                    <SectionGallery previewGallery={true} listing={listing} variantPrefix={config.layout.listingImage.variantPrefix} />
                </div>
                <div className={css.listingDetails}>
                    <div className={css.listingHeading}>
                        <SectionTextMaybe showAsIngress heading={title} location={listingLocation} />
                    </div>
                    <div className={css.priceWrapper}>
                        <PriceMaybe
                            price={price}
                            publicData={publicData}
                            validListingTypes={config.listing.listingTypes}
                            intl={intl}
                            marketplaceCurrency={config.currency}
                        />
                    </div>

                    {description ? <pre className={css.listingDescription}>{description}</pre> : null}


                    <CustomListingFields
                        publicData={publicData}
                        metadata={metadata}
                        listingFieldConfigs={listingConfig.listingFields}
                        categoryConfiguration={config.categoryConfiguration}
                        intl={intl}
                        config={config}
                    />
                </div>
            </div>
            <div className={css.previewRightSide}>
                {productType === 'rent' ? (
                    <div>
                        <div className={css.orderPanelWrapper}>
                            <div className={css.rentalHeading}>Rental Window (Days) Price</div>
                            <div className={css.priceTypeToggleWrapper}>
                                {price?.amount ? (
                                    <div
                                        className={classNames(css.priceTypeOption, {
                                            [css.selectedOption]: price?.amount === price?.amount,
                                        })}
                                    // onClick={() =>
                                    //   setSelectedPricingOption(prev =>
                                    //     prev === price?.amount ? null : price?.amount
                                    //   )
                                    // }
                                    >
                                        ${price?.amount / 100}
                                        <span className={css.unit}> /Per Day</span>
                                    </div>
                                ) : null}

                                {rentFlatPrice ? (
                                    <div
                                        className={classNames(css.priceTypeOption, {
                                            [css.selectedOption]: rentFlatPrice * 100 === rentFlatPrice * 100,
                                        })}
                                    // onClick={() =>
                                    //   setSelectedPricingOption(prev =>
                                    //     prev === (rentFlatPrice * 100) ? null : (rentFlatPrice * 100)
                                    //   )
                                    // }
                                    >
                                        ${rentFlatPrice}
                                        <span className={css.unit}> /3 Day</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <FieldSelect
                            id="deliveryMethod"
                            name="deliveryMethod"
                            className={css.inputBox}
                            label={'Delivery Method'}
                        >
                            <option disabled value="">
                                {'Select delivery method'}
                            </option>
                            {isPickupMethodEnabled ? <option value="pickup">Pickup</option> : null}
                            {isDeliveryMethodEnabled ? <option value="delivery">Delivery</option> : null}
                        </FieldSelect>
                        {publicData?.setupPrice && (
                            <div className={css.addOns}>
                                <div className={css.addOnsHeading}>Customisable Add-Ons</div>
                                <div className={css.addOnWrapper}>
                                    <label className={css.addOnLabel}>
                                        <input
                                            type="checkbox"
                                            className={css.addOnCheckbox}
                                        // checked={!!selectedSetupFee}
                                        />
                                        <span className={css.checkboxDesign}></span>
                                        <div className={css.addonRow}>
                                            <span className={css.addOnText}>${publicData.setupPrice}</span>
                                            <span className={css.setup}>Setup</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className={css.returnPrimeBox}>
                            {lateFee ? (
                                <div className={css.returnBox}>
                                    <span className={css.returnLabel}>Late Return fee</span>
                                    <span className={css.returnDetail}>${lateFee}</span>
                                </div>
                            ) : null}
                            <div className={css.returnBox}>
                                <span className={css.returnLabel}>Security Deposit</span>
                                {depositFee ? (
                                    <span className={css.returnDetail}> ${depositFee}</span>
                                ) : (
                                    <span className={css.returnDetail}> 10% of the product amount</span>
                                )}
                            </div>
                        </div>

                        <FieldLocationAutocompleteInput
                            className={css.locationInput}
                            rootClassName={css.locationAddress}
                            inputClassName={css.locationAutocompleteInput}
                            iconClassName={css.locationAutocompleteInputIcon}
                            predictionsClassName={css.predictionsRoot}
                            validClassName={css.validLocation}
                            autoFocus={true}
                            name={'userLocation'}
                            label="Location"
                            placeholder="Enter your location"
                            useDefaultPredictions={false}
                            format={identity}
                        />
                        <div className={css.feeHelp}>
                            <BrandIconCard type="information" />
                            <span>
                                The fee helps us run this platform and provide the best possible service to you!
                            </span>
                        </div>
                        <div className={css.submitButton}>
                            <Button
                                type="button"
                                disabled={true}
                                className={css.requestToRentButton}
                            >
                                <FormattedMessage id="BookingDatesForm.requestToRent" />
                            </Button>
                            <Button
                                type="button"
                                disabled={true}
                                className={css.addToCartButton}
                            >
                                <BrandIconCard type="addcart" />
                                <FormattedMessage id="BookingDatesForm.addToCart" />
                            </Button>
                        </div>
                    </div>
                ) :

                    <div className={css.selectedMethod}>
                        <FieldSelect
                            id={'deliveryMethod'}
                            name={'deliveryMethod'}
                            className={css.deliveryMethod}
                            label="Select Shipping/Pickup Method"

                        >
                            <option value="" disabled>
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
                      { sellDeliveryOptions?.includes('shipping') ? <div className={css.selectLabels} >
                            <FieldSelect
                                id={'deliveryMethod'}
                                name={'Select option'}
                                className={css.field}
                            >
                                <option>
                                    {'Select shipping rates'}
                                </option>

                                <option>
                                    $ 5.00
                                </option>
                                <option >
                                    $ 5.00
                                </option>
                                <option >
                                    $ 5.00
                                </option>
                                <option >
                                    $ 5.00
                                </option>
                            </FieldSelect>
                        </div>:null}
                        <div className={css.quantityFieldWrapper}>
                            <label className={css.label}>
                                {intl.formatMessage({ id: 'ProductOrderForm.quantityLabel' })}
                            </label>
                            <Field name="quantity" >
                                {({ input, meta }) => {

                                    return (
                                        <div className={css.customQuantityInput}>
                                            <button type="button" className={css.quantityButton} >
                                                <BrandIconCard type="minus" />
                                            </button>
                                            <span className={css.quantityValue}>0</span>
                                            <button type="button" className={css.quantityButton} >
                                                <BrandIconCard type="plus" />
                                            </button>
                                        </div>
                                    );
                                }}
                            </Field>
                        </div>
                        <div className={css.submitButton}>
                            <Button type="button"
                                disabled={true}
                                className={css.requestToRentButton}>
                                <FormattedMessage id="ProductOrderForm.ctaButton" />
                            </Button>
                            <Button
                                type="button"
                                disabled={true}
                                className={css.addToCartButton}
                            >
                                <BrandIconCard type="addcart" />
                                <FormattedMessage id="BookingDatesForm.addToCart" />
                            </Button>
                        </div>
                    </div>
                }
                <div className={css.paymentSupport}>
                    <div className={css.supportCard}>
                        <div className={css.supportIcon}>
                            <BrandIconCard type="payments" />
                        </div>
                        <div className={css.supportHeading}>Trusted Payments</div>
                        <div className={css.supportSubHeading}>Fully encrypted and securely gated.</div>
                    </div>
                    <div className={css.supportCard}>
                        <div className={css.supportIcon}>
                            <BrandIconCard type="support" />
                        </div>
                        <div className={css.supportHeading}>Real Support</div>
                        <div className={css.supportSubHeading}>Get help and support.</div>
                    </div>
                </div>
            </div>


        </div>
        <div className={css.bottomBox}>
                    <Button
                        type="button"
                        className={css.nextButton}
                        // inProgress={submitInProgress}
                        // ready={submitReady}
                        onClick={() => {
                            const submitValues = {
                                ...form.getState().values,
                                imageUrl,
                            };
                            if (isPublished || !isStripeAccountConnected) {
                                const result = handleSubmit(submitValues);
                                if (result && typeof result.then === 'function') {
                                    result.then(() => {
                                        if (isPublished) {
                                            setShowPreview(false);
                                        }

                                    }).catch(console.error);
                                } else if (isPublished) {
                                    // If handleSubmit is not a promise, close the modal directly
                                    setShowPreview(false);
                                    Swal.fire({
                                        toast: true,
                                        position: 'top-end', // 'top-end' is better for toasts
                                        icon: 'success',
                                        text: 'Your listing updated successfully.',
                                        showConfirmButton: false,
                                        timer: 5000, // Closes after 5 seconds
                                        timerProgressBar: true,
                                        showClass: {
                                            popup: 'swal2-noanimation', // disables show animation (shake)
                                        },
                                        hideClass: {
                                            popup: '', // disables hide animation
                                        },
                                        didOpen: (toast) => {
                                            // Change timer progress bar color to green
                                            const progressBar = toast.querySelector('.swal2-timer-progress-bar');
                                            if (progressBar) {
                                                progressBar.style.backgroundColor = 'green';
                                            }
                                        },
                                    });
                                }
                            } else {
                                setOpenSubmitModal(true);
                            }
                        }}
                    >
                        {isPublished ? "Save" :"Ready to Submit"}
                    </Button>
                    <Button
                        type="button"
                        className={css.nextButton}
                        onClick={() => {
                            setShowPreview(false)
                        }}
                    >
                        Back
                    </Button>
                </div>
        </>
    );


}