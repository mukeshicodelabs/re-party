/**
 * This is a wrapper component for different Layouts.
 * Navigational 'aside' content should be added to this wrapper.
 */
import React, { useEffect } from 'react';
import { node, number, string, shape } from 'prop-types';
import { compose } from 'redux';

import { FormattedMessage } from '../../../../util/reactIntl';
import { withViewport } from '../../../../util/uiHelpers';

import { Button, TabNav } from '../../../../components';

import { createGlobalState } from '../hookGlobalState';

import css from './LayoutWrapperSideTab.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../../ducks/auth.duck';
import BrandIconCard from '../../../BrandIconCard/BrandIconCard';
import { ACCOUNT_SETTINGS_PAGES, FAQ_PAGES } from '../../../../routing/routeConfiguration';

const MAX_HORIZONTAL_NAV_SCREEN_WIDTH = 1023;

// Add global state for tab scrolling effect
const initialScrollState = { scrollLeft: 0 };
const { useGlobalState } = createGlobalState(initialScrollState);

// Horizontal scroll animation using element.scrollTo()
const scrollToTab = (currentPage, scrollLeft, setScrollLeft) => {
  const el = document.querySelector(`#${currentPage}Tab`);

  if (el) {
    // el.scrollIntoView doesn't work with Safari and it considers vertical positioning too.
    // This scroll behaviour affects horizontal scrolling only
    // and it expects that the immediate parent element is scrollable.
    const parent = el.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const maxScrollDistance = parent.scrollWidth - parentRect.width;

    const hasParentScrolled = parent.scrollLeft > 0;
    const scrollPositionCurrent = hasParentScrolled ? parent.scrollLeft : scrollLeft;

    const tabRect = el.getBoundingClientRect();
    const diffLeftBetweenTabAndParent = tabRect.left - parentRect.left;
    const tabScrollPosition = parent.scrollLeft + diffLeftBetweenTabAndParent;

    const scrollPositionNew =
      tabScrollPosition > maxScrollDistance
        ? maxScrollDistance
        : parent.scrollLeft + diffLeftBetweenTabAndParent;

    const needsSmoothScroll = scrollPositionCurrent !== scrollPositionNew;

    if (!hasParentScrolled || (hasParentScrolled && needsSmoothScroll)) {
      // Ensure that smooth scroll animation uses old position as starting point after navigation.
      parent.scrollTo({ left: scrollPositionCurrent });
      // Scroll to new position
      parent.scrollTo({ left: scrollPositionNew, behavior: 'smooth' });
    }
    // Always keep track of new position (even if smooth scrolling is not applied)
    setScrollLeft(scrollPositionNew);
  }
};

