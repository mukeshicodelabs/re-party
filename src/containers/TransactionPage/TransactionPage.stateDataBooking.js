import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../transactions/transaction';

/**
 * Get state data against booking process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo detials about transaction
 * @param {*} processInfo  details about process
 */
export const getStateDataForBookingProcess = (txInfo, processInfo) => {
  const { transaction, transactionRole, nextTransitions } = txInfo;
  const isProviderBanned = transaction?.provider?.attributes?.banned;
  const isCustomerBanned = transaction?.provider?.attributes?.banned;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const {
    processName,
    processState,
    states,
    transitions,
    isCustomer,
    actionButtonProps,
    leaveReviewProps,
  } = processInfo;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, CUSTOMER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const requestAfterInquiry = transitions.REQUEST_PAYMENT_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(requestAfterInquiry);
      const showOrderPanel = !isProviderBanned && hasCorrectNextTransition;
      return { processName, processState, showOrderPanel };
    })
    .cond([states.INQUIRY, PROVIDER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.PREAUTHORIZED, CUSTOMER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.CUSTOMER_CANCEL_BOOKING, CUSTOMER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showExtraInfo: true,
        showActionButtons: true,
        primaryButtonProps: primary,
      };
    })
    .cond([states.PREAUTHORIZED, PROVIDER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.ACCEPT, PROVIDER);
      const secondary = isCustomerBanned ? null : actionButtonProps(transitions.DECLINE, PROVIDER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.ACCEPTED, CUSTOMER], () => {
      const primary = isCustomerBanned
        ? null
        : actionButtonProps(transitions.SECURITY_DEPOSIT_PAYMENT, CUSTOMER);
      const secondary = isCustomerBanned
        ? null
        : actionButtonProps(transitions.CUSTOMER_CANCEL_BOOKING_AFTER_ACCEPT, CUSTOMER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.SECURITY_DEPOSITED, PROVIDER], () => {
      const primary = isCustomerBanned
        ? null
        : actionButtonProps(transitions.MARK_DELIVERD, PROVIDER);

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
      };
    })
    .cond([states.ORDER_DELIVERED, CUSTOMER], () => {
      const primary = isCustomerBanned
        ? null
        : actionButtonProps(transitions.MARK_RECEIVE, CUSTOMER);

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
      };
    })
    .cond([states.ORDER_RECEIVED, CUSTOMER], () => {
      const primary = isCustomerBanned
        ? null
        : actionButtonProps(transitions.MARK_ORDER_RETURNED, CUSTOMER);

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
      };
    })
    .cond([states.ORDER_RETURNED, PROVIDER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.MARK_ORDER_COMPLETE, PROVIDER);
      const secondary = isCustomerBanned ? null : actionButtonProps(transitions.ADDITIONAL_FEE_REQUEST, PROVIDER);

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.ADDITIONAL_FEE_REQUESTED, CUSTOMER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.ADDITIONAL_FEE_REQUEST_ACCEPT, CUSTOMER);
      const secondary = isCustomerBanned ? null : actionButtonProps(transitions.ADDITIONAL_FEE_REQUEST_DECLINE, CUSTOMER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
        secondaryButtonProps: secondary,
      };
    })
    .cond([states.ADDITIONAL_FEE_REQUEST_ACCEPTED, CUSTOMER], () => {
      const primary = isCustomerBanned ? null : actionButtonProps(transitions.ADDITIONAL_FEE_DEPOSIT_TO_PROVIDER, CUSTOMER);
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: primary,
      };
    })
    .cond([states.DELIVERED, _], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsFirstLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED, _], () => {
      return { processName, processState, showDetailCardHeadings: true, showReviews: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState, showDetailCardHeadings: true };
    })
    .resolve();
};
