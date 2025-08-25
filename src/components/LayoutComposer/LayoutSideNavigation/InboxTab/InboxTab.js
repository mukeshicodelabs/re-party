/**
 * This is a wrapper component for different Layouts.
 * Navigational 'aside' content should be added to this wrapper.
 */
import React, { useEffect } from 'react';
import { node, number, string, shape } from 'prop-types';

import { FormattedMessage } from '../../../../util/reactIntl';

import { TabNav } from '../../..';

import css from './InboxTab.module.css'
import { compose } from 'redux';
import { withViewport } from '../../../../util/uiHelpers';

const InboxPageTabComponent = props => {

  const { inboxPageTab, tabType, listingTab, isAccountSettingTab } = props; 

  const tabs = [
    {
      text: <FormattedMessage id="InboxPageTab.sales" />,
      selected: tabType === 'sales',
      id: 'InboxPageTab',
      linkProps: {
        name: 'InboxPage',
        params: {
          tab: 'sales',
        },
      },
    },
    { 
      text: <FormattedMessage id="InboxPageTab.orders" />,
      selected: tabType === 'orders',
      id: 'InboxPageTab',
      linkProps: {
        name: 'InboxPage',
        params: {
          tab: 'orders',
        },
      },
    },
  ];
  return (
    <TabNav
      rootClassName={css.tabs}
      tabRootClassName={css.tab}
      listingTab={true}
      tabs={tabs}
      tabType={tabType}
      profilePageTab={true}
    />
  );
};

InboxPageTabComponent.defaultProps = {
  className: null,
  rootClassName: null,
  children: null,
  currentPage: null,
};

InboxPageTabComponent.propTypes = {
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

const InboxPageTab = compose(withViewport)(InboxPageTabComponent);

export default InboxPageTab;
