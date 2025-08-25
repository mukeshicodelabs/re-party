/**
 * This is a wrapper component for different Layouts.
 * Navigational 'aside' content should be added to this wrapper.
 */
import React, { useEffect } from 'react';
import { node, number, string, shape } from 'prop-types';

import { FormattedMessage } from '../../../../util/reactIntl';

import { TabNav } from '../../..';

import css from './PaymentStateTab.module.css';
import { compose } from 'redux';
import { withViewport } from '../../../../util/uiHelpers';

const PaymentStateTabComponent = props => {

    const { currentPage, PayoutTab, PaymentInfoTab, tabType } = props;

    const tabs = [
        {
            text: <FormattedMessage id="PaymentStateTab.payOut" />,
            selected: currentPage === 'StripePayoutPage',
            id: 'StripePayoutPage',
            linkProps: {
                name: 'StripePayoutPage',
            },
        },
        {
            text: <FormattedMessage id="PaymentStateTab.paymentInfo" />,
            selected: currentPage === 'PaymentMethodsPage',
            id: 'PaymentMethodsPage',
            linkProps: {
                name: 'PaymentMethodsPage',
            },
        },

    ];
    return (
        <TabNav
            rootClassName={css.tabs}
            tabRootClassName={css.tab}
            tabs={tabs}
            profilePageTab={true}
            listingTab={true}
        />
    );
};

PaymentStateTabComponent.defaultProps = {
    className: null,
    rootClassName: null,
    children: null,
    currentPage: null,
};

PaymentStateTabComponent.propTypes = {
    children: node,
    className: string,
    rootClassName: string,
    currentPage: string,

    // from withViewport
    viewport: shape({
        width: number.isRequired,
        height: number.isRequired,
    }).isRequired,
};

const PaymentStateTab = compose(withViewport)(PaymentStateTabComponent);

export default PaymentStateTab;