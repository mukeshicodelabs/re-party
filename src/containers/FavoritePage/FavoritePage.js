import React, { useState, useEffect, useMemo, useRef } from 'react';
import { array, arrayOf, func, object, shape, string } from 'prop-types';

import { compose } from 'redux';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { useIntl, intlShape, FormattedMessage } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { isOriginInUse } from '../../util/search';
import { propTypes } from '../../util/types';
import { getListingsById, getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';

import { IconArrowHead, LayoutSideNavigation, Page, PaginationLinks } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { setActiveListing } from '../SearchPage/SearchPage.duck';

import css from './FavoritePage.module.css';
import { updateProfile } from '../ProfileSettingsPage/ProfileSettingsPage.duck';
import { types as sdkTypes } from '../../util/sdkLoader';
import { connect } from 'react-redux';
import FavoritePanel from '../../components/FavoritePanel/FavoritePanel';

const { UUID, Money } = sdkTypes;

// helper: build page numbers with ellipsis
const getPageNumbersArray = (page, totalPages) => {
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  return numbers
    .filter(v => v === 1 || Math.abs(v - page) <= 1 || v === totalPages)
    .reduce((arr, p) => {
      const last = arr[arr.length - 1];
      return last && p - last > 1 ? arr.concat(["…", p]) : arr.concat([p]);
    }, []);
};

const FavoritePagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className={css.pagination}>
      {/* Prev */}
      <button
        className={css.prev}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <IconArrowHead
          direction="left"
          size="big"
          rootClassName={classNames(css.arrowIcon, css.disabled)}
        />
      </button>

      {/* Page Numbers */}
      <div className={css.pageNumberList}>
        {getPageNumbersArray(currentPage, totalPages).map((v, i) =>
          typeof v === "number" ? (
            <button
              key={v}
              className={classNames(css.toPageLink, {
                [css.currentPage]: v === currentPage,
              })}
              // onClick={() => onPageChange(v)}
              onClick={() => onPageChange(v)}
            >
              {v}
            </button>
          ) : (
            <span key={`gap_${i}`} className={css.paginationGap}>
              {v}
            </span>
          )
        )}
      </div>

      {/* Next */}
      <button
        className={css.next}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <IconArrowHead
          direction="right"
          size="big"
          rootClassName={classNames(css.arrowIcon, css.disabled)}
        />
      </button>
    </div>
  );
};
const FavoritePageComponent = (props) => {
  const [state, setState] = useState({
    isSearchMapOpenMobile: props.tab === 'map',
    isMobileModalOpen: false,
    isSecondaryFiltersOpen: false,
    bookmarks: props.bookmarks?.length ? props.bookmarks : [],
    stockCount: 1,
    stockListing: null,
    stockDetails: [],
    buttonIndex: -1,
    resetState: false,
    sd: [],
  });

  const {
    intl,
    listings,
    location,
    scrollingDisabled,
    searchParams,
    routeConfiguration,
    config,
    currentUser,
    pagination,
    queryInProgress,
    queryParams,
    onUpdateProfile,
  } = props;

  const { favoriteItems = [] } = currentUser?.attributes?.profile?.publicData || {};
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 16; // number of favorites per page (adjust as needed)
  // Track if we've already processed the cleanup
  const hasProcessedCleanup = useRef(false);

  // Memoize the filtered listings to prevent unnecessary recalculations
  const filteredListings = useMemo(() => {
    if (!listings?.length) return [];
    return listings.filter(item => {
      const isFavorite = favoriteItems?.some(favItem => favItem.id === item.id.uuid);
      const isDeleted = item.attributes?.deleted === true;
      return isFavorite && !isDeleted;
    });
  }, [listings, favoriteItems]);
  // pagination logic
  const totalPages = Math.ceil(filteredListings.length / perPage);
  // Adjust current page if listings change (e.g., when deleting favorites)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  // Create a stable reference to favorite item IDs
  const favoriteItemIds = useMemo(() =>
    favoriteItems?.map(item => item.id).sort() || [],
    [favoriteItems]
  );

  // Create a stable reference to valid favorite IDs
  const validFavoriteIds = useMemo(() =>
    filteredListings.map(item => item.id.uuid).sort(),
    [filteredListings]
  );

  // Handle cleanup of invalid favorites
  useEffect(() => {
    // Skip if we've already processed cleanup or don't have required data
    if (
      hasProcessedCleanup.current ||
      !currentUser?.id ||
      !favoriteItems?.length ||
      queryInProgress ||
      !validFavoriteIds.length
    ) {
      return;
    }

    const invalidFavorites = favoriteItems.filter(
      favItem => !validFavoriteIds.includes(favItem.id)
    );

    // If we have invalid favorites, update the user's profile to remove them
    if (invalidFavorites.length > 0) {
      const updatedFavorites = favoriteItems.filter(favItem =>
        validFavoriteIds.includes(favItem.id)
      );

      // Mark that we've processed the cleanup to prevent re-runs
      hasProcessedCleanup.current = true;

      // Only update if there's a change needed
      if (updatedFavorites.length !== favoriteItems.length) {
        onUpdateProfile({
          publicData: {
            ...currentUser.attributes.profile.publicData,
            favoriteItems: updatedFavorites,
          },
        });
      }
    } else {
      // If no invalid favorites, mark as processed
      hasProcessedCleanup.current = true;
    }
  }, [currentUser, favoriteItems, validFavoriteIds, queryInProgress, onUpdateProfile]);
  // Set topbar class based on if a modal is open in a child component
  const topbarClasses = state.isMobileModalOpen
    ? classNames(css.topbarBehindModal, css.topbar)
    : css.topbar;

  const cardRenderSizes = isMapVariant => {
    if (isMapVariant) {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 767px) 100vw',
        `(max-width: 1023px) ${panelMediumWidth}vw`,
        `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
        `${panelLargeWidth / 3}vw`,
      ].join(', ');
    } else {
      // Panel width relative to the viewport
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

  // const topbar = <TopbarContainer lb={lb} />;

  return (
    <Page scrollingDisabled={scrollingDisabled} title='Favorites'>
      <LayoutSideNavigation
        sideNavClassName={css.navigation}
        topbar={<TopbarContainer className={topbarClasses} currentPage="FavoritePage" />}
        footer={<FooterContainer />}
        profilePageTab={true}
        sideBarButtons
        currentPage="FavoritePage"
        isAccountSettingTab={true}
      >
        {filteredListings && filteredListings.length !== 0 ? (
          <>
            <div className={css.listingCards}>
              {paginatedListings.map(l => (
                <FavoritePanel
                  className={css.listingCard}
                  key={l.id.uuid}
                  listing={l}
                  renderSizes={cardRenderSizes(false)}
                  setActiveListing={setActiveListing}
                  favoriteItems={favoriteItems}
                  onUpdateProfile={onUpdateProfile}
                  currentUser={currentUser}
                />
              ))}
            </div>
            <FavoritePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <p className={css.favoriteInfo}>
            Love something you see in our <a href="/s">collection</a>? Make sure to add it to your
            Favorites!
          </p>
        )}
      </LayoutSideNavigation>
    </Page>
  );
};

FavoritePageComponent.defaultProps = {
  listings: [],
  pagination: null,
  searchListingsError: null,
  searchParams: {},
  tab: 'listings',
  activeListingId: null,
};

FavoritePageComponent.propTypes = {
  listings: array,
  history: shape({
    push: func.isRequired,
  }).isRequired,
  // from useLocation
  location: shape({
    search: string.isRequired,
  }).isRequired,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,
};

const EnhancedSearchPage = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();

  return (
    <FavoritePageComponent
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
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
  } = state.FavoritePage;
  const { currentUser } = state.user;
  const { isAuthenticated } = state.auth;

  const listings = getListingsById(state, currentPageResultIds);

  return {
    isAuthenticated,
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    listings,
    pagination,
    queryInProgress,
    queryListingsError,
    queryParams,
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onActivateListing: listingId => dispatch(setActiveListing(listingId)),
  onUpdateProfile: data => dispatch(updateProfile(data)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const FavoritePage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EnhancedSearchPage);

FavoritePage.loadData = (params, search) => {
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

export default FavoritePage;
