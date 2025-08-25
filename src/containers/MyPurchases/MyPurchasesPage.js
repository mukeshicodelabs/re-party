import React from 'react';
import { compose } from 'redux';
import { connect, useSelector } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, intlShape, useIntl } from '../../util/reactIntl';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import {
  H2,
  Avatar,
  NamedLink,
  NotificationBadge,
  Page,
  PaginationLinks,
  TabNav,
  IconSpinner,
  TimeRange,
  UserDisplayName,
  LayoutSideNavigation,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import { types as sdkTypes } from '../../util/sdkLoader';
import css from './MyPurchasesPage.module.css';
import { ensureUser } from '../../util/data';
import { createSlug } from '../../util/urlHelpers';
import { updateProfile } from '../ProfileSettingsPage/ProfileSettingsPage.duck';
import IconCard from '../../components/SavedCardDetails/IconCard/IconCard';
import { formatMoney } from '../../util/currency';

const { Money } = sdkTypes;
const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const PurchaseCards = (props) => {
  const { listing, currentUser, onUpdateProfile, config , intl} = props;

  const { title, publicData, price, deleted } = listing?.attributes || {};
   const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);
  const slug = createSlug(title || '');
  const { productType } = publicData || {}
  const id = listing.id.uuid;
  const author = ensureUser(listing?.author);
  const authorName = author?.attributes?.profile?.displayName;
  const productLabel = productType == 'rent' ? 'For Rent' : 'For Sale';

  const listingImageUrl = listing?.images?.[0]?.attributes?.variants['listing-card']?.url;
  const listingAmount = price?.amount / 100;
  const { favoriteItems } = currentUser?.attributes?.profile?.publicData || [];
  const auth = useSelector(state => state.auth.isAuthenticated);
  const handleFavoriteItems = () => {
    const existingFavorites = (
      currentUser?.attributes?.profile?.publicData?.favoriteItems || []
    ).map(f => ({ ...f }));

    const index = existingFavorites.findIndex(b => b.id === id);

    let updatedFavorites;
    if (index > -1) {
      // Remove this listing from favorites
      updatedFavorites = existingFavorites.filter(item => item.id !== id);
    } else {
      // Add this listing to favorites
      updatedFavorites = [...existingFavorites, { id }];
    }

    const profile = {
      publicData: {
        favoriteItems: updatedFavorites,
      },
    };

    onUpdateProfile(profile);
  };
  const unavailableMessage = 'This item has been removed';
  const displayTitle = deleted ? unavailableMessage : title;
  
  // Create the image content - either the listing image or a message overlay
  const imageContent = (
    <div className={css.avatarWrapper}>
      {deleted ? (
        <div className={css.unavailableOverlay}>
          <p>{unavailableMessage}</p>
        </div>
      ) : (
        <img src={listingImageUrl} alt={displayTitle} />
      )}
    </div>
  );

  return (
    <div className={classNames(css.orderCard, { [css.deleted]: deleted })}>
      <div className={css.avatarSection}>
        {!deleted && (
          <div className={css.icon}>
            <div
              type="button"
              className={classNames(
                favoriteItems &&
                  Array.isArray(favoriteItems) &&
                  favoriteItems?.findIndex(e => e.id == id) > -1
                  ? null
                  : css.bookmark
              )}
              onClick={e => {
                !auth ? history.push('/login') : handleFavoriteItems();
              }}
            >
              {favoriteItems &&
                Array.isArray(favoriteItems) &&
                favoriteItems?.findIndex(e => e.id === id) > -1 ? (
                <div className={css.isFavorite}>
                  <IconCard brand="favorite" />
                </div>
              ) : (
                <IconCard brand="favorite" />
              )}
            </div>
          </div>
        )}
        
        {deleted ? (
          imageContent
        ) : (
          <NamedLink name="ListingPage" params={{ id: listing?.id?.uuid, slug }}>
            {imageContent}
          </NamedLink>
        )}
      </div>

      <div className={css.info}>
        {!deleted && <div className={css.productType}>{productLabel}</div>}
        <p className={css.title}>{displayTitle}</p>
        {!deleted && (
          <div className={css.priceValue}>
            {priceTitle}
            <div className={css.avatarNname}>
              <Avatar className={css.avatar} user={author} />
              <span>{authorName}</span>
            </div>
          </div>
        )}
      </div>
    </div>

  )
}
export const MyPurchasesPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    currentUser,
    params,
    scrollingDisabled,
    transactions,
    pagination,
    fetchInProgress,
    onUpdateProfile
  } = props;
  const { tab } = params;
  // const isOrders = tab === 'orders';
  const title = "My Orders";

  // const tabs = [
  //   {
  //     text: (
  //       <span>
  //         <FormattedMessage id="InboxPage.ordersTabTitle" />
  //       </span>
  //     ),
  //     // selected: true,
  //     linkProps: {
  //       name: 'InboxPage',
  //       params: { tab: 'orders' },
  //     },
  //   },

  // ];

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        sideNavClassName={css.navigation}
        topbar={
          <TopbarContainer
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
          />
        }
        // sideNav={
        //   <>
        //     <H2 as="h1" className={css.title}>
        //       <FormattedMessage id="InboxPage.title" />
        //     </H2>
        //     {/* <TabNav rootClassName={css.tabs} tabRootClassName={css.tab} tabs={tabs} />{' '} */}
        //   </>
        // }
        footer={<FooterContainer />}
        tabType={tab}
        // inboxPageTab={true}
        currentPage="MyPurchasesPage"
        isAccountSettingTab={true}
      >
        <div className={css.orderWrapper}>
          <div className={css.listingCards}>
            {!fetchInProgress ? (
              transactions && transactions?.length > 0 && currentUser &&
              transactions?.map(transaction => (
                <PurchaseCards
                  key={transaction.id.uuid || transaction.id}
                  listing={transaction.listing}
                  className={css.mypurchases}
                  currentUser={currentUser}
                  onUpdateProfile={onUpdateProfile}
                  config={config}
                  intl={intl}
                />
              ))
            ) : (
              <IconSpinner />
            )}
            {!fetchInProgress  && transactions?.length == 0 ? (
              <div className={css.noOrders}>
                <FormattedMessage id="MyPurchasesPage.noOrders" />
              </div>
            ) : null}
          </div>
        </div>

        {!fetchInProgress && pagination && pagination.totalPages > 1 ? (
          <PaginationLinks
            className={css.pagination}
            pageName="MyPurchasesPage"
            pagePathParams={params}
            pagination={pagination}
          />
        ) : null}
      </LayoutSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  const { fetchInProgress, fetchOrdersOrSalesError, pagination, transactionRefs } = state.MyPurchasesPage;
  const { currentUser, currentUserNotificationCount: providerNotificationCount } = state.user;
  return {
    currentUser,
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    providerNotificationCount,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
  };
};
const mapDispatchToProps = dispatch => ({
  onUpdateProfile: data => dispatch(updateProfile(data)),
});
const MyPurchasesPage = compose(connect(mapStateToProps, mapDispatchToProps))(MyPurchasesPageComponent);

export default MyPurchasesPage;


