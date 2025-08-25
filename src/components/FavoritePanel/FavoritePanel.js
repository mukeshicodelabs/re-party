import React, { Component, useState } from 'react';
import { string, func, bool } from 'prop-types';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import {
  AspectRatioWrapper,
  NamedLink,
  ResponsiveImage,
  Button,
  H6,
  Modal,
  Avatar,
} from '../../components';

import css from './FavoritePanel.module.css';
import { types as sdkTypes } from '../../util/sdkLoader';
import { allEventTypes } from '../../config/configListing';
import IconCard from '../SavedCardDetails/IconCard/IconCard';
import { useSelector } from 'react-redux';
import { allProductsType } from '../../util/constants';
const MIN_LENGTH_FOR_LONG_WORDS = 10;
const { UUID, Money } = sdkTypes;

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

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

export const FavoritePanelComponent = props => {
  const config = useConfiguration();
  const {
    className,
    rootClassName,
    intl,
    listing,
    renderSizes,
    setActiveListing,
    stockDetails,
    currentUser,
    favoriteItems,
    onUpdateProfile,
  } = props;

  const listingConfig = config.listing;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const [isNestedModalOpen, setIsNestedModalOpen] = useState(false);
  const toggleNestedModal = () => {
    setIsNestedModalOpen(!isNestedModalOpen);
  };

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);

  const { listingType ,productType:listingproductType} = currentListing?.attributes?.publicData || {};
  const productType = allProductsType.find(type => type.key == listingproductType)?.label;

  const id = currentListing.id.uuid;
  const userBookmarks = currentUser?.attributes?.profile?.publicData?.bookmarks;

  const index = stockDetails && stockDetails.findIndex(item => item.listingId == id);

  const { title = '', price, publicData, description } = currentListing.attributes || {};

  const currentStock = currentListing && currentListing.currentStock;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);
  const [isHovered, setHovered] = useState('');
  const auth = useSelector(state => state.auth.isAuthenticated);
  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;
  const handleFavoriteItems = () => {
    try {
      // Safely get the current favorites array
      const currentFavorites = currentUser?.attributes?.profile?.publicData?.favoriteItems || [];
      
      // Ensure we have a proper array to work with
      const existingFavorites = Array.isArray(currentFavorites) 
        ? [...currentFavorites] 
        : [];

      // Check if the current listing is already in favorites
      const isFavorite = existingFavorites.some(fav => fav.id === id);
      
      let updatedFavorites;
      if (isFavorite) {
        // Remove this listing from favorites
        updatedFavorites = existingFavorites.filter(item => item.id !== id);
      } else {
      // Add this listing to favorites
      updatedFavorites = [...existingFavorites, { id }];
      }

      // Update the user's profile with the new favorites
      const profile = {
        publicData: {
          ...currentUser?.attributes?.profile?.publicData, // Preserve existing public data
          favoriteItems: updatedFavorites,
        },
      };

      // Call the update function with the new profile data
      onUpdateProfile(profile);
    } catch (error) {
      console.error('Error updating favorites:', error);
      // You might want to add user feedback here (e.g., a toast notification)
    }
  };

  return (
    <div className={classes}>
      <div className={css.avatarSection}>
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

        <NamedLink name="ListingPage" params={{ id, slug }}>
          <div className={css.avatarWrapper}>
            <AspectRatioWrapper
              className={css.aspectRatioWrapper}
              width={aspectWidth}
              height={aspectHeight}
              {...setActivePropsMaybe}
              onMouseOver={() => setHovered('hover')}
              onMouseOut={() => setHovered('')}
            >
              <LazyImage
                rootClassName={css.rootForImage}
                alt={title}
                image={firstImage}
                variants={variants}
                sizes={renderSizes}
              />
            </AspectRatioWrapper>
          </div>
        </NamedLink>
      </div>

      <div className={css.info}>
        <div className={css.productType}>{productType}</div>
        <p className={css.title}> {title}</p>
        <div className={css.priceValue}>
          {priceTitle}

          <div className={css.avatarNname}>
            <Avatar className={css.avatar} user={author} />
            <span>{authorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

FavoritePanelComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  setActiveListing: null,
  showAuthorInfo: true,
};

FavoritePanelComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,
  showAuthorInfo: bool,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

export default injectIntl(FavoritePanelComponent);
