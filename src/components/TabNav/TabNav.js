import React from 'react';
import classNames from 'classnames';
import { NamedLink } from '../../components';

import css from './TabNav.module.css';

const Tab = props => {
  const {
    className,
    id,
    disabled,
    text,
    selected,
    linkProps,
    isEditListingTab,
    isAccountSettingTab,
    listingTab,
    profilePageTab,
    icon,
    onClick
  } = props;

  const linkClasses = classNames(css.link, {
    [css.selectedLink]: selected,
    [css.disabled]: disabled,
  });

  const listingClasses = classNames(css.listingLink, {
    [css.selectedListingLink]: selected,
    [css.disabled]: disabled,
  });

  const accSettingClasses = classNames(css.settingLink, {
    [css.selectedSettingLink]: selected,
    [css.disabled]: disabled,
  });
  const listingTabClasses = classNames(css.listingTabLink, {
    [css.selectedListingTabLink]: selected,
    [css.disabled]: disabled,
  });

  const computedClassName =
    isEditListingTab
      ? listingClasses
      : isAccountSettingTab
        ? accSettingClasses
        : profilePageTab
          ? listingTabClasses
          : linkClasses;

  return (
    <div id={id} className={className}>
      {onClick ? (
        <a
          className={
            isEditListingTab
              ? listingClasses
              : isAccountSettingTab
                ? accSettingClasses
                : profilePageTab
                  ? listingTabClasses
                  : linkClasses
          }
          onClick={onClick}
        >
          {icon}
          {text}
        </a>
      ) :
        <NamedLink
          className={
            isEditListingTab
              ? listingClasses
              : isAccountSettingTab
                ? accSettingClasses
                : profilePageTab
                  ? listingTabClasses
                  : linkClasses
          }
          {...linkProps}
        >
          {icon}
          {text}
        </NamedLink>
      }
    </div>
  );
};

/**
 * @typedef {Object} TabConfig
 * @property {string} text - The text to be rendered in the tab
 * @property {boolean} disabled - Whether the tab is disabled
 * @property {boolean} selected - Whether the tab is selected
 * @property {Object} linkProps - The props to be passed to the link component
 * @property {string} linkProps.name - The name of the link
 * @property {string} linkProps.params - The path params to be passed to the link component
 * @property {string} linkProps.to - The rest of the URL params neede
 */

/**
 * A component that renders a tab navigation.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.tabRootClassName] - Custom class that overrides the default class for the tab element
 * @param {Array<TabConfig>} props.tabs - The tabs to render
 * @returns {JSX.Element}
 */
const TabNav = props => {
  const {
    className,
    rootClassName,
    tabRootClassName,
    tabs,
    sideBarButtons,
    profilePageTab,
    paymentSideNavIcon,
    isEditListingTab,
    isAccountSettingTab,
    payoutSideNavIcon,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const tabClasses = tabRootClassName || css.tab;
  return (
    <nav className={classes}>
      {tabs.map((tab, index) => {
        const id = typeof tab.id === 'string' ? tab.id : `${index}`;
        return (
          <Tab
            key={id}
            id={id}
            className={tabClasses}
            {...tab}
            sideBarButtons={sideBarButtons}
            profilePageTab={profilePageTab}
            paymentSideNavIcon={paymentSideNavIcon}
            isEditListingTab={isEditListingTab}
            isAccountSettingTab={isAccountSettingTab}
            payoutSideNavIcon={payoutSideNavIcon}
          />
        );
      })}
    </nav>
  );
};

export default TabNav;
