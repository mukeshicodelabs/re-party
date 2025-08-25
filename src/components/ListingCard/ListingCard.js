import React, { useState } from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { AspectRatioWrapper, Avatar, NamedLink, ResponsiveImage } from '../../components';

import css from './ListingCard.module.css';
import { useSelector } from 'react-redux';
import IconCard from '../SavedCardDetails/IconCard/IconCard';
import { allProductsType } from '../../util/constants';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

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

const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, foundListingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  const priceValue = <span className={css.priceValueText}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

  return (
    <div className={css.price} title={priceTitle}>
      {hasMultiplePriceVariants ? (
        <FormattedMessage
          id="ListingCard.priceStartingFrom"
          values={{ priceValue, pricePerUnit }}
        />
      ) : (
        <FormattedMessage id="ListingCard.price" values={{ priceValue, pricePerUnit }} />
      )}
    </div>
  );
};

/**
 * ListingCard
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const history = useHistory();
  const intl = props.intl || useIntl();
  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
    currentUser,
    onUpdateProfile
  } = props;

  const [isHovered, setHovered] = useState(''); 
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing?.id.uuid;
  const { title = '', price, publicData, deleted, state } = currentListing.attributes;
  const { listingType, productType,heroImageId } = publicData || {};
  const listingProductType = allProductsType?.find((type) => type.key === (productType))?.label;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  const findHeroImage = currentListing?.images?.find(image => image.id.uuid === heroImageId); 
  const firstImage = currentListing?.images && currentListing?.images?.length > 0 ?  findHeroImage ? findHeroImage : currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
      onMouseEnter: () => setActiveListing(currentListing.id),
      onMouseLeave: () => setActiveListing(null),
    }
    : null;
  const isOwnListing = currentListing.author.id.uuid === currentUser?.id.uuid;
  const { favoriteItems } = currentUser?.attributes?.profile?.publicData || [];

  const auth = useSelector(state => state.auth.isAuthenticated);
  const handleFavoriteItems = () => {
    const existingFavorites =
      (currentUser?.attributes?.profile?.publicData?.favoriteItems || []).map(f => ({ ...f }));

    const index = existingFavorites.findIndex(b => b.id === id);

    let updatedFavorites;
    if (index > -1) {
      // Remove this listing from favorites
      updatedFavorites = existingFavorites.filter(item => item.id !== id);
    } else {
      // Add this listing to favorites
      updatedFavorites = state === "published" && !deleted ? [...existingFavorites, { id }]
        : [...existingFavorites];
    }

    const profile = {
      publicData: {
        favoriteItems: updatedFavorites,
      },
    };

    onUpdateProfile(profile);
  };

  return (
    <div className={classes}>
      <div className={css.avatarSection}>
        {!isOwnListing && (
          <div className={css.icon}>
            <div
              type="button"
              className={classNames(
                favoriteItems &&
                  Array.isArray(favoriteItems) &&
                  favoriteItems.findIndex(e => e.id == id) > -1
                  ? null
                  : css.bookmark
              )}
              style={{cursor: 'pointer'}}
              onClick={e => {
                !auth ? history.push('/login') : handleFavoriteItems();
              }}
            >
              {favoriteItems &&
                Array.isArray(favoriteItems) &&
                favoriteItems.findIndex(e => e.id === id) > -1 ? (
                <div className={css.isFavorite}>
                  <IconCard brand="favorite" />
                </div>
              ) : (
                <IconCard brand="favorite" />
              )}
            </div>
          </div>
        )}

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
        <div className={css.productType}>{listingProductType}</div>
        <p className={css.title}>
          {richText(title, {
            longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
            longWordClass: css.longWord,
          })}
        </p>

        <div className={css.priceValue}>
          <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />

          {showAuthorInfo && author && (
            <div className={css.avatarName}>
              <Avatar className={css.avatar} user={author} />
              <span className={css.authorText}>{authorName}</span>
            </div>
          )}

        </div>

        <div className={css.addTofavBtns}></div>
      </div>
    </div>
  );
};

export default ListingCard;
