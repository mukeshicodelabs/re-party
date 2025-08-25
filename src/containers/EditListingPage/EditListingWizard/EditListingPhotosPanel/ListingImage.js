import React, { useState } from 'react';
import classNames from 'classnames';

// Import shared components
import {
  AspectRatioWrapper,
  ImageFromFile,
  ResponsiveImage,
  IconSpinner,
  Modal,
} from '../../../../components';

// Import modules from this directory
import css from './ListingImage.module.css';

const ImageModal = props => {
  const { isOpen, onClose, image, onManageDisableScrolling } = props;

  if (!image) return null;

  const handleClose = () => {
    onClose();
  };

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal
      className={css.imageModal}
      isOpen={isOpen}
      onClose={handleClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <div className={css.modalContent} onClick={handleBackdropClick}>
        <div className={css.imageContainer}>
          {image.file && !image.attributes ? (
            <img
              src={URL.createObjectURL(image.file)}
              alt="Enlarged image"
              className={css.enlargedImage}
            />
          ) : (
            <img
              src={image.attributes?.variants?.['scaled-large']?.url || image.attributes?.variants?.['listing-card']?.url}
              alt="Enlarged image"
              className={css.enlargedImage}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};
// Cross shaped button on the top-right corner of the image thumbnail
const RemoveImageButton = props => {
  const { className, rootClassName, onClick } = props;
  const classes = classNames(rootClassName || css.removeImage, className);
  return (
    <button className={classes} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="white" />
        <path d="M13 7L7 13" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7 7L13 13" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  );
};

/**
 * Cropped "thumbnail" of given listing image.
 * The image might be one already uploaded and attached to listing entity
 * or representing local image file (before it's uploaded & attached to listing).
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} props.image - The image object
 * @param {string} props.savedImageAltText - The saved image alt text
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {number} [props.aspectWidth] - The aspect width
 * @param {number} [props.aspectHeight] - The aspect height
 * @param {string} [props.variantPrefix] - The variant prefix
 * @returns {JSX.Element}
 */
const ListingImage = props => {
  const {
    className,
    image,
    savedImageAltText,
    onRemoveImage,
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
    heroImageId,
    setHeroImageId,
    showcheckbox = false,
    onImageClick,
    onManageDisableScrolling
  } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleRemoveClick = e => {
    e.stopPropagation();
    onRemoveImage(image.id);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
    if (onImageClick) {
      onImageClick(image);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCheckboxClick = e => {
    e.stopPropagation();
  };

  if (image.file && !image.attributes) {
    // Add remove button only when the image has been uploaded and can be removed
    const removeButton = image.imageId ? <RemoveImageButton onClick={handleRemoveClick} /> : null;

    // While image is uploading we show overlay on top of thumbnail
    const uploadingOverlay = !image.imageId ? (
      <div className={css.thumbnailLoading}>
        <IconSpinner />
      </div>
    ) : null;

    return (
      <>
        <div className={className} >
          <ImageFromFile
            id={image.id}
            className={className}
            file={image.file}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            onClick={handleImageClick}
            style={{ cursor: 'pointer' }}
          >
            {removeButton}
            {uploadingOverlay}
          </ImageFromFile>
        </div>
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          image={image}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      </>
    );
  } else {
    const classes = classNames(css.root, className);

    const variants = image
      ? Object.keys(image?.attributes?.variants).filter(k => k.startsWith('scaled-large'))
      : [];
    const imgForResponsiveImage = image.imageId ? { ...image, id: image.imageId } : image;

    // This is shown when image is uploaded,
    // but the new responsive image is not yet downloaded by the browser.
    // This is absolutely positioned behind the actual image.
    const fallbackWhileDownloading = image.file ? (
      <ImageFromFile
        id={image.id}
        className={css.fallbackWhileDownloading}
        file={image.file}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
      >
        <div className={css.thumbnailLoading}>
          <IconSpinner />
        </div>
      </ImageFromFile>
    ) : null;

    return (
      <>
        <div className={classes}>
          <div className={css.wrapper} style={{ cursor: 'pointer' }}>
            {fallbackWhileDownloading}
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              <div onClick={handleImageClick} >
                <ResponsiveImage
                  rootClassName={css.rootForImage}
                  image={imgForResponsiveImage}
                  alt={savedImageAltText}
                  variants={variants}
                />
              </div>
            </AspectRatioWrapper>
            <RemoveImageButton onClick={handleRemoveClick} />
            {showcheckbox && (
              <input
                type="checkbox"
                className={css.heroImageCheckbox}
                name="heroImage"
                id="heroImage"
                value={image?.id?.uuid}
                onClick={handleCheckboxClick}
                onChange={e => {
                  if (e.currentTarget.checked) {
                    setHeroImageId(image?.id?.uuid || image?.imageId?.uuid);
                  }
                }}
                checked={
                  heroImageId && (heroImageId == image?.id?.uuid || heroImageId == image?.imageId?.uuid)
                    ? true
                    : false
                }
              />
            )}
          </div>
        </div>
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          image={image}
          onManageDisableScrolling={onManageDisableScrolling}
        />
      </>
    );
  }
};

export default ListingImage;
