/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';

import {
  AvatarLarge,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
} from '../../../../components';

import css from './TopbarMobileMenu.module.css';
import mobileLogo from '../../../../assets/images/re-party.png';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';

const CustomLinkComponent = ({ linkConfig, currentPage }) => {
  const { group, text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;

    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  // Note: if the config contains 'route' keyword,
  // then in-app linking config has been resolved already.
  if (type === 'internal' && route) {
    // Internal link
    const { name, params, to } = route || {};
    const className = classNames(css.navigationLink, getCurrentPageClass(name));
    return (
      <NamedLink name={name} params={params} to={to} className={className}>
        <span className={css.menuItemBorder} />
        {text}
      </NamedLink>
    );
  }
  return (
    <ExternalLink href={href} className={css.navigationLink}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

/**
 * Menu for mobile layout (opens through hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated
 * @param {string?} props.currentPage
 * @param {boolean} props.currentUserHasListings
 * @param {Object?} props.currentUser API entity
 * @param {number} props.notificationCount
 * @param {Array<Object>} props.customLinks Contains object like { group, text, type, href, route }
 * @param {Function} props.onLogout
 * @returns {JSX.Element} search icon
 */
const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    currentUserHasListings,
    currentUser,
    notificationCount = 0,
    customLinks,
    onLogout,
  } = props;

  const user = ensureCurrentUser(currentUser);

  const extraLinks = customLinks.map((linkConfig, index) => {
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  });

  if (!isAuthenticated) {
    const signup = (
      <NamedLink name="SignupPage" className={css.signupLink}>
        <FormattedMessage id="TopbarMobileMenu.signupLink" />
      </NamedLink>
    );

    const login = (
      <NamedLink name="LoginPage" className={css.loginLink}>
        <FormattedMessage id="TopbarMobileMenu.loginLink" />
      </NamedLink>
    );

    const signupOrLogin = (
      <span className={css.authenticationLinks}>
        <FormattedMessage id="TopbarMobileMenu.signupOrLogin" values={{ signup, login }} />
      </span>
    );
    return (
      <div className={css.root}>
        <div className={css.content}>
          <div className={css.mobileMenuLogo}>
            <img src={mobileLogo} />
          </div>
          <div className={css.mobileMenuLinks}>
            <NamedLink name="NewListingPage" className={css.menuLink}>
              Sell
            </NamedLink>
            <NamedLink name="OurStoryPage" className={css.menuLink}>
              Our Story
            </NamedLink>
            <NamedLink name="HowItWorkPage" className={css.menuLink}>
              How It Works
            </NamedLink>
            <NamedLink name="LoginPage" className={css.menuLink}>
              Browse Rental
            </NamedLink>
            <a className={css.navigationLink} href="/l/new">
              <FormattedMessage id="TopbarDesktop.createNew" />
            </a>
          </div>

          {/* <div className={css.authenticationGreeting}>
            <FormattedMessage
              id="TopbarMobileMenu.unauthorizedGreeting"
              values={{ lineBreak: <br />, signupOrLogin }}
            />
          </div> */}
          <div className={css.mobileAuthButtons}>
            <div className={css.authLink}>{login}</div>
            <div className={css.authLink}>{signup}</div>
          </div>
          <div className={css.customLinksWrapper}>{extraLinks}</div>

          <div className={css.spacer} />
        </div>
        {/* <div className={css.footer}>
          <NamedLink className={css.createNewListingLink} name="NewListingPage">
            <FormattedMessage id="TopbarMobileMenu.newListingLink" />
          </NamedLink>
        </div> */}
      </div>
    );
  }

  const notificationCountBadge =
    notificationCount > 0 ? (
      <NotificationBadge className={css.notificationBadge} count={notificationCount} />
    ) : null;

  const displayName = user?.attributes?.profile?.firstName;
  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = currentPage?.indexOf('InboxPage') === 0 && page?.indexOf('InboxPage') === 0;
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };
  const inboxTab = currentUserHasListings ? 'sales' : 'orders';

  return (
    <div className={css.root}>
      <div>
        <img src={mobileLogo} />
      </div>
      <div className={css.topbarCardProfile}>
        <div>
          <div className={css.displayName}>
            <FormattedMessage id="TopbarMobileMenu.greeting" values={{ displayName }} />
          </div>
          <div className={css.profileEmail}>
            {currentUser?.attributes?.email}
          </div>
        </div>
        <AvatarLarge className={css.avatar} user={currentUser} />
      </div>
      <div className={css.content}>
        <div className={css.accountLinksWrapper}>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass(`InboxPage:${inboxTab}`))}
            name="InboxPage"
            params={{ tab: inboxTab }}
          >
            <BrandIconCard type="inbox" />
            <FormattedMessage id="TopbarMobileMenu.inboxLink" />
            {notificationCountBadge}
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('ManageListingsPage'))}
            name="ManageListingsPage"
            params={{ tab: 'active' }}
          >
            <BrandIconCard type="listing" />
            <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
          </NamedLink>
          <NamedLink className={classNames(css.navigationLink, currentPageClass('ContractorSearchPage'))} name="ContractorSearchPage">
            <BrandIconCard type="browseListing" />
            <FormattedMessage id="TopbarDesktop.browseListing" />
          </NamedLink>
          <a className={classNames(css.navigationLink, currentPageClass('ContractorSearchPage'))} href="/l/new">
            <BrandIconCard type="createlisting" />
            <FormattedMessage id="TopbarDesktop.createNew" />
          </a>
          {/* <NamedLink
            className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
          </NamedLink> */}
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <BrandIconCard type="setting" />
            <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
          </NamedLink>
        </div>
        {extraLinks ? <div className={css.customLinksWrapper}>{extraLinks}</div> : null}
        <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
          <BrandIconCard type="logOut" />
          <FormattedMessage id="TopbarMobileMenu.logoutLink" />
        </InlineTextButton>
      </div>
      {/* <div className={css.footer}>
        <NamedLink className={css.createNewListingLink} name="WelcomeListingPage">
          <FormattedMessage id="TopbarMobileMenu.newListingLink" />
        </NamedLink>
      </div> */}
      {/* <div className={css.spacer} /> */}
    </div>
  );
};

export default TopbarMobileMenu;
