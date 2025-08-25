/**
 * This is a wrapper component for different Layouts.
 * Navigational 'aside' content should be added to this wrapper.
 */
import React, { useEffect } from 'react';
import { node, number, string, shape } from 'prop-types';
import { compose } from 'redux';

import { FormattedMessage } from '../../../../util/reactIntl';
import { withViewport } from '../../../../util/uiHelpers';

import { TabNav } from '../../../../components';

import { createGlobalState } from '../hookGlobalState';

import css from './OutfitListingStateTab.module.css';

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

const OutfitListingStateTabComponent = props => {
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

  const { currentPage, tabType, profilePageTab } = props;
  const tabs = [
    {
      text: <FormattedMessage id="OutfitListingStateTab.active" />,
      selected: tabType === 'active',
      id: 'ManageListingsPageTab',
      linkProps: {
        name: 'ManageListingsPage',
        params: {
          tab: 'active',
        },
      },
    },
    {
      text: <FormattedMessage id="OutfitListingStateTab.closed" />,
      selected: tabType === 'closed',
      id: 'ManageListingsPageTab',
      linkProps: {
        name: 'ManageListingsPage',
        params: {
          tab: 'closed',
        },
      },
    },
    {
      text: <FormattedMessage id="OutfitListingStateTab.addItem" />,
      selected: tabType === 'addItem',
      id: 'EditListingPageTab',
      linkProps: {
        name: 'EditListingPage',
        params: {
          slug: 'draft',
          type: 'new',
          tab: 'details',
          id: '00000000-0000-0000-0000-000000000000',
          custom: 'manual',
        },
      },
    },
    {
      text: <FormattedMessage id="OutfitListingStateTab.draft" />,
      selected: tabType === 'draft',
      id: 'ManageListingsPageTab',
      linkProps: {
        name: 'ManageListingsPage',
        params: {
          tab: 'draft',
        },
      },
    },
    {
      text: <FormattedMessage id="OutfitListingStateTab.pendingReviews" />,
      selected: tabType === 'pendingReviews',
      id: 'ManageListingsPageTab',
      linkProps: {
        name: 'ManageListingsPage',
        params: {
          tab: 'pendingReviews',
        },
      },
    },
    // {
    //   text: <FormattedMessage id="OutfitListingStateTab.declined" />,
    //   selected: tabType === 'declined',
    //   id: 'ManageListingsPageTab',
    //   linkProps: {
    //     name: 'ManageListingsPage',
    //     params: {
    //       tab: 'declined',
    //     },
    //   },
    // },
    // {
    //   text: <FormattedMessage id="OutfitListingStateTab.bundle" />,
    //   selected: tabType === 'declined',
    //   id: 'ManageListingsPageTab',
    //   linkProps: {
    //     name: 'ManageListingsPage',
    //     params: {
    //       tab: 'bundle',
    //     },
    //   },
    // },
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

OutfitListingStateTabComponent.defaultProps = {
  className: null,
  rootClassName: null,
  children: null,
  currentPage: null,
};

OutfitListingStateTabComponent.propTypes = {
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

const OutfitListingStateTab = compose(withViewport)(OutfitListingStateTabComponent);

export default OutfitListingStateTab;
