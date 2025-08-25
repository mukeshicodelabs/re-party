import React, { Component } from 'react';
import { array, arrayOf, func, object, shape, string } from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { useIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import { isOriginInUse } from '../../util/search';
import { createSlug } from '../../util/urlHelpers';
import { propTypes } from '../../util/types';
import { getListingsById, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';

import { Button, LayoutSideNavigation, Page } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import { setActiveListing } from '../../containers/SearchPage/SearchPage.duck';
import CartPanel from '../../components/CartPanel/CartPanel';
import css from './CartPage.module.css';
import { initializeCardPaymentData } from '../../ducks/stripe.duck';
import { fetchTransactionLineItems } from '../ListingPage/ListingPage.duck';
import { updateProfile } from '../ProfileSettingsPage/ProfileSettingsPage.duck';
import { types as sdkTypes } from '../../util/sdkLoader';
import { getValidAvailabilityDates, isDateAvailable } from '../../util/data';

const { UUID } = sdkTypes;

export class CartPageComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSearchMapOpenOnMobile: props.tab === 'map',
      isMobileModalOpen: false,
      isSecondaryFiltersOpen: false,
      bookmarks: props && props.bookmarks && props.bookmarks.length ? props.bookmarks : [],
      stockCount: 1,
      stockListing: null,
      stockDetails: [],
      buttonIndex: -1,
      resetState: false,
      sd: [],
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleWishlist = this.handleWishlist.bind(this);
    this.removeFromState = this.removeFromState.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.buttonIndex !== this.state.buttonIndex) {
      this.setState({ resetState: true });
    }
    const { isAuthenticated, getListing, currentUser } = this.props;
    const bookmarks = currentUser?.attributes?.profile?.protectedData?.bookmarks;

    if (
      isAuthenticated &&
      this.state.stockDetails &&
      this.state.stockDetails.length <= 0 &&
      currentUser &&
      currentUser.id
    ) {
      bookmarks &&
        bookmarks.map(item => {
          const listingId = new UUID(item.id);
          const listing = getListing(listingId);
        });
    } else if (this.state.stockDetails && this.state.stockDetails.length <= 0) {
      let localBookmarks =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('localBookmarks') &&
        window.localStorage.getItem('localBookmarks').length > 0
          ? window.localStorage.getItem('localBookmarks')
          : [];

      if (typeof localBookmarks === 'string') {
        localBookmarks =
          typeof window !== 'undefined' &&
          window.localStorage &&
          JSON.parse(window.localStorage.getItem('localBookmarks'));
      }

      localBookmarks &&
        localBookmarks.forEach(item => {
          const listingId = new UUID(item.id);
          const listing = getListing(listingId);
          if (listing) {
            return this.handleAdd({ ...listing, quantity: Number(item.quantity) });
          }
        });
    }
  }

  handleSubmit(cartListings, ind) {
    const {
      history,
      callSetInitialValues,
      onInitializeCardPaymentData,
      routeConfiguration,
      currentUser,
    } = this.props;

    const bookmarks = currentUser?.attributes?.profile?.protectedData?.bookmarks || [];

    if (!Array.isArray(cartListings) || cartListings.length === 0) {
      console.warn('Cart listings are empty or invalid');
      return;
    }

    const cartListingsIds = Array.isArray(cartListings)
      ? cartListings.map(item => item?.id?.uuid)
      : [];

    const vendorListing = cartListings && cartListings[0];
    const listing = vendorListing;

    const matchedBookmarks = bookmarks.filter(b => cartListingsIds.includes(b?.id));
    if (matchedBookmarks.length === 0) {
      console.warn('No bookmarks matched with cart listings');
      return;
    }

    const bookingDates = matchedBookmarks.map(attr => ({
      bookingStart: attr.startDate ? new Date(attr.startDate) : null,
      bookingEnd: attr.endDate ? new Date(attr.endDate) : null,
    }));

    const sd = matchedBookmarks.reduce((acc, bookmark) => {
      const {
        id,
        selectedDays,
        startDate,
        endDate,
        quantity,
        productType,
        shippoRate,
        shippoObjectId,
        deliveryMethod,
      } = bookmark;

      const matchedItem = cartListings.find(item => item?.id?.uuid === id);
      if (!matchedItem) {
        console.warn(`No matching listing found for bookmark id: ${id}`);
        return acc;
      }

      const { attributes = {}, images, currentStock } = matchedItem;

      const { title, price, description, publicData = {} } = attributes;

      const {
        listingCategory,
        otherEventType,
        size,
        overallFit,
        eventTypes,
        men_outfit,
        women_outfit,
        transactionProcessAlias,
        unitType,
      } = publicData;

      const productQuantity = currentStock?.attributes?.quantity;

      acc.push({
        listingId: matchedItem.id.uuid,
        productType,
        price,
        currency: price?.currency,
        title,
        selectedDays,
        bookingStartDate: startDate,
        bookingEndDate: endDate,
        images,
        ItemCategory: listingCategory,
        ItemSize: size,
        ItemOverallFit: overallFit,
        ItemEventType: eventTypes,
        ItemWomenOutfit: women_outfit,
        ItemMenOutfit: men_outfit,
        ItemDescription: description,
        ItemOtherEvent: otherEventType,
        oldStock: productQuantity,
        stockCount: parseInt(quantity, 10),
        shippoRate,
        shippoObjectId,
        deliveryMethod: deliveryMethod || null,
        transactionProcessAlias,
        unitType,
      });

      return acc;
    }, []);

    if (sd.length === 0) {
      console.warn('No valid checkout items (sd) were prepared.');
      return;
    }

    const globalProductType = sd[0]?.productType;
    const baseQuantity =
      globalProductType === 'rent'
        ? Number.parseInt(sd[0]?.selectedDays || 0, 10)
        : Number.parseInt(sd[0]?.stockCount || 0, 10);

    const initialValues = {
      listing: vendorListing,
      orderData: {
        bookingDates,
        quantity: baseQuantity,
        otherOrderData: {
          cartItems: sd,
        },
      },
      confirmPaymentError: null,
    };

    const saveToSessionStorage = !this.props.currentUser;
    const routes = routeConfiguration;
    const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);
    callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);
    onInitializeCardPaymentData();
    history.push(
      createResourceLocatorString(
        'CheckoutPage',
        routes,
        {
          id: listing?.id?.uuid,
          slug: createSlug(listing?.attributes?.title),
        },
        {}
      )
    );
  }

  removeFromState(id) {
    const index = this.state.stockDetails.findIndex(item => item.listingId == id);
    this.state.stockDetails && this.state.stockDetails.splice(index, 1);
  }

  handleWishlist(id, e) {
    const { onUpdateProfile, currentUser, isAuthenticated } = this.props;
    const bookmarks = currentUser?.attributes?.profile?.protectedData?.bookmarks;

    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated && e && id) {
      let localBookmarks =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('localBookmarks') &&
        window.localStorage.getItem('localBookmarks').length > 0
          ? window.localStorage.getItem('localBookmarks')
          : [];

      if (typeof localBookmarks === 'string') {
        localBookmarks =
          typeof window !== 'undefined' &&
          window.localStorage &&
          JSON.parse(window.localStorage.getItem('localBookmarks'));
      }

      const localIndex = localBookmarks && localBookmarks.findIndex(b => b.id == id);

      if (localIndex > -1) {
        let bookmarks = localBookmarks.filter(e => e.id != id);
        localBookmarks && localBookmarks.splice(localIndex, 1);
        const removedBookmarks = Array.from(new Set(bookmarks));
        typeof window !== 'undefined' &&
          window.localStorage.setItem('localBookmarks', JSON.stringify(removedBookmarks));
      } else {
        localBookmarks.push(id);
        const addedBookmarks = Array.from(new Set(localBookmarks));
        typeof window !== 'undefined' &&
          window.localStorage.setItem('localBookmarks', JSON.stringify(addedBookmarks));
      }
    }

    const index = bookmarks && bookmarks.findIndex(b => b.id == id);

    if (isAuthenticated) {
      typeof window !== 'undefined' && window.localStorage.removeItem('localBookmarks');
    }

    if (id) {
      if (index > -1) {
        bookmarks && bookmarks.splice(index, 1);
        const removedBookmarks = Array.from(new Set(bookmarks));
        const profile = {
          protectedData: {
            bookmarks: removedBookmarks,
          },
        };
        onUpdateProfile(profile);
      } else {
        bookmarks && bookmarks.push(id);
        const addedBookmarks = Array.from(new Set(this.state.bookmarks));
        const profile = {
          protectedData: {
            bookmarks: addedBookmarks,
          },
        };
        onUpdateProfile(profile);
      }
    }
  }

  render() {
    const {
      listings,
      scrollingDisabled,
      config,
      currentUser,
      isAuthenticated,
      pagination,
      queryInProgress,
      queryParams,
      bookmarks,
      checkAvailabilty,
    } = this.props;

    const modifyListing = listings?.map((listing, index) => {
      const bookmarks = currentUser?.attributes?.profile?.protectedData?.bookmarks;
      if (bookmarks && bookmarks.length > 0) {
        const bookmarkIndex = index % bookmarks.length;
        const bookmark = bookmarks[bookmarkIndex];
        return {
          ...listing,
          startDate: bookmark.startDate,
          endDate: bookmark.endDate,
          productType: bookmark.productType,
          purchaseQuantity: bookmark.quantity,
          selectedPrice: bookmark.selectedPrice,
          selectedSetUpFee: bookmark.selectedSetUpFee,
        };
      } else {
        return listing;
      }
    });

    const topbarClasses = this.state.isMobileModalOpen
      ? classNames(css.topbarBehindModal, css.topbar)
      : css.topbar;

    const cardRenderSizes = isMapVariant => {
      if (isMapVariant) {
        const panelMediumWidth = 50;
        const panelLargeWidth = 62.5;
        return [
          '(max-width: 767px) 100vw',
          `(max-width: 1023px) ${panelMediumWidth}vw`,
          `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
          `${panelLargeWidth / 3}vw`,
        ].join(', ');
      } else {
        const panelMediumWidth = 50;
        const panelLargeWidth = 62.5;
        return [
          '(max-width: 549px) 100vw',
          '(max-width: 767px) 50vw',
          `(max-width: 1439px) 26vw`,
          `(max-width: 1920px) 18vw`,
          `14vw`,
        ].join(', ');
      }
    };

    const arrKeys = modifyListing &&
      modifyListing.length && [...new Set(modifyListing.map(st => st.author.id.uuid))];
    const combinedListings =
      arrKeys &&
      arrKeys.length &&
      arrKeys.map(item =>
        modifyListing.reduce(
          (acc, curr) => (curr.author?.id?.uuid == item ? [...acc, curr] : [...acc]),
          []
        )
      );

    const getTotalPrice = (cl, currentUser) => {
      const clUuids = cl.map(listing => listing.id.uuid);
      const matchedListingsArr = cl?.filter(listing => clUuids.includes(listing.id.uuid));
      const matchedListings = matchedListingsArr?.filter(item => item);

      const linePrices = matchedListings?.map((item, index) => {
        const { productType, startDate, endDate, purchaseQuantity } = item;

        if (productType === 'rent' && startDate && endDate) {
          const price = item?.attributes ? item.attributes?.price?.amount / 100 : 0;
          const setupFee = item?.selectedSetUpFee ? item.selectedSetUpFee / 100 : 0;
          const start = new Date(startDate);
          const end = new Date(endDate);
          const daysDifference = (end - start) / (1000 * 60 * 60 * 24); // Convert ms to days
          return price * daysDifference + setupFee;
        }
        if (productType === 'sell') {
          const salePrice = item?.attributes?.price?.amount
            ? item.attributes.price.amount / 100
            : 0;
          const quantity = purchaseQuantity ? Number(purchaseQuantity) : 0;
          return salePrice * quantity;
        }

        return 0;
      });

      const sum = linePrices.reduce((partialSum, price) => partialSum + price, 0);
      return sum.toFixed(2);
    };
    const lb =
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem('localBookmarks') === 'string' &&
      JSON.parse(window.localStorage.getItem('localBookmarks'));

    const localBookmarks =
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem('localBookmarks') === 'string' &&
      JSON.parse(window.localStorage.getItem('localBookmarks')).map(e => e.id);

    const flatListings = [].concat(...(combinedListings || []));

    const forSaleListings = flatListings.filter(
      item => (item?.productType || item?.attributes?.publicData?.productType) === 'sell'
    );

    const forRentListings = flatListings.filter(
      item => (item?.productType || item?.attributes?.publicData?.productType) === 'rent'
    ); 
    return (
      <Page scrollingDisabled={scrollingDisabled}>
        <LayoutSideNavigation
          className={css.LayoutSideNavigation}
          sideNavClassName={css.navigation}
          topbar={
            <>
              <TopbarContainer className={topbarClasses} currentPage="CartPage" />
            </>
          }
          footer={<FooterContainer />}
          profilePageTab={true}
          sideBarButtons
          isAccountSettingTab={true}
          currentPage="CartPage"
        >
          <div className={css.listingCards}>
            {(isAuthenticated && bookmarks && bookmarks?.length > 0) ||
            (!isAuthenticated && lb && lb?.length > 0) ? (
              <>
                {/* ----- FOR-RENT LISTINGS (GROUPED TOGETHER) ----- */}
                {forRentListings.length > 0 && (
                  <div className={css.vendor} key="rent-all">
                    <div className={css.cardHeader}>
                      <div className={css.AutorImgWrapper}>
                        <FormattedMessage id='CartPage.rentalListingsheading'/>
                        </div>
                      <div className={css.checkoutButton}>
                        <p className={css.priceWrapper}>
                          Total: <span>${getTotalPrice(forRentListings, currentUser)}</span>
                        </p>
                        <Button
                          onClick={() => this.handleSubmit(forRentListings, 'rent-all')}
                          // disabled={
                          //   !forRentListings.every(listing => {
                          //     const endDate = listing?.endDate;
                          //     const availabilityDates = getValidAvailabilityDates(checkAvailabilty);
                          //     return endDate && isDateAvailable(endDate, availabilityDates);
                          //   })
                          // }
                          disabled={true}
                        >
                          <FormattedMessage id='CartPage.CheckoutListingsheading'/>
                        </Button>
                      </div>
                    </div>

                    <div className={css.venderCards}>
                      {forRentListings.map((listing, i) => (
                        <CartPanel
                          className={css.listingCard}
                          key={`rent-${listing.id.uuid}`}
                          listing={listing}
                          renderSizes={cardRenderSizes(false)}
                          setActiveListing={() => {}}
                          handleWishlist={this.handleWishlist}
                          bookmarks={!isAuthenticated ? localBookmarks : bookmarks}
                          handleRemoveFromState={this.removeFromState}
                          currentUser={currentUser}
                          checkAvailabilty={checkAvailabilty}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ----- FOR-SALE LISTINGS (GROUPED TOGETHER) ----- */}
                {forSaleListings.length > 0 && (
                  <div className={css.vendor} key="sell-all">
                    <div className={css.cardHeader}>
                      <div className={css.AutorImgWrapper}>
                      <FormattedMessage id='CartPage.CheckoutSaleListingsheading'/>
                        </div>
                      <div className={css.checkoutButton}>
                        <p className={css.priceWrapper}>
                          Total: <span>${getTotalPrice(forSaleListings, currentUser)}</span>
                        </p>
                        <Button
                          onClick={() => this.handleSubmit(forSaleListings, 'sell-all')}
                          // disabled={
                          //   !forSaleListings.some(
                          //     item => item?.currentStock?.attributes?.quantity > 0
                          //   )
                          // }
                          disabled={true}
                        >
                           <FormattedMessage id='CartPage.CheckoutAllSaleListingsheading'/>  
                        </Button>
                      </div>
                    </div>

                    <div className={css.venderCards}>
                      {forSaleListings.map((listing, i) => (
                        <CartPanel
                          className={css.listingCard}
                          key={`sell-${listing.id.uuid}`}
                          listing={listing}
                          renderSizes={cardRenderSizes(false)}
                          setActiveListing={() => {}}
                          handleWishlist={this.handleWishlist}
                          bookmarks={!isAuthenticated ? localBookmarks : bookmarks}
                          handleRemoveFromState={this.removeFromState}
                          currentUser={currentUser}
                          checkAvailabilty={checkAvailabilty}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className={css.favoriteInfo}>
                {/* Still have an empty cart? Browse our <a href="/s">collection</a> to request an
                outfit for your next event! */}
                  <FormattedMessage
                    id="CartPage.EmptyCartMessage"
                    values={{
                      link: (chunks) => <a href="/s">{chunks}</a>,
                    }}
                  />
              </p>
            )}
          </div>
        </LayoutSideNavigation>
      </Page>
    );
  }
}

CartPageComponent.defaultProps = {
  listings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
  tab: 'listings',
  activeListingId: null,
};

CartPageComponent.propTypes = {
  listings: array,
  history: shape({
    push: func.isRequired,
  }).isRequired,
  location: shape({
    search: string.isRequired,
  }).isRequired,
  intl: intlShape.isRequired,
  config: object.isRequired,
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

const EnhancedSearchPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  return (
    <CartPageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      history={history}
      location={location}
      {...props}
    />
  );
};

const mapStateToProps = state => {
  const {
    showListingError,
    reviews,
    fetchReviewsError,
    timeSlots,
    fetchTimeSlotsError,
    sendEnquiryInProgress,
    sendEnquiryError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    enquiryModalOpenForListingId,
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    checkAvailabilty,
  } = state.CartPage;
  const { currentUser } = state.user;
  const { isAuthenticated } = state.auth;

  const getListing = id => {
    const ref = { id, type: 'listing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const getOwnListing = id => {
    const ref = { id, type: 'ownListing' };
    const listings = getMarketplaceEntities(state, [ref]);
    return listings.length === 1 ? listings[0] : null;
  };

  const bookmarks =
    currentUser &&
    currentUser?.attributes &&
    currentUser?.attributes?.profile &&
    currentUser?.attributes?.profile?.protectedData &&
    currentUser?.attributes?.profile?.protectedData?.bookmarks?.map(e => e.id);

  const result = bookmarks?.map(id => {
    return currentPageResultIds?.find(item => item?.uuid === id);
  });

  const ownBookmarks = result;

  const localBookmarks =
    typeof window !== 'undefined' &&
    typeof window.localStorage.getItem('localBookmarks') === 'string' &&
    JSON.parse(window.localStorage.getItem('localBookmarks')).map(e => e.id);

  const ownLocalBookmarks =
    localBookmarks && currentPageResultIds
      ? currentPageResultIds.filter(item => localBookmarks.indexOf(item.uuid) !== -1)
      : [];
  const listings = ownBookmarks
    ? getListingsById(state, ownLocalBookmarks.length > 0 ? ownLocalBookmarks : ownBookmarks)
    : null;

  const featuredListings = currentPageResultIds
    ? getListingsById(state, currentPageResultIds)
    : null;

  const filteredFl = featuredListings.filter(
    item =>
      item.attributes &&
      item.attributes.title &&
      item.attributes.title.includes('Vendor Listing') !== true
  );

  return {
    isAuthenticated,
    currentUser,
    getListing,
    getOwnListing,
    scrollingDisabled: isScrollingDisabled(state),
    enquiryModalOpenForListingId,
    showListingError,
    reviews,
    fetchReviewsError,
    timeSlots,
    fetchTimeSlotsError,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    sendEnquiryInProgress,
    sendEnquiryError,
    bookmarks,
    currentUser,
    currentPageResultIds,
    featuredListings: filteredFl,
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
    checkAvailabilty,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onActivateListing: listingId => dispatch(setActiveListing(listingId)),
  onInitializeCardPaymentData: () => dispatch(initializeCardPaymentData()),
  callSetInitialValues: (setInitialValues, values, saveToSessionStorage) =>
    dispatch(setInitialValues(values, saveToSessionStorage)),
  onSendEnquiry: (listingId, message) => dispatch(sendEnquiry(listingId, message)),
  onFetchTransactionLineItems: params => dispatch(fetchTransactionLineItems(params)),
  onUpdateProfile: data => dispatch(updateProfile(data)),
});

const CartPage = compose(connect(mapStateToProps, mapDispatchToProps))(EnhancedSearchPage);

CartPage.loadData = (params, search) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;
  return searchListings({
    ...queryParams,
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['author', 'images'],
    'fields.listing': ['title', 'geolocation', 'price', 'publicData', 'createdAt'],
    'fields.user': ['profile', 'profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.landscape-crop', 'variants.landscape-crop2x'],
    'limit.images': 1,
  });
};

export default CartPage;
