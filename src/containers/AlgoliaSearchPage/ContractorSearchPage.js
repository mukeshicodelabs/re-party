import React, { useState, useEffect, useRef } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, SortBy, useHits, useStats, SearchBox, RefinementList } from 'react-instantsearch';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { Button, OutsideClickHandler, Page } from '../../components';
import { compose } from 'redux';
import { connect } from 'react-redux';
import qs from 'qs';
import styles from './ContractorSearchPage.module.css';
import { FormattedMessage } from 'react-intl';
import ContractorSearchCard from './ContractorSearchCard';
import ContractorSearchFilters from './ContractorSearchFilters';
import ContractorSearchPagination from './ContractorSearchPagination';
import { useHistory } from 'react-router-dom';
import ProjectCardSkeleton from './ContractorSearchCardSkeleton';
import { updateProfile } from '../ProfileSettingsPage/ProfileSettingsPage.duck';
import { useRefinementList } from 'react-instantsearch';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import axios from 'axios';

const indexName = process.env.REACT_APP_ALGOLIA_LISTING_INDEX;
const searchClient = algoliasearch(
  process.env.REACT_APP_ALGOLIA_APP_ID,
  process.env.REACT_APP_ALGOLIA_SEARCH_API_KEY
);

const CustomHits = ({ currentUser, onFetchUserProfileImage, config, userBidData, onUpdateProfile }) => {
  const { hits } = useHits();
  const { processingTimeMS } = useStats();

  if (processingTimeMS === 0) {
    return (
      <div className={styles.loadingContainer}>
        {[...Array(16)].map((_, index) => (
          <ProjectCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      {hits.length > 0 ? (
        hits.map(hit => (
          <ContractorSearchCard
            key={hit.objectID}
            hits={hit}
            onFetchUserProfileImage={onFetchUserProfileImage}
            config={config}
            currentUser={currentUser}
            userBidData={userBidData}
            onUpdateProfile={onUpdateProfile}
          />
        ))
      ) : (
        <p className={styles.noMatchText}>
          <FormattedMessage id="AlgoliaSearchPage.noResults" />
        </p>
      )}
    </div>
  );
};

const CustomFilteredStats = ({ currentUser }) => {
  const { nbHits, processingTimeMS } = useStats();

  if (processingTimeMS === 0) {
    return (
      <div className={styles.noDataFoundWrapper}>
        <span className={styles.searchResults}>Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.noDataFoundWrapper}>
      <span className={styles.searchResults}>
        {nbHits} {nbHits === 1 ? 'result' : 'results'}
      </span>
    </div>
  );
};

const LocationInput = ({ value, onSubmit, placeholder, className }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      onSubmit({ target: { value: '' } });
      inputRef.current.focus();
    }
  };

  const handleSubmit = () => {
    if (inputRef.current && inputRef.current.value) {
      onSubmit({ target: { value: inputRef.current.value } });
    }
  };

  return (
    <div className={styles.customSearchBox}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={className}
        defaultValue={value}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <span className={styles.searchIcon} onClick={handleSubmit}>🔍</span>
      {value && <span className={styles.clearIcon} onClick={handleClear}>✖</span>}
    </div>
  );
};

const ContractorSearchPageComponent = props => {
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();
  const {
    scrollingDisabled,
    currentUser,
    onFetchUserProfileImage,
    userBidData,
    onUpdateProfile,
    params
  } = props;
const {featured=null}=params||{}
  const [searchParams, setSearchParams] = useState({
    configure: {},
    refinementList: {},
    range: {},
    sortBy: 'Newest',
    query: '',
    pickupFullAddress: '',
    page: 1,
  });

  const [pageRender, setPageRender] = useState(false);

  useEffect(() => {
    const sp = typeof window !== 'undefined' && qs.parse(window.location.search.slice(1));
    if (sp) {
      setSearchParams(prev => ({
        ...prev,
        query: sp.query || '',
        pickupFullAddress: sp.pickupFullAddress || '',
        page: parseInt(sp.page) || 1,
        sortBy: sp.sortBy || 'Newest',
        refinementList: {
          ...prev.refinementList,
          ...(sp.category && { category: sp.category.split('||') }),
          ...(sp.event_type && { event_type: sp.event_type.split('||') }),
          ...(sp.productType && { productType: sp.productType.split('||') }),
          ...(sp.select_color && { select_color: sp.select_color.split('||') }),
        },
      }));
    }
    setTimeout(() => {
      setPageRender(true);
    }, 1200);
  }, []);


  const getInitialUiStateFromURL = () => {
    const sp = typeof window !== 'undefined' && qs.parse(typeof window !== 'undefined' && window.location.search.slice(1));
    const refinementList = {};
    if (sp.category) refinementList.category = sp.category.split('||');
    if (sp.event_type) refinementList.event_type = sp.event_type.split('||');
    if (sp.productType) refinementList.productType = sp.productType.split('||');
    if (sp.select_color) refinementList.select_color = sp.select_color.split('||');
    if (sp.pickupFullAddress) refinementList.pickupFullAddress = sp.pickupFullAddress.split('||');
    return {
      [indexName]: {
        query: sp.query || '',
        pickupFullAddress: sp.pickupFullAddress || '',
        sortBy: sp.sortBy || 'Newest',
        page: parseInt(sp.page) || 1,
        refinementList,
        configure: { hitsPerPage: 16 },
      },
    };
  };

  const initialUiState = getInitialUiStateFromURL();


  const onSearchStateChange = ({ uiState }) => {
    const ui = uiState[indexName] || {};
    const params = new URLSearchParams();

    if (ui.query) params.set('query', ui.query);
    if (ui.pickupFullAddress) params.set('pickupFullAddress', ui.pickupFullAddress);
    if (ui.sortBy) params.set('sortBy', ui.sortBy);
    if (ui.page) params.set('page', ui.page);

    if (ui.refinementList) {
      Object.entries(ui.refinementList).forEach(([key, values]) => {
        if (values && values.length) {
          params.set(key, values.join('||'));
        }
      });
    }

    window.history.pushState({}, '', `/search?${params.toString()}`);
  };


  const handleClearFilters = () => {
    const clearedState = {
      configure: {},
      refinementList: {},
      range: {},
      sortBy: 'Newest',
      query: '',
      pickupFullAddress: '',
      page: 1,
    };

    setSearchParams(clearedState);
    const newUrl = `/search`;
    window.history.pushState({}, '', newUrl);

    setPageRender(false);
    setTimeout(() => {
      setPageRender(true);
    }, 500);
  };

  // const initialUiState = {
  //   [indexName]: {
  //     ...searchParams,
  //     configure: { hitsPerPage: 16 },
  //   },
  // };

  // Define filters array
  const filters = [
    { title: 'Category', attribute: 'category', type: 'RefinementList' },
    { title: 'Event Types', attribute: 'event_type', type: 'RefinementList' },
    { title: 'Product Type', attribute: 'productType', type: 'RefinementList' },
    { title: 'Color', attribute: 'select_color', type: 'RefinementList' },
  ];


  const RefinementListOnHover = ({ attribute, searchablePlaceholder, onChange }) => {
    const isPickupAddress = attribute === 'pickupFullAddress';

    // For Algolia checkboxes (non-pickupFullAddress)
    const { items, refine, searchForItems } = useRefinementList({ attribute });
    const [selectedItems, setSelectedItems] = useState([]);
    const [showList, setShowList] = useState(false);

    // For Mapbox predictions (pickupFullAddress only)
    const [query, setQuery] = useState('');
    const [predictions, setPredictions] = useState([]);

    // Fetch predictions from Mapbox only for pickupFullAddress
    const fetchPredictions = async query => {
      try {
        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
          {
            params: {
              access_token: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
              country: 'us',
            },
          }
        );
        setPredictions(response.data.features);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    };

    useEffect(() => {
      if (isPickupAddress && query) {
        fetchPredictions(query);
      } else if (isPickupAddress) {
        setPredictions([]);
      }
    }, [query, isPickupAddress]);

    const handleSelectCheckbox = value => {
      const isSelected = selectedItems.includes(value);
      const newSelectedItems = isSelected
        ? selectedItems.filter(v => v !== value)
        : [...selectedItems, value];

      setSelectedItems(newSelectedItems);
      refine(value); // Update Algolia
    };

    const handleSelectLocation = location => {
      onChange?.(location); // Send location object back to parent
      setShowList(false);
    };

    return (
      <OutsideClickHandler onOutsideClick={() => setShowList(false)}>
        <div>
          {isPickupAddress ? (
            <>
              <input
                type="text"
                placeholder={searchablePlaceholder || 'Search location'}
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowList(true);
                }}
                onClick={() => setShowList(true)}
              />
              {showList && predictions.length > 0 && (
                <ul>
                  {predictions.map(item => (
                    <li
                      key={item.id}
                      onClick={() =>
                        handleSelectLocation({
                          origin: item.center,
                          place_name: item.place_name,
                        })
                      }
                    >
                      {item.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder={searchablePlaceholder || 'Search'}
                onChange={e => searchForItems(e.target.value)}
                onClick={() => setShowList(true)}
              />
              {showList && items.length > 0 && (
                <ul>
                  {items.map(item => (
                    <li key={item.label}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.label)}
                          onChange={() => handleSelectCheckbox(item.label)}
                        />
                        {item.label} ({item.count})
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </OutsideClickHandler>
    );
  };

  const origin = searchParams?.pickupFullAddress?.origin || [];
  const aroundLatLng = Array.isArray(origin) && origin.length > 0 ? `${searchParams.pickupFullAddress.origin[1]},${searchParams.pickupFullAddress.origin[0]}` : undefined;

  return (
    <Page
      scrollingDisabled={scrollingDisabled}
      title="Find and Browse the Listings You Love!"
      className={styles.root}
    >
      <TopbarContainer />
      <div className={styles.searchPageContainer}>
        <div className={styles.headerSection}>
          <h2>Find and Browse Decor You'll Love!</h2>
        </div>
        <div className={styles.mainContentWrapper}>
          {pageRender ? (
            <InstantSearch
              searchClient={searchClient}
              indexName={indexName}
              key={`${searchParams.pickupFullAddress}-${searchParams.query}-${searchParams.page}`}
              initialUiState={initialUiState}
              onStateChange={({ uiState }) => {
                const ui = uiState[indexName] || {};
                const params = new URLSearchParams();
                if (ui.query) params.set('query', ui.query);
                if (ui.pickupFullAddress) params.set('pickupFullAddress', ui.pickupFullAddress);
                if (ui.sortBy) params.set('sortBy', ui.sortBy);
                if (ui.page) params.set('page', ui.page);

                if (ui.refinementList) {
                  Object.entries(ui.refinementList).forEach(([key, values]) => {
                    if (values?.length) {
                      params.set(key, values.join('||'));
                    }
                  });
                }

                history.replace(`/search?${params.toString()}`);
              }}
            >
              <Configure
                filters={`state:published AND stock > 0 ${featured?'AND isFeatured:true':''}`}
                hitsPerPage={16}
                aroundLatLng={aroundLatLng}
                aroundRadius={20000} // 20 km radius
              />
              <div className={styles.searchBarWrapper}>
                <SearchBox
                  attribute="title"
                  placeholder="Search Title"
                  className={styles.searchInput}
                  searchAsYouType={true}
                />
                <RefinementListOnHover
                  attribute="pickupFullAddress"
                  searchablePlaceholder="Location"
                  pickupFullAddress={searchParams.pickupFullAddress}
                  onChange={(selectedLocation) => {
                    setSearchParams(prev => ({
                      ...prev,
                      pickupFullAddress: selectedLocation, // will be '' if unselected
                      page: 1,
                    }));
                  }}
                />


              </div>
              <div className={styles.sortByWrapper}>
                <div className={styles.filterContainer}>
                  <ContractorSearchFilters filters={filters} />
                  <button className={styles.clearButton} onClick={handleClearFilters}>
                    Clear All Filters
                  </button>
                </div>
                <CustomFilteredStats currentUser={currentUser} />
              </div>
              <div className={styles.searchContent}>
                <CustomHits
                  currentUser={currentUser}
                  onFetchUserProfileImage={onFetchUserProfileImage}
                  userBidData={userBidData}
                  onUpdateProfile={onUpdateProfile}
                />
              </div>
              <ContractorSearchPagination
                currentPage={searchParams.page}
                itemsPerPage={16}
                setSearchParams={setSearchParams}
                routeConfiguration={routeConfiguration}
                searchParamss={searchParams}
              />
            </InstantSearch>
          ) : (
            <div className={styles.loadingContainer}>
              {[...Array(16)].map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </div>
          )}

        </div>
      </div>
      <FooterContainer />
    </Page>
  );
};

const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  scrollingDisabled: isScrollingDisabled(state),
  userBidData: state.user.userBidData,
});

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onFetchUserProfileImage: (params, config) => dispatch(showUser(params, config)),
  onUpdateProfile: data => dispatch(updateProfile(data)),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps)
)(ContractorSearchPageComponent);