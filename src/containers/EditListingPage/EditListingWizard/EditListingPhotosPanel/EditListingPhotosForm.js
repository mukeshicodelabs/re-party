import React, { useState, useEffect } from 'react';
import { ARRAY_ERROR } from 'final-form';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { nonEmptyArray, composeValidators } from '../../../../util/validators';
import { isUploadImageOverLimitError } from '../../../../util/errors';

// Import shared components
import { Button, Form, AspectRatioWrapper, Modal } from '../../../../components';
import css from './EditListingPhotosForm.module.css';
import roundLogo from '../../../../assets/images/round-logo.svg';
import AIResponseData from './AIResponseData';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';
import reduceReuseVideo from '../../../../assets/images/reduce-reuse.mp4';
import { getdetailsfromApi } from '../../../../util/api';
import chire from '../../../../assets/images/chire.png';
import { useSelector } from 'react-redux';
import { set } from 'lodash';
import EditListingPreview from './EditListingPreview';

// NOTE: PublishListingError and ShowListingsError are here since Photos panel is the last visible panel
// before creating a new listing. If that order is changed, these should be changed too.
// Create and show listing errors are shown above submit button
const PublishListingError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
    </p>
  ) : null;
};

const ShowListingsError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
    </p>
  ) : null;
};

// Field component that uses file-input to allow user to select images.

// Component that shows listing images from "images" field array

/**
 * The EditListingPhotosForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.fetchErrors - The fetch errors object
 * @param {propTypes.error} props.fetchErrors.publishListingError - The publish listing error
 * @param {propTypes.error} props.fetchErrors.showListingsError - The show listings error
 * @param {propTypes.error} props.fetchErrors.uploadImageError - The upload image error
 * @param {propTypes.error} props.fetchErrors.updateListingError - The update listing error
 * @param {string} props.saveActionMsg - The save action message
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onImageUpload - The image upload function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @param {number} props.listingImageConfig.aspectWidth - The aspect width
 * @param {number} props.listingImageConfig.aspectHeight - The aspect height
 * @param {string} props.listingImageConfig.variantPrefix - The variant prefix
 * @returns {JSX.Element}
 */
