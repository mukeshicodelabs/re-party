import React, { useState } from 'react';
import classNames from 'classnames';

import { PrimaryButton, SecondaryButton } from '../../../components';

import css from './TransactionPanel.module.css';
import SecurityDepositModal from '../SecurityDepositModal/SecurityDepositModal';
import { states } from '../../../transactions/transactionProcessBooking';
import { states as purchaseState } from '../../../transactions/transactionProcessPurchase';
import {
  apiBaseUrl,
  cancelStripePaymentIntent,
  captureStripePaymentIntent,
  createDepositPaymentIntent,
  createShippingLabelAPI,
  createStripeSetupIntent,
  createStripeTransfer,
  oncustomerCancel,
  sendAgreementEmail,
  uploadToR2,
  zendeskMail,
} from '../../../util/api';
import moment from 'moment';
import OrderReceiveAndReturnModal from '../OrderReceive&ReturnModal/OrderReceiveAndReturnModal';
import RequestAdditionalFeeModal from '../RequestAdditionalFeeModal/RequestAdditionalFeeModal';
import axios from 'axios';

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Functional component as a helper to build ActionButtons
const ActionButtonsMaybe = props => {
  const {
    className,
    rootClassName,
    showButtons,
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
    processState,
    currentUser,
    intl,
    onManageDisableScrolling,
    transaction,
    config,
    protectedData,
    isCustomer,
  } = props;

  const [activeModal, setActiveModal] = useState('');
  const [primaryActionInProgress, setPrimaryActionInProgress] = useState(false);
  const [secondaryActionInProgress, setSecondaryActionInProgress] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const { provider, listing, booking, attributes: transactionAttributes } = transaction || {};
  const { protectedData: protectedTransactionData, metadata } = transaction.attributes || {};

  const SecurityDepositAmount =
    listing?.attributes?.publicData?.depositFee || (listing?.attributes?.price?.amount)/100 * 0.1;
  
  const providerEmail = provider?.attributes?.profile?.publicData?.email || '';
  const bookingData = booking?.attributes;
  const stripeCustomer = currentUser ? currentUser?.stripeCustomer : {};
  const stripeAccountId =
    currentUser?.stripeAccount?.attributes?.stripeAccountId ||
    transaction?.attributes?.protectedData?.stripeAccountId ||
    null;

  const tx_id = transaction ? transaction?.id?.uuid : {};

  let stripe = null;
  const stripePublishableKey = config?.stripe?.publishableKey;

  const handlePrimaryButtonClick = async () => {
    if (processState === states.PREAUTHORIZED && isProvider) {
      if (stripeAccountId) {
        protectedData.destination = stripeAccountId;
      }
      primaryButtonProps.onAction({ protectedData });
    } else if (processState == states.PREAUTHORIZED && isCustomer) {
      await handleCustomerCancellation(true);
    } else if (processState === states.ACCEPTED && isCustomer) {
      setActiveModal('SecurityDepositModal');
    } else if (processState === states.SECURITY_DEPOSITED && !isProvider) {
      primaryButtonProps.onAction({
        protectedData: {
          pickup_info: {
            readable_Timestamp: moment().unix(),
            acceptedDate: moment().format('LLL'),
          },
        },
      });
    } else if (processState === states.ORDER_DELIVERED) {
      setModalVisible(true);
    } else if (processState === states.ADDITIONAL_FEE_REQUEST_ACCEPTED && !isProvider) {
      handleAcceptClaim();
    } else if (processState === purchaseState.PURCHASED && isCustomer) {
      handleCustomerCancellation(true);
    } else if (processState === states.ORDER_RETURNED && isProvider) {
      handleCompleteTransaction();
    } else {
      primaryButtonProps.onAction();
    }
  };

  const handleSecondaryButtonClick = () => {
    if (processState === states.ORDER_RETURNED) {
      setModalVisible(true);
    } else if (processState === purchaseState.PURCHASED && isProvider) {
      handleCreateShippingLabel();
    } else {
      secondaryButtonProps.onAction();
    }
  };
  const onSubmitDeposit = async paymentMethodId => {
    setPrimaryActionInProgress(true);
    try {
      const customerId = stripeCustomer?.attributes?.stripeCustomerId;
      const selectedPaymentMethodId =
        paymentMethodId ?? stripeCustomer.defaultPaymentMethod?.attributes?.stripePaymentMethodId;

      const { clientSecret } = await createStripeSetupIntent({
        customer: customerId,
        payment_method: selectedPaymentMethodId,
        usage: 'off_session',
      });

      if (typeof window !== undefined) {
        stripe = window.Stripe(stripePublishableKey);

        const confirmResult = await stripe.confirmCardSetup(clientSecret, {
          payment_method: selectedPaymentMethodId,
        });
        if (confirmResult.error) {
          console.error('SetupIntent confirmation failed:', confirmResult.error);
          return;
        }
      }

      const STRIPE_COMMISION = 0.032; //3.2%
      const dividedAmount = SecurityDepositAmount * 100;
      const commissionPerPart = dividedAmount * STRIPE_COMMISION;
      const securityAmount = parseInt(dividedAmount + commissionPerPart);

      const paymentDetails = {
        amount: securityAmount, // Amount in cents
        currency: 'usd',
        off_session: true,
        confirm: true,
        capture_method: 'manual',
        customer: customerId,
        payment_method: selectedPaymentMethodId,
        description: 'Security deposit',
        payment_method_types: ['card'],
        metadata: {
          'sharetribe-transaction-id': tx_id,
          payment_type: 'security_deposit',
          base_deposit_amount: securityAmount.toString(),
          refundable_amount: securityAmount.toString(),
        },
      };
      const response = await createDepositPaymentIntent(paymentDetails);
      if (response?.id) {
        const depositIntentID = response.id;
        primaryButtonProps.onAction({
          protectedData: {
            depositIntentID,
            securityDeposit: { amount: securityAmount },
            transfer_group: response?.transfer_group,
          },
        });
      }
    } catch (error) {
      console.error('error', error);
    } finally {
      // setActiveModal('');
      // setPrimaryActionInProgress(false);
    }
  };
  const onSubmitOrderReceiveAndReturn = async values => {
    try {
      setLoading(true);


      const uploadPromises = values.receiveImages.map(async file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET); // required by Cloudinary

        // Upload image to Cloudinary
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });


        if (!res.ok) {
          throw new Error(`Cloudinary upload failed: ${res.statusText}`);
        }

        const data = await res.json();

        return {
          file: {
            url: data.secure_url, // Cloudinary hosted image
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height,
          },
          description: values.receiveDescription || '',
        };
      });

      const uploadResults = await Promise.all(uploadPromises);

      const protectedDataKey =

        processState === states.ORDER_DELIVERED ? 'mediaOrderReceive' : 'mediaOrderReturn';


      primaryButtonProps.onAction({
        protectedData: { [protectedDataKey]: uploadResults },
      });

      setModalVisible(false);
    } catch (error) {
      console.error('Error uploading files to Cloudinary:', error);
    } finally {
      setLoading(false);
    }
  };


  const onSubmitAdditionalFee = async values => {
    const { additionalFeeImages, reason, AdditionalPrice } = values;
    try {
      setLoading(true);

      const uploadPromises = additionalFeeImages?.map(async file => {

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET); // Cloudinary preset
        // Upload image to Cloudinary

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );


        if (!res.ok) {
          throw new Error(`Cloudinary upload failed: ${res.statusText}`);
        }

        const data = await res.json();

        return {
          file: {
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height,
          },
          description: reason || '',
          AdditionalPrice,
        };
      });

      const uploadResults = await Promise.all(uploadPromises);


      const payload = uploadResults?.map(item => ({

        file: item.file,
        description: item.description,
        AdditionalPrice: item.AdditionalPrice?.amount || item.AdditionalPrice,
      }));

      secondaryButtonProps.onAction({
        protectedData: { additionalfeeRequested: payload },
      });

      await zendeskMail({
        transactionId: transaction?.id?.uuid,
        name: transaction?.customer?.attributes?.profile?.displayName || 'not valid',
      });


      setModalVisible(false);
    } catch (error) {
      console.error('Error uploading additional fee files to Cloudinary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClaim = async () => {
    try {
      setPrimaryActionInProgress(true);
      const { depositIntentID, transfer_group, additionalfeeRequested, destination } =
        protectedTransactionData || {};
      const [{ AdditionalPrice }] = additionalfeeRequested;
      const STRIPE_COMMISION = 0.032; //3.2%
      const dividedAmount = AdditionalPrice;
      const commissionPerPart = dividedAmount * STRIPE_COMMISION;
      const providerRefundPrice = parseInt(dividedAmount + commissionPerPart);
      const newIntentId = metadata?.reauthorizedDeposit?.newIntentId;
      const intentToCapture = newIntentId || depositIntentID;

      const params = {
        intentToCapture,
        transfer_group,
        providerStripeAccountId: destination,
        claimAmountCents: Math.round(providerRefundPrice),
        tx_id,
      };

      const capturePromise = await captureStripePaymentIntent(params);
      if (capturePromise?.captured?.capturedIntentId && capturePromise?.transfer?.id) {
        const protectedPayload = {
          acceptedClaimData: {
            capturedIntentId: capturePromise.captured.capturedIntentId,
            chargeId: capturePromise.captured.chargeId,
            amountCaptured: capturePromise.captured.amountCaptured / 100,
            transferId: capturePromise.transfer.id,
            transferredAmountToProvider: capturePromise.transfer.amount / 100,
          },
        };

        primaryButtonProps.onAction({
          protectedData: protectedPayload,
        });
      }
    } catch (error) {
      console.error('Error Accepting Claim : ', error);
    } finally {
      setPrimaryActionInProgress(false);
    }
  };

  const handleCreateShippingLabel = async () => {
    try {
      setSecondaryActionInProgress(true); // show loader

      const { selectedShippingOption } = protectedTransactionData;

      if (!selectedShippingOption || !transaction?.id?.uuid) {
        console.error('Missing shipping option or transaction ID');
        return;
      }

      const shippingData = {
        rateObject_id: selectedShippingOption,
        orderId: transaction.id.uuid,
      };

      const response = await createShippingLabelAPI(shippingData);

      if (response?.tracking_number) {
        const {
          tracking_number: trackingNumber,
          object_id: objectId,
          tracking_url_provider: trackingUrlProvider,
          label_url: labelUrl,
          tracking_status: trackingStatus,
          parcel,
        } = response;

        const trackingInfo = {
          trackingNumber,
          labelId: objectId,
          trackingUrlProvider,
          labelUrl,
          trackingStatus,
          parcel,
        };

        secondaryButtonProps.onAction({
          protectedData: {
            shippingData: trackingInfo,
          },
        });
      } else {
        console.error('Failed to create shipping label or missing tracking number');
      }
    } catch (error) {
      console.error('Error while creating shipping label:', error);
    } finally {
      // secondaryActionInProgress(false); // hide loader
    }
  };

  const handleCustomerCancellation = async (isPrimaryInprogress = false) => {

    try {
      isPrimaryInprogress ? setPrimaryActionInProgress(true) : setSecondaryActionInProgress(true);
      const { sharetribePaymentIntent } = protectedTransactionData || {};
      const { lineItems, payinTotal } = transaction.attributes || {};
      const amount = payinTotal?.amount;
      const payload = {
        sharetribePaymentIntent,
        amount: amount,

      };

      const result = await oncustomerCancel(payload);


      if (result) {
        primaryButtonProps.onAction();
      }
    } catch (error) {
      console.log('error', error);
    } finally {
      setSecondaryActionInProgress(false);
      setActiveModal('');
    }
  };

  const handleCompleteTransaction = async (isPrimaryInprogress = false) => {
    try {
      setPrimaryActionInProgress(true);
      const { depositIntentID } = protectedTransactionData || {};
      const newIntentId = metadata?.reauthorizedDeposit?.newIntentId;
      const intentToCancel = newIntentId || depositIntentID;
      const cancelIntentPromise = cancelStripePaymentIntent({
        paymentIntentId: intentToCancel,
        tx_id,
      });
      primaryButtonProps.onAction({
        protectedData: {
          completedTransactionData: true,
        },
      });
    } catch (error) {
      console.error('error', error);
    } finally {
      setPrimaryActionInProgress(false);
    }
  };

  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    return null;
  }

  const buttonsDisabled = primaryButtonProps?.inProgress || secondaryButtonProps?.inProgress;

  const primaryButton = primaryButtonProps ? (
    <PrimaryButton
      inProgress={primaryButtonProps.inProgress || primaryActionInProgress}
      disabled={buttonsDisabled}
      onClick={handlePrimaryButtonClick}
    >
      {primaryButtonProps.buttonText}
    </PrimaryButton>
  ) : null;
  const primaryErrorMessage = primaryButtonProps?.error ? (
    <p className={css.actionError}>{primaryButtonProps?.errorText}</p>
  ) : null;

  const secondaryButton = secondaryButtonProps ? (
    <SecondaryButton
      inProgress={secondaryButtonProps?.inProgress || secondaryActionInProgress}
      disabled={buttonsDisabled}
      onClick={handleSecondaryButtonClick}
    >
      {secondaryButtonProps.buttonText}
    </SecondaryButton>
  ) : null;
  const secondaryErrorMessage = secondaryButtonProps?.error ? (
    <p className={css.actionError}>{secondaryButtonProps?.errorText}</p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return (
    <>
      {showButtons ? (
        <div className={classes}>
          <div className={css.actionErrors}>
            {primaryErrorMessage}
            {secondaryErrorMessage}
          </div>
          <div className={css.actionButtonWrapper}>
            {secondaryButton}
            {primaryButton}
          </div>
          
        </div>
      ) : null}

      <SecurityDepositModal
        isOpen={activeModal === 'SecurityDepositModal'}
        inProgress={primaryActionInProgress}
        intl={intl}
        onSubmit={onSubmitDeposit}
        bookingStartDay={bookingData?.start}
        onCloseModal={() => setActiveModal('')}
        onManageDisableScrolling={onManageDisableScrolling}
        currentUser={currentUser}
        SecurityDepositAmount={SecurityDepositAmount}
      />
      <OrderReceiveAndReturnModal
        isOpen={
          modalVisible &&
          (processState === states.ORDER_DELIVERED || processState === states.ORDER_RECEIVED)
        }
        intl={intl}
        onCloseModal={() => setModalVisible(!modalVisible)}
        onSubmit={onSubmitOrderReceiveAndReturn}
        loading={loading}
        transactionProtectedData={protectedData}
        onManageDisableScrolling={onManageDisableScrolling}
      />
      <RequestAdditionalFeeModal
        rootClassName={css.feeModal}
        isOpen={modalVisible && processState === states.ORDER_RETURNED}
        intl={intl}
        onCloseModal={() => setModalVisible(!modalVisible)}
        onSubmit={onSubmitAdditionalFee}
        loading={loading}
        onManageDisableScrolling={onManageDisableScrolling}
        securityAmount={SecurityDepositAmount}
      />
    </>
  );
};


export default ActionButtonsMaybe;

