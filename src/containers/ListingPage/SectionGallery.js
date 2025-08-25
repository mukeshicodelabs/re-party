import React from 'react';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';
import classNames from 'classnames';

const SectionGallery = props => {
  const { listing, variantPrefix, previewGallery } = props;
  const { imageUrl, uploadedVideoURL } = listing?.attributes?.publicData || {};
  let images = listing.images;

  if (imageUrl) {
    const appendedImageObj = {
      id: { _sdkType: "UUID", uuid: `custom-${Date.now()}` },
      type: "image",
      attributes: {
        variants: {
          "scaled-small": { url: imageUrl, width: 320, height: 213 },
          "scaled-medium": { url: imageUrl, width: 750, height: 500 },
          "scaled-large": { url: imageUrl, width: 1024, height: 682 },
          "scaled-xlarge": { url: imageUrl, width: 2400, height: 1600 },
          "original": { url: imageUrl, width: 2400, height: 1600 }
        }
      }
    };
    images = [...images, appendedImageObj];
  }

  if (uploadedVideoURL) {
    const appendedVideoObj = {
      id: { _sdkType: "UUID", uuid: `video-${Date.now()}` },
      type: "video",
      attributes: {
        url: uploadedVideoURL
      }
    };
    images = [...images, appendedVideoObj];
  }

  const imageVariants = ['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge'];
  const thumbnailVariants = [variantPrefix, `${variantPrefix}-2x`, `${variantPrefix}-4x`];
  return (
    // <section className={classNames( css.productGallery, [css.previewGalleryWrapper] : previewGallery)} data-testid="carousel">
    <section className={classNames(css.productGallery, { [css.previewGalleryWrapper]: previewGallery })} data-testid="carousel">
      <ListingImageGallery
      previewGallery={previewGallery}
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
      />
    </section>
  );
};

export default SectionGallery;