const LayoutWrapperSideTabComponent = props => {
  const providerNotificationCount = useSelector(state => state?.user?.currentUserNotificationCount);

  const [scrollLeft, setScrollLeft] = useGlobalState('scrollLeft');
  useEffect(() => {
    const { currentPage, viewport } = props;
    let scrollTimeout = null;

    const { width } = viewport;
    const hasViewport = width > 0;
    const hasHorizontalTabLayout = hasViewport && width <= MAX_HORIZONTAL_NAV_SCREEN_WIDTH;

    // Check if scrollToTab call is needed (tab is not visible on mobile)
    if (hasHorizontalTabLayout) {
      scrollTimeout = window.setTimeout(() => {
        scrollToTab(currentPage, scrollLeft, setScrollLeft);
      }, 300);
    }

    return () => {
      // Update scroll position when unmounting
      const el = document.querySelector(`#${currentPage}Tab`);
      setScrollLeft(el?.parentElement?.scrollLeft);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  });

  const dispatch = useDispatch();

  const {
    currentPage,
    profilePageTab,
    sideBarButtons,
    paymentSideNavIcon,
    payoutSideNavIcon,
    isAccountSettingTab,
  } = props;

  const tabs = [
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.accountSettings" />,
      selected: ACCOUNT_SETTINGS_PAGES.includes(currentPage) || currentPage === 'ProfileSettingsPage',
      id: 'ProfileSettingsPageTab',
      // selected: currentPage === 'ProfileSettingsPage',
      icon: <BrandIconCard type="setting" />,
      linkProps: {
        name: 'ProfileSettingsPage',
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.myListings" />,
      selected: ['ManageListingsPage', 'EditListingPage'].includes(currentPage),
      id: 'ManageListingsPageTab',
      icon: <BrandIconCard type="listing" />,
      linkProps: {
        name: 'ManageListingsPage',
        params: {
          tab: 'active',
        },
      },
    },
    // {
    //   text: <FormattedMessage id="LayoutWrapperSideTab.bundle" />,
    //   selected: currentPage === 'InboxPage',
    //   id: 'InboxPageTab',
    //   icon: <BrandIconCard type="bundle" />,
    //   linkProps: {
    //     name: 'InboxPage',
    //     params: {
    //       tab: 'sales',
    //     },
    //   },
    // },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.myPurchases" />,
      selected: currentPage === 'MyPurchasesPage',
      id: 'MyPurchasesTab',
      icon: <BrandIconCard type="purchase" />,
      linkProps: {
        name: 'MyPurchasesPage',
            params: {
          tab: 'viewPurchases',
        },
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.Favorites" />,
      // selected: currentPage === 'FavoritePage',
       selected: ['FavoritePage'].includes(currentPage),
      id: 'FavoritePage',
      icon:<BrandIconCard type='profilefavorite'/>,
      linkProps: {
        name: 'FavoritePage',
        params: {
          tab: 'active',
        },
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.payout" />,
      selected: ['StripePayoutPage','PaymentMethodsPage'].includes(currentPage)||currentPage === 'StripePayoutPage',
      id: 'StripePayoutPageTab',
      icon: <BrandIconCard type="payout" />,
      linkProps: {
        name: 'StripePayoutPage',
        // params: { slug: 'draft', type: 'new', tab: 'orders' },
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.cart" />,
      selected: currentPage === 'CartPage',
      id: 'CartPageTab',
      icon: <BrandIconCard type="addcart" />,
      linkProps: {
        name: 'CartPage',
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.inbox" />,
      selected: currentPage === 'InboxPage',
      id: 'NotificationPageTab',
      icon: <BrandIconCard type="inbox" />,
      linkProps: {
        name: 'InboxPage',
        params: {
          tab: 'sales',
        },
      },
    },
    {
      text: <FormattedMessage id="LayoutWrapperSideTab.help" />,
      selected: FAQ_PAGES.includes(currentPage) || currentPage === 'FAQPage',
      id: 'FAQTab',
      icon: <BrandIconCard type="help" />,
      linkProps: {
        name: 'FAQPage',
      },
    },

    {
      text: <FormattedMessage id="LayoutWrapperSideTab.logout" />,
      id: 'LogOut',
      icon: <BrandIconCard type="logOut" />,
        onClick: () => dispatch(logout()), // Call logout action

    },
  ];

  return (
    <>
      <TabNav
        rootClassName={css.tabs}
        sideBarButtons={sideBarButtons}
        tabs={tabs}
        profilePageTab={profilePageTab}
        paymentSideNavIcon={paymentSideNavIcon}
        payoutSideNavIcon={payoutSideNavIcon}
        isAccountSettingTab={isAccountSettingTab}
      />
      {/* <div>
        <Button onClick={() => dispatch(logout())}>
           <BrandIconCard type="logOut" />
          <FormattedMessage id="TopbarDesktop.logout" />
        </Button>
      </div> */}
    </>
  );
};

LayoutWrapperSideTabComponent.defaultProps = {
  className: null,
  rootClassName: null,
  children: null,
  currentPage: null,
};

LayoutWrapperSideTabComponent.propTypes = {
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

const LayoutWrapperSideTab = compose(withViewport)(LayoutWrapperSideTabComponent);

export default LayoutWrapperSideTab;
