import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';
import { Form as FinalForm, Field } from 'react-final-form';

// Import shared components
import { H3, ListingLink, Modal } from '../../../../components';

// Import modules from this directory
import EditListingPhotosForm from './EditListingPhotosForm';
import css from './EditListingPhotosPanel.module.css';
import { useState } from 'react';
import EditListingPreview from './EditListingPreview';

const getInitialValues = params => {
  const { listing } = params;
  const { publicData = {} } = listing?.attributes || {};
  const { imageUrl = '' } = publicData;
  return {
    imageUrl,
  };
};

/**
 * The EditListingPhotosPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} props.errors - The errors object
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Array} props.images - The images array
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {Function} props.onImageUpload - The image upload function
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @returns {JSX.Element}
 */
const EditListingPhotosPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    onImageUpload,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
    listingImageConfig,
    params = {},
    images,
    onGetAiListingImage,
    onfetchImageDesc,
    aiImage,
    aiImageError,
    aiImageInProgress,
    onManageDisableScrolling,
    onupdateNumberOfAiImagesCreation,
    prevButton
  } = props;
  
  
     const [showPreview, setShowPreview] = useState(false);
  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const [numberOfAiImageCreation, setNumberOfAiImageCreation] = React.useState(listing?.attributes?.publicData?.numberOfImagesGenterated || 0);
  const isPhotosPanel = params.tab === 'photos';
  const [beforeAiImage, setBeforeAiImage] = React.useState(listing?.attributes?.publicData?.imageUrl || null);
  const [imageUrl, setImageUrl] = React.useState();
  const [selectedImageForAI, setSelectedImageForAI] = React.useState();
  return (
    <div className={classes}>
      <EditListingPhotosForm
        listing={listing}
        numberOfAiImageCreation={numberOfAiImageCreation}
        setNumberOfAiImageCreation={setNumberOfAiImageCreation}
        onupdateNumberOfAiImagesCreation={onupdateNumberOfAiImagesCreation}
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        beforeAiImage={beforeAiImage}
        setBeforeAiImage={setBeforeAiImage}
        initialValues={getInitialValues(props, isPhotosPanel)}
        onImageUpload={onImageUpload}
        prevButton={prevButton}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        selectedImageForAI={selectedImageForAI}
        setSelectedImageForAI={setSelectedImageForAI}
        onSubmit={(values) => {
          const { isSkipped } = values;
          const updateValues = {
            publicData: {
              imageUrl: imageUrl ? imageUrl : beforeAiImage,
              numberOfImagesGenterated: numberOfAiImageCreation
            },
          };
          onSubmit(updateValues);
        }}
        handleSkip={(values) => {
          setImageUrl('');
          setBeforeAiImage('');
          const updateValues = {
            publicData: {
              imageUrl: '',
              numberOfImagesGenterated: numberOfAiImageCreation
            },
          };
          onSubmit(updateValues);
        }}
        onRemoveImage={onRemoveImage}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingImageConfig={listingImageConfig}
        isPhotosPanel={isPhotosPanel}
        onGetAiListingImage={onGetAiListingImage}
        onfetchImageDesc={onfetchImageDesc}
        aiImage={aiImage}
        aiImageError={aiImageError}
        aiImageInProgress={aiImageInProgress}
        onManageDisableScrolling={onManageDisableScrolling}
        setShowPreview={setShowPreview}
      />
      {/* <Modal
        className={css.previewListingModal}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <FinalForm
        onSubmit={(values) => {
        
        }}
          render={formRenderProps => (
            <EditListingPreview
              listing={listing}
              imageUrl={imageUrl ? imageUrl : beforeAiImage}
            />)
          }
        />
      </Modal> */}
    </div>
  );
};

export default EditListingPhotosPanel;
