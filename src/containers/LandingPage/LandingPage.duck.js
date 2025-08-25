import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { searchListings } from '../SearchPage/SearchPage.duck';
export const ASSET_NAME = 'landing-page';
const RESULT_PAGE_SIZE = 24;

export const loadData = (params, search,config) => dispatch => {
  const pageAsset = { landingPage: `content/pages/${ASSET_NAME}.json` };

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;
  return Promise.all([
    dispatch(fetchPageAssets(pageAsset, true)),
    dispatch(searchListings(
        {
          page:1,
          perPage: RESULT_PAGE_SIZE,
          include: ['author', 'images','author.profileImage'],
          'fields.listing': [
            'title',
            'geolocation',
            'price',
            'deleted',
            'state',
            'publicData',
          ],
          'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
          'fields.image': [
            'variants.scaled-small',
            'variants.scaled-medium',
            `variants.${variantPrefix}`,
            `variants.${variantPrefix}-2x`,
            // Avatars
          'variants.square-small',
          'variants.square-small2x',
          ],
          ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
          ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
          'limit.images': 1,
        },
        config
      ))
  ])
  .then((res=>{
    return {};
  }))
};

