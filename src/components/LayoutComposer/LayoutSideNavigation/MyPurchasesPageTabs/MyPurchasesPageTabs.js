/**
 * This is a wrapper component for different Layouts.
 * Navigational 'aside' content should be added to this wrapper.
 */
import React, { useEffect } from 'react';
import { node, number, string, shape } from 'prop-types';

import { FormattedMessage } from '../../../../util/reactIntl';

import { TabNav } from '../../..';

import css from './MyPurchasesPageTabs.module.css';
import { compose } from 'redux';
import { withViewport } from '../../../../util/uiHelpers';

const MyPurchasesPageTabsComponent = props => {

  const { currentPage, tabType } = props;

  const tabs = [
    {
      text: <FormattedMessage id="MyPurchasesPage.viewAll" />,
      selected: tabType === 'viewPurchases',
      id: 'MyPurchasesPageTabViewAll',
      linkProps: {
        name: 'MyPurchasesPage',
        params: {
          tab: 'viewPurchases',
        },
      },
    },
    {
      text: <FormattedMessage id="MyPurchasesPage.rental" />,
      selected: tabType === 'rent',
      id: 'MyPurchasesPageTabRental',
      linkProps: {
        name: 'MyPurchasesPage',
        params: {
          tab: 'rent',
        },
      },
    },
    //  {
    //    text: <FormattedMessage id="MyPurchasesPage.delivery" />,
    //    selected: tabType === 'delivery',
    //    id: 'MyPurchasesPageTabSell',
    //    linkProps: {
    //      name: 'MyPurchasesPage',
    //      params: {
    //        tab: 'delivery',
    //      },
    //    },
    //  },
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

MyPurchasesPageTabsComponent.defaultProps = {
  className: null,
  rootClassName: null,
  children: null,
  currentPage: null,
};

MyPurchasesPageTabsComponent.propTypes = {
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

const MyPurchasesPageTabs = compose(withViewport)(MyPurchasesPageTabsComponent);

export default MyPurchasesPageTabs;