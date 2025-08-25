import React, { useState, useEffect, useRef, useMemo } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import {
  Avatar,
  InlineTextButton,
  LinkedLogo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
  NotificationBadge,
} from '../../../../components';

import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';
import CustomLinksMenu from './CustomLinksMenu/CustomLinksMenu';

import css from './TopbarDesktop.module.css';
import logo from '../../../../assets/images/re-party.png';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';

const SignupLink = () => {
  return (
    <NamedLink name="SignupPage" className={css.topbarLink}>
      <span className={css.topbarLinkLabel}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );
};

const LoginLink = () => {
  return (
    <NamedLink name="LoginPage" className={css.topbarLink}>
      <span className={css.topbarLinkLabel}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );
};

const InboxLink = ({ notificationCount, currentUserHasListings }) => {
  const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;
  return (
    <NamedLink
      className={css.topbarLink}
      name="InboxPage"
      params={{ tab: currentUserHasListings ? 'sales' : 'orders' }}
    >
      <span className={css.topbarLinkLabel}>
        <FormattedMessage id="TopbarDesktop.inbox" />
        {notificationDot}
      </span>
    </NamedLink>
  );
};

/**
 * Topbar for desktop layout
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {boolean} props.currentUserHasListings
 * @param {CurrentUser} props.currentUser API entity
 * @param {string?} props.currentPage
 * @param {boolean} props.isAuthenticated
 * @param {number} props.notificationCount
 * @param {Function} props.onLogout
 * @param {Function} props.onSearchSubmit
 * @param {Object?} props.initialSearchFormValues
 * @param {Object} props.intl
 * @param {Object} props.config
 * @param {boolean} props.showSearchForm
 * @returns {JSX.Element} search icon
 */