export const EditListingPhotosForm = props => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [readyForSubmit, setReadyForSubmit] = useState(false);
  const [openSubmitModal, setOpenSubmitModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [isskipped, setIsSkipped] = useState(false);
  useEffect(() => {
    const listingTitle = props?.listing?.attributes?.title || '';
    const metadata = `
  title: ${listingTitle}
`;
    const fetchData = async () => {
      try {
        setLoadingPrompts(true);
        const respo = await getdetailsfromApi({ metadata });
        if (respo && respo?.status == 'success') {
          setPrompts(respo?.data?.prompts ?? []);
        }
      } catch (error) {
        console.error('❌ API call failed:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };
    fetchData();
  }, []);

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      render={formRenderProps => {
        const {
          setImageUrl,
          selectedImageForAI,
          setSelectedImageForAI,
          imageUrl,
          beforeAiImage,
          setBeforeAiImage,
          form,
          setNumberOfAiImageCreation,
          className,
          numberOfAiImageCreation,
          fetchErrors,
          handleSubmit,
          invalid,
          disabled,
          ready,
          updated,
          updateInProgress,
          touched,
          errors,
          values,
          listing,
          onGetAiListingImage,
          aiImage,
          aiImageError,
          aiImageInProgress,
          onManageDisableScrolling,
          onupdateNumberOfAiImagesCreation,
          prevButton,
          handleSkip,
          // setShowPreview
        } = formRenderProps;
        
        const images = listing?.images || [];
        // Collect saved Images 
        const listingCardUrls =
          images &&
          images?.length &&
          images?.map(img => img.attributes.variants['listing-card'].url);
        // check user have strpe account or not
        const stripeAccountDetails = useSelector(
          state => state?.stripeConnectAccount?.stripeAccount
        );
        const isStripeAccountConnected =
          stripeAccountDetails &&
          stripeAccountDetails?.attributes?.stripeAccountData?.requirements?.currently_due
            ?.length == 0;
        // check listing has published state or not
        const isPublished =
          (listing && listing?.attributes && listing?.attributes?.state == 'published') ||
          listing?.attributes?.state == 'pendingApproval';

        // Function to upload image to Cloudinary
        const uploadImageToCloudinary = async file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', UPLOAD_PRESET);
          try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            return data.secure_url;
          } catch (err) {
            console.error('Upload failed:', err);
            return null;
          }
        };

        const handleImageUpload = async (e, aiResp) => {
          const file = e ? e.target.files[0] : aiResp;
          if (file && !aiResp) {
            setIsUploading(true);
            const url = await uploadImageToCloudinary(file);
            if (url && !aiResp) {
              setBeforeAiImage(url);
              setSelectedImageForAI(url)
            } else if (aiResp) {
              setImageUrl(url);
            }
            setIsUploading(false);
            aiResp ? setReadyForSubmit(true) : setReadyForSubmit(false);
          }
          else {
            const url = await uploadImageToCloudinary(file);
            if (url && !aiResp) {
              setBeforeAiImage(url);
              setSelectedImageForAI(url)
            } else if (aiResp) {
              setImageUrl(url);
            }
            aiResp ? setReadyForSubmit(true) : setReadyForSubmit(false);
          }
        };
        // Function to remove AI generated image
        const removeAigeneratedImage = () => {
          setImageUrl('');
        };
        // Function to handle image removal
        const handleRemoveImage = () => {
          setBeforeAiImage('');
          // Reset the file input
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) {
            fileInput.value = '';
          }
        };
        const { publishListingError, showListingsError, updateListingError } = fetchErrors || {};
        const submitReady = updated || ready;
        const submitInProgress = false;
        const classes = classNames(css.root, className);

        // Function to create AI image
        const onCreateAiImage = async (Regenerate, newPrompt) => {
          setSelectedPrompt(newPrompt);
          if (!selectedImageForAI) { return null }
          onupdateNumberOfAiImagesCreation(listing?.id, numberOfAiImageCreation + 1);
          setNumberOfAiImageCreation(prevCount => prevCount + 1);
          if (Regenerate) {
            setIsModalOpen(false);
          }
          const data = {
            images: [selectedImageForAI],
            description: newPrompt ? newPrompt : selectedPrompt,
          }; 
          const aiGeneratedData = await onGetAiListingImage(data);
          if (aiGeneratedData?.data) {
            setIsModalOpen(true);
          }
        };

        return (
          <>
            <Form
              className={classes}
              onSubmit={e => {
                e.preventDefault();
              }}
            >
              {' '}
              <div>
                <div className={css.heading}>
                  <FormattedMessage id="EditListingPhotosForm.formTittle" />
                </div>
                <div className={css.subHeading}>
                  <FormattedMessage id="EditListingPhotosForm.AdditionalFormTittle" />
                </div>
              </div>
              <div className={css.uploadImageContainer}>
                <div className={css.uploadImageLabel}>
                  <div className={css.aiHeading}>
                    <FormattedMessage id="EditListingPhotosForm.uploadAiPhotoTitle" />
                  </div>
                  <div className={css.aiSubHeading}>
                    <FormattedMessage id="EditListingPhotosForm.uploadAiPhotoDescription" />
                  </div>
                </div>
                <div className={css.selectFromAi}>
                  {listingCardUrls &&
                    listingCardUrls?.length &&
                    listingCardUrls?.map(img => {
                      return (
                        <div
                          onClick={() => setSelectedImageForAI(img)}
                          className={classNames(
                            css.aiUploadedCard,
                            selectedImageForAI === img && css.selectCard
                          )}
                        >
                          {/* selectedImageForAI == img ? */}
                          <img className={css.uploadedImage} src={img} alt="Uploaded" />
                        </div>
                      );
                    })}
                </div>
                <div className={css.imageMultiUploader}>
                  <div className={css.uploaderBox}>
                    <div className={css.uploadButton}>
                      <BrandIconCard type="uploadicon" />
                      upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading || beforeAiImage}
                      />
                    </div>
                    <div className={css.uploadImageHeading}>
                      <FormattedMessage id="EditListingPhotosForm.uploadImageHeading" />
                      </div>
                    <div className={css.imageFormat}>
                      <FormattedMessage id="EditListingPhotosForm.imageFormat" />
                    </div>
                  </div>
                  <div className={classNames(css.selectFromAi, beforeAiImage && css.beforeAiBox)}>
                    {beforeAiImage ? (
                      <div
                        className={classNames(
                          css.aiUploadedCard,
                          selectedImageForAI == beforeAiImage && css.selectCard
                        )}
                      >
                        <div onClick={() => setSelectedImageForAI(beforeAiImage)}>
                          <img className={css.uploadedImage} src={beforeAiImage} alt="Uploaded" />
                          <div onClick={handleRemoveImage} className={css.removeButton}>
                            <BrandIconCard type="imageclose" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {isUploading && !beforeAiImage ? (
                    <div className={css.notFoundGalley}>
                      <BrandIconCard type="blankImage" />
                    </div>
                  ) : null}
                </div>
              </div>
              {/* Prompts Card List */}
              <div className={css.uploadImageContainer}>
                <div className={css.uploadImageLabel}>
                  <div className={css.aiHeading}>
                    <FormattedMessage id="EditListingPhotosForm.suggesstions" />
                  </div>
                  <div className={css.aiSubHeading}>
                    <FormattedMessage id="EditListingPhotosForm.suggesstionsDescription" />
                  </div>
                </div>
                <div className={css.uploadedWrapper}>
                  <div>
                    {loadingPrompts && (
                      <div className={css.fetchingData}>
                        <span>
                          <FormattedMessage id="EditListingPhotosForm.fetchingPrompts" />
                        </span>
                      </div>
                    )}
                    {!loadingPrompts && (
                      <div className={css.promptList}>
                        {prompts?.map((prompt, idx) => (
                          <div className={css.promptBox}>
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPrompt(prompt?.prompt)}
                              className={
                                selectedPrompt === prompt?.prompt
                                  ? css.selectedPrompt
                                  : css.unSelectPrompt
                              }
                            >
                              {prompt?.title}
                            </button>
                            {/* <div className={css.tooltipText}>{prompt?.prompt}</div> */}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {imageUrl ? (
                    <div className={css.urlImage}>
                      <img className={css.uploadedImage} src={imageUrl} alt="Uploaded" />
                      <div onClick={removeAigeneratedImage} className={css.removeButton}>
                        <BrandIconCard type="imageclose" />
                      </div>
                    </div>
                  ) : (
                    <div className={css.noImageFound}>
                      <FormattedMessage id="EditListingPhotosForm.noImgageFound" />
                    </div>
                  )}
                </div>
                <div className={css.aiGeneratedData}>
                  <p className={css.aiGeneratedDataTitle}>
                    <FormattedMessage id="EditListingPhotosForm.aiGeneratedDataTitleNote" />
                  </p>  
                  <p className={css.aiGeneratedDataTitle}>
                     <FormattedMessage id="EditListingPhotosForm.aiGeneratedDataTitle" 
                     values={{number:numberOfAiImageCreation}}/>
                    {/* You can generate AI-enhanced images only 3 times throughout your entire journey
                    and you have used {numberOfAiImageCreation}. */}
                  </p>  
                  <Button
                    type="button"
                    className={css.createAiImageButton}
                    disabled={
                      selectedPrompt === null || !selectedImageForAI || numberOfAiImageCreation >= 3
                    }
                    onClick={() => onCreateAiImage()}
                  >
                    <BrandIconCard type="aiStarIcon" />
                    <FormattedMessage id="EditListingDetailsForm.generateAiListing.photos" />
                  </Button>
                </div>
              </div>
              {/* {imagesError ? <div className={css.arrayError}>{imagesError}</div> : null} */}
              {updateListingError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingPhotosForm.updateFailed" />
                </p>
              ) : null}
              <PublishListingError error={publishListingError} />
              <ShowListingsError error={showListingsError} />
              {isPublished ? null :
              <Button
                className={css.skipAiButton}
                type="button"
                // inProgress={submitInProgress}
                // ready={submitReady}
                onClick={() => {
                  const submitValues = {
                    ...form.getState().values,
                    imageUrl,
                  };
                  isPublished || !isStripeAccountConnected
                    ? handleSkip({ isSkipped: true })
                    : setOpenSubmitModal(true),
                    setIsSkipped(true);
                }}
              >
                skip
              </Button>}
              <div className={css.bottomButton}>
                <button type="button" className={css.backButton} onClick={() => prevButton()}>
                  <BrandIconCard type="back" />
                  <FormattedMessage id="EditListingWizard.back" />
                </button>
                <Button
                  type="button"
                  className={css.nextButton}
                  onClick={() => {
                    setShowPreview(true);
                  }}
                >
                  Next
                </Button>
                {/* <Button
                  type="button"
                  className={css.nextButton}
                  inProgress={submitInProgress}
                  ready={submitReady}
                  onClick={() => {
                    const submitValues = {
                      ...form.getState().values,
                      imageUrl,
                    };
                    isPublished || !isStripeAccountConnected 
                      ? handleSubmit(submitValues)
                      : setOpenSubmitModal(true);
                  }}
                >
                  Ready to Submit
                </Button> */}
              </div>
            </Form>
           
            <Modal
              className={css.previewListingModal}
              isOpen={showPreview}
              onClose={()=>setShowPreview(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            > 
              <EditListingPreview
                listing={listing}
                imageUrl={imageUrl ? imageUrl : beforeAiImage}
                isPublished={isPublished}
                isStripeAccountConnected={isStripeAccountConnected}
                onManageDisableScrolling={onManageDisableScrolling}
                handleSubmit={handleSubmit}
                setOpenSubmitModal={setOpenSubmitModal}
                form={form}
                setShowPreview={setShowPreview}
              />
            </Modal>
            <Modal
              className={css.stylingListingModal}
              isOpen={!!aiImageInProgress}
              onClose={!aiImageInProgress}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            >
              <div className={css.logoRound}>
                <video width="250" height="250" autoPlay loop muted playsInline preload="auto">
                  <source src={reduceReuseVideo} type="video/mp4" />
                </video>
              </div>
              <div>
                <h6>
                  <FormattedMessage id="EditListingPhotosForm.stylingListing" />
                </h6>
                <p>
                  <FormattedMessage id="EditListingPhotosForm.stylingListingDescription" />
                </p>
              </div>
            </Modal>
            <Modal
              className={css.listingAIModal}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            >
              <AIResponseData
              numberOfAiImageCreation={numberOfAiImageCreation}
                onCreateAiImage={onCreateAiImage}
                handleImageUpload={handleImageUpload}
                aiImage={aiImage}
                aiImageError={aiImageError}
                aiImageInProgress={aiImageInProgress}
                setIsModalOpen={setIsModalOpen}
                prompts={prompts} // Pass prompts array
                setSelectedPrompt={setSelectedPrompt} // Pass function to update selectedPrompt
              />
            </Modal>
            <Modal
              className={css.listingAIModal}
              isOpen={openSubmitModal}
              onClose={() => setOpenSubmitModal(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            >
              <div className={css.aiModal}>
                <div className={css.cheersImage}>
                  <img src={chire} />
                </div>
                <div className={css.addDesign}>
                  <FormattedMessage id="EditListingPhotosForm.addDesign" />
                </div>
                <div className={css.thanksMessage}>
                  <FormattedMessage id="EditListingPhotosForm.thanksMessage" />
                </div>
                <Button
                  type="button"
                  className={css.closeButton}
                  onClick={() => {
                    setOpenSubmitModal(false);
                    const submitValues = {
                      ...form.getState().values,
                      imageUrl,
                    }; 
                    isskipped ? handleSkip({ isSkipped: true }) : handleSubmit(submitValues);
                  }}
                >
                  <FormattedMessage id="EditListingPhotosForm.viewListing" />
                </Button>
              </div>
            </Modal>
          </>
        );
      }}
    />
  );
};

export default EditListingPhotosForm;
