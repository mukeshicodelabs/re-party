import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink, ResponsiveImage, SecondaryButton } from '../../components';
import css from './ContractorSearchCard.module.css';
// import { formatTitle } from '../ManageListingsPage/ManageListingCard/ManageListingCard';
import { createResourceLocatorString } from '../../util/routes';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { AVATAR_IMAGE_VARIANTS } from '../../components/Avatar/Avatar';
import { useSelector } from 'react-redux';
import { ensureListing } from '../../util/data';
import classNames from 'classnames';
import IconCard from '../../components/SavedCardDetails/IconCard/IconCard';
import dummyImage from '../../assets/images/dummy.svg';
import { createSlug } from '../../util/urlHelpers';
const MIN_LENGTH_FOR_LONG_WORDS = 7;

export const ContractorSearchCard = props => {
  const routeConfiguration = useRouteConfiguration();
  const { hits, currentUser, onUpdateProfile } = props;
  const {
    title,
    businessCategories = [],
    states,
    authorData,
    productType,
    price,
    listingImageUrl,
    state
  } = hits;

  const slug = createSlug(title);
  const { abbreviatedName, displayName, profileImage, authorId } = authorData || {};

  const { favoriteItems } = currentUser?.attributes?.profile?.publicData || [];
  const auth = useSelector(state => state.auth.isAuthenticated);
  const id = hits?.objectID;
  const isOwnListing = authorId === currentUser?.id.uuid;
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
      updatedFavorites = state === "published" ? [...existingFavorites, { id }]
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
    <div className={css.root}>
      <div className={css.searchCardImage}>
        {!isOwnListing && (
          <div className={css.favoriteWrapper}>
            <div
              type="button"
              className={classNames(
                favoriteItems &&
                  Array.isArray(favoriteItems) &&
                  favoriteItems.findIndex(e => e.id == id) > -1
                  ? null
                  : css.bookmark
              )}
              style={{ cursor: 'pointer' }}
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
        <NamedLink className={css.infoS} name="ListingPage" params={{ id, slug }}>
          {listingImageUrl ? <img src={listingImageUrl} alt={hits.title || 'Listing Image'} className={css.cardImage} /> :
            <div className={css.noImageFound}>No Image</div>}
        </NamedLink>
      </div>
      <NamedLink className={css.info} name="ListingPage" params={{ id, slug }}>
        {productType && (
          <span className={css.productType}>
            {productType.toLowerCase() == 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        )}

        <div className={css.titleName}>{title}</div>

        <div className={css.categoriesBottom}>
          <span className={css.price}>${price / 100}.00</span>
          <div className={css.authProfile}>
            {profileImage != null && (
              <ResponsiveImage
                rootClassName={css.avatar}
                alt={displayName}
                image={profileImage}
                variants={AVATAR_IMAGE_VARIANTS}
              />
            )}
            {displayName}
          </div>
        </div>
      </NamedLink>
    </div>
  );
};

export default ContractorSearchCard; 