const TopbarDesktop = props => {
  const {
    className,
    config,
    customLinks,
    currentUser,
    currentPage,
    rootClassName,
    currentUserHasListings,
    notificationCount = 0,
    intl,
    isAuthenticated,
    onLogout,
    onSearchSubmit,
    initialSearchFormValues = {},
    showSearchForm,
  } = props;
  
  
  const [mounted, setMounted] = useState(false);
  const hasProcessedCleanup = useRef(false);
  const { onUpdateProfile, listings } = props;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get favorite items from user's profile
  const { favoriteItems = [] } = currentUser?.attributes?.profile?.publicData || {};
  const favoriteItemIds = useMemo(() => 
    favoriteItems?.map(item => item.id).sort() || [],
    [favoriteItems]
  );

  // Clean up invalid favorites when component mounts
  useEffect(() => {
    if (!currentUser?.id || !favoriteItems?.length || hasProcessedCleanup.current) {
      return;
    }

    // Use listings from props
    if (!listings?.length) return;

    // Filter valid favorites (exists in listings and not deleted)
    const validFavorites = favoriteItems.filter(favItem => {
      const listing = listings.find(l => l.id.uuid === favItem.id);
      return listing && listing.attributes?.deleted !== true;
    });

    // Only update if there are invalid favorites to remove
    if (validFavorites.length !== favoriteItems.length) {
      hasProcessedCleanup.current = true;
      onUpdateProfile({
        publicData: {
          ...currentUser.attributes.profile.publicData,
          favoriteItems: validFavorites,
        },
      });
    } else {
      hasProcessedCleanup.current = true;
    }
  }, [currentUser, favoriteItems, onUpdateProfile, listings]);

  const { bookmarks } = currentUser?.attributes?.profile?.protectedData || {};
  const cartItemslength = bookmarks?.length;
  
  const marketplaceName = config.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;

  const giveSpaceForSearch = customLinks == null || customLinks?.length === 0;
  const classes = classNames(rootClassName || css.root, className);

  const inboxLinkMaybe = authenticatedOnClientSide ? (
    <InboxLink
      notificationCount={notificationCount}
      currentUserHasListings={currentUserHasListings}
    />
  ) : null;

  const profileMenuMaybe = authenticatedOnClientSide ? (
    <NamedLink name="ProfileSettingsPage">
      <Avatar className={css.avatar} user={currentUser} disableProfileLink />
    </NamedLink>
  ) : null;

  const signupLinkMaybe = isAuthenticatedOrJustHydrated ? null : <SignupLink />;
  const loginLinkMaybe = isAuthenticatedOrJustHydrated ? null : <LoginLink />;

  const searchFormMaybe = showSearchForm ? (
    <TopbarSearchForm
      className={classNames(css.searchLink, { [css.takeAvailableSpace]: giveSpaceForSearch })}
      desktopInputRoot={css.topbarSearchWithLeftPadding}
      onSubmit={onSearchSubmit}
      initialValues={initialSearchFormValues}
      appConfig={config}
    />
  ) : (
    <div
      className={classNames(css.spacer, css.topbarSearchWithLeftPadding, {
        [css.takeAvailableSpace]: giveSpaceForSearch,
      })}
    />
  );

  return (
    <nav className={classes}>
      {/* <LinkedLogo
        className={css.logoLink}
        layout="desktop"
        alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
        linkToExternalSite={config?.topbar?.logoLink}
      /> */}
      <NamedLink name="LandingPage" className={css.logo}>
        {/* <img src={logo} alt="logo" /> */}
        <BrandIconCard type="blacklogo" />
      </NamedLink>
      {currentPage == ("SearchPage" || "ContractorSearchPage") ? null : searchFormMaybe  }
      {isAuthenticated ? null : (
        <div className={css.centerMenuLinks}>
          <NamedLink name="OurStoryPage" className={css.centerMenuLink}>
            Our Story
          </NamedLink>
          <NamedLink name="ContractorSearchPage" to={{ search: '?productType=Rent' }} className={css.centerMenuLink}>
            Browse Rental
          </NamedLink>
          <NamedLink name="HowItWorkPage" className={css.centerMenuLink}>
            How It Works
          </NamedLink>
          <NamedLink name="NewListingPage" className={css.centerMenuLink}>
            Sell
          </NamedLink>
        </div>
      )}
      <div className={css.rightMenuLink}>    
        <span className={css.menuLinksPage}>
          <CustomLinksMenu
            currentPage={currentPage}
            customLinks={customLinks}
            intl={intl}
            hasClientSideContentReady={authenticatedOnClientSide || !isAuthenticatedOrJustHydrated}
          />
        </span>
        <span className={css.menuLinks}>
         <NamedLink className={css.topbarLink} name="ContractorSearchPage">
            <FormattedMessage id="TopbarDesktop.browseListing" />
        </NamedLink>
        </span>

        {inboxLinkMaybe ?<span className={css.menuLinks}>{inboxLinkMaybe}</span>:null}
        {isAuthenticated ? (
          <div className={css.extraIcons}>
            {/* <span className={css.rightIcons}>
              <NamedLink name="LandingPage" className={css.centerMenuLink}>
                <BrandIconCard type="notification" />
              </NamedLink>
            </span> */}
            <span className={css.rightIcons}>
              <NamedLink name="FavoritePage" className={css.centerMenuLink}>
                <BrandIconCard type="favicon" />
                {favoriteItems?.length > 0 ? (
                  <span className={css.favicon}>
                    <NotificationBadge count={favoriteItems?.length} />
                  </span>
                ) : null}
              </NamedLink>
            </span>
            {/* <span className={css.rightIcons}>
              <NamedLink name="MyPurchasesPage" className={css.centerMenuLink}>
                <BrandIconCard type="cart" />
              </NamedLink>
            </span> */}
            <span className={css.rightIcons}>
              <NamedLink name="CartPage" className={css.centerMenuLink}>
                {/* <BrandIconCard type="addcart" /> */}
                 <BrandIconCard type="cart" />
                 {cartItemslength > 0 ? (
                  <span className={css.favicon}> 
                    <NotificationBadge count={cartItemslength} />
                  </span>):null}
              </NamedLink>
            </span>
          </div>
        ) : null}

        {profileMenuMaybe}
        {signupLinkMaybe}
        {loginLinkMaybe}
      </div>
    </nav>
  );
};

export default TopbarDesktop;
