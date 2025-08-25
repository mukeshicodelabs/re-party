import React, { useEffect, useState } from 'react';
import { H3, Modal, PrimaryButton } from '../../../components';
import classNames from 'classnames';
import css from './SecurityDepositModal.module.css';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import AddCardPayment from './AddCardPayment';
import { fetchCurrentUser } from '../../../ducks/user.duck';
// import { getDepositAmount } from '../../../util/configHelpers';
import moment from 'moment';
import { getCurrentUtcTime } from '../../../util/api';
const isDev = process.env.REACT_APP_ENV === 'development';

const getIsBookingDay = async bookingStartDateStr => {
  const bookingStartDate = moment(bookingStartDateStr).startOf('day');
  const currentDateResponse = await getCurrentUtcTime();
  const currentDate = moment(currentDateResponse.date);
  return currentDate.isSameOrAfter(bookingStartDate.clone().subtract(24, 'hours'));
};

function SecurityDepositModal(props) {
  const {
    id,
    className,
    rootClassName,
    inProgress,
    isOpen,
    onSubmit,
    intl,
    onCloseModal,
    onManageDisableScrolling = () => { },
    currentUser,
    listingType,
    bookingStartDay,
    SecurityDepositAmount
  } = props;

  const { stripeCustomer } = currentUser || {};
  const classes = classNames(rootClassName || css.root, className);
  const [addCardModal, setAddCardModal] = useState(false);
  const [isBookingDay, setIsBookingDay] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const checkBookingDay = async () => {
      // if (isDev) {
      //   setIsBookingDay(true);
      //   return;
      // }
      const result = await getIsBookingDay(bookingStartDay);
      setIsBookingDay(result);
    };

    if (isOpen) {
      checkBookingDay();
    }
  }, [isOpen]);

  // const baseAmount = SecurityDepositAmount;
  const STRIPE_COMMISION = 0.032; //3.2%
  const dividedAmount = SecurityDepositAmount * 100;
  const commissionPerPart = dividedAmount * STRIPE_COMMISION;
  const securityAmount = parseInt(dividedAmount + commissionPerPart);
  // const commission = baseAmount * 0.1;
  // const closeButtonMessage = intl.formatMessage({ id: 'ReviewModal.later' });
  const modalTitle = (
    <H3 className={css.securityDepositTitle}>
      {intl.formatMessage({ id: 'SecurityDepositModal.subHeading' })}
    </H3>
  );
  const buttonTitle = (
    <FormattedMessage
      className={css.securityDepositBtn}
      id="SecurityDepositModal.btnTitle"
      values={{ amount: securityAmount / 100 }}
    />
  );

  const handleOnSubmit = async value => {
    if (!stripeCustomer?.defaultPaymentMethod) {
      setAddCardModal(true);
    } else {
      onSubmit();
    }
  };

  const handleClose = async () => {
    setAddCardModal(false);
    let stripePaymentMethodId;
    await dispatch(fetchCurrentUser()).then(res => {
      stripePaymentMethodId =
        res?.stripeCustomer?.defaultPaymentMethod?.attributes?.stripePaymentMethodId ?? '';
    });

    if (stripePaymentMethodId) {
      onSubmit(stripePaymentMethodId);
    }
  };

  return (
    <>
      <Modal
        id={id}
        containerClassName={classes}
        contentClassName={css.modalContent}
        isOpen={isOpen}
        onClose={onCloseModal}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <div className={css.contentWrapper}>
          <div className={css.modalHeading}>{modalTitle}</div>
          <div className={css.description}>
            <FormattedMessage id={'SecurityDepositModal.message'} values={{ amount: (securityAmount / 100) }} />
          </div>
        </div>
        <PrimaryButton 
        disabled={!isBookingDay} 
        inProgress={inProgress} 
        onClick={handleOnSubmit}>
          {buttonTitle}
        </PrimaryButton>
        <span className={css.errorText}>
          {!isBookingDay ? <FormattedMessage id="SecurityDepositModal.bookingError" /> : null}
        </span>
      </Modal>

      <Modal
        id="AddCardModal"
        className={css.disableModalBorder}
        contentClassName={css.containerClassName}
        isOpen={!!addCardModal}
        onClose={() => setAddCardModal(false)}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <label>
          <FormattedMessage id="SecurityModal.addCard" />
        </label>
        <div className={css.paymentWrapper}>
          <AddCardPayment currentUser={currentUser} dispatch={dispatch} onClose={handleClose} />
        </div>
      </Modal>
    </>
  );
}
export default SecurityDepositModal;
