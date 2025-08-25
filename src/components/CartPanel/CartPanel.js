import React, { Component, useEffect, useState } from 'react';
import { string, func, bool } from 'prop-types';
import classNames from 'classnames';
import { useConfiguration } from '../../context/configurationContext';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser, isProductForRent } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';

import { AspectRatioWrapper, AvatarLarge, NamedLink, ResponsiveImage } from '../../components';

import css from './CartPanel.module.css';
import { types as sdkTypes } from '../../util/sdkLoader';
import moment from 'moment';
import { propTypes } from '../../util/types';
import BrandIconCard from '../BrandIconCard/BrandIconCard';
const { Money } = sdkTypes;

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

export const CartPanelComponent = props => {
  const config = useConfiguration();
  const {
    className,
    rootClassName,
    intl,
    listing,
    renderSizes,
    setActiveListing,
    bookmarks,
    handleWishlist,
    handleRemoveFromState = () => {},
    currentUser,
    checkAvailabilty,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);

  const { title = '', price, publicData, description } = currentListing?.attributes || {};
  const { productType, purchaseQuantity, selectedPrice } = currentListing || {};
  const isRent = isProductForRent(productType);

  const id = currentListing.id.uuid;
  const startDate = moment(currentListing?.startDate).format('MM/DD/YYYY');
  const endDate = moment(currentListing?.endDate)
    .subtract(1, 'days')
    .format('MM/DD/YYYY');

  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'scaled-small',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith('scaled-small'))
    : [];
  const selectedRentalPrice = new Money(selectedPrice, 'USD');

  const cartItemprice = productType === 'rent' ? price :price;

  const { formattedPrice, priceTitle } = priceData(cartItemprice, config.currency, intl);
  
  const [isHovered, setHovered] = useState('');
  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  if (isHovered && currentListing && currentListing.images && currentListing.images.length > 1) {
    firstImage = currentListing.images[1];
  }

  const isStockAvailable = currentListing?.currentStock?.attributes?.quantity;
  const bookingEndDate =
    currentListing && currentListing.endDate
      ? new Date(currentListing.endDate).toISOString()
      : null;

  const listingId = currentListing?.id?.uuid;
  const isEndDateAvailable =
    bookingEndDate && listingId
      ? checkAvailabilty.some(item => {
          if (item.id === listingId) {
            return item.data.some(slot => slot.attributes.end === bookingEndDate);
          }
          return false;
        })
      : false;

  return (
    <div className={css.root}>
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

        <div className={css.info}>
          <div className={css.mainInfo}>
            <div className={css.title}>
              {richText(title, {
                longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                longWordClass: css.longWord,
              })}
            </div>
          </div>
          {productType === 'rent' && (
            <div className={isEndDateAvailable ? css.unavailable : css.available}>
              {isEndDateAvailable ? (
                <FormattedMessage id="CartPanel.itemNotAvailable" />
              ) : (
                <FormattedMessage id="CartPanel.itemAvailable" />
              )}
            </div>
          )}

          {productType === 'sell' && (
            <div className={isStockAvailable ? css.available : css.unavailable}>
              {isStockAvailable ? (
                <FormattedMessage id="CartPanel.itemInStock" />
              ) : (
                <FormattedMessage id="CartPanel.itemOutOfStock" />
              )}
            </div>
          )}
        </div>
      </div>
      <div className={css.formattedPrice}>
        <div>
          <p className={css.headingName}>
            <FormattedMessage id="CartPage.priceheading" />
          </p>
          <span className={css.tableValue}>{formattedPrice}</span>
        </div>
      </div>
      {productType == 'rent' ? (
        <div className={css.dateWrapper}>
          <p className={css.headingName}>
            <FormattedMessage id="CartPage.rentalPeriodheading" />
          </p>
          <span className={css.tableValue}>
            {startDate} to {endDate}
          </span>
        </div>
      ) : null}
      {productType === 'sell' && (
        <div className={css.dateWrapper}>
          <p className={css.headingName}>
            {' '}
            <FormattedMessage id="CartPage.quantityheading" />
          </p>
          <span className={css.tableValue}>{currentListing?.purchaseQuantity}</span>
        </div>
      )}

      <div className={css.autorImgWrapper}>
        <AvatarLarge className={css.autorImg} user={author} />
        <NamedLink
          className={css.authorProfileName}
          name="ProfilePage"
          params={{ id: author?.id?.uuid }}
        >
          <div className={css.authorName}>
            {author?.attributes?.profile?.displayName || 'Seller'}
          </div>
        </NamedLink>
      </div>

      <div className={css.buttonsGroup}>
        <button
          className={css.deleteBtn}
          onClick={e => {
            handleRemoveFromState(id);
            handleWishlist(id, e, null);
          }}
        >
          <BrandIconCard type="delete" />
          {bookmarks && bookmarks.findIndex(e => e == id) > -1 ? (
            <span>
              <FormattedMessage id="CartPage.deleteheading" />
            </span>
          ) : null}
        </button>
        <NamedLink
          className={css.viewBtn}
          name="ListingPage"
          params={{ id, slug }}
          to={{ search: '?redirect=true' }}
        >
          <BrandIconCard type="view" />
          <FormattedMessage id="CartPage.viewheading" />
        </NamedLink>
      </div>
    </div>
  );
};

CartPanelComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  setActiveListing: null,
  showAuthorInfo: true,
};

CartPanelComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,
  showAuthorInfo: bool,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

export default injectIntl(CartPanelComponent);
