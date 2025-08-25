import React, { useEffect, useState } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { isValidCurrencyForTransactionProcess } from '../../../../util/fieldHelpers';
import { composeValidators, nonEmptyArray } from '../../../../util/validators';

// Import shared components
import { Form, Button, AspectRatioWrapper, Modal, NamedLink } from '../../../../components';
// Import modules from this directory
import css from './EditListingDetailsForm.module.css';
import { isUploadImageOverLimitError } from '../../../../util/errors';
import { isEqual, set } from 'lodash';
import ListingImage from '../EditListingPhotosPanel/ListingImage';
import { FieldArray } from 'react-final-form-arrays';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';
import roundLogo from '../../../../assets/images/round-logo.svg';
import Swal from 'sweetalert2';
import reduceReuseVideo from '../../../../assets/images/reduce-reuse.mp4';

const ACCEPT_IMAGES = 'image/*';

// Show various error messages
const ErrorMessage = props => {
  const { fetchErrors } = props;
  const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
  const errorMessage = updateListingError ? (
    <FormattedMessage id="EditListingDetailsForm.updateFailed" />
  ) : createListingDraftError ? (
    <FormattedMessage id="EditListingDetailsForm.createListingDraftError" />
  ) : showListingsError ? (
    <FormattedMessage id="EditListingDetailsForm.showListingFailed" />
  ) : null;

  if (errorMessage) {
    return <p className={css.error}>{errorMessage}</p>;
  }
  return null;
};

// Field component that uses file-input to allow user to select images.
export const FieldAddImage = props => {
  const {
    formApi,
    onImageUploadHandler,
    heroImageId,
    setHeroImageId,
    aspectWidth = 1,
    aspectHeight = 1,
    ...rest
  } = props;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label, disabled: fieldDisabled } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const fileArray = Array.from(e.target.files);
          fileArray.forEach(async (file, index) => {
            formApi.change(`addImage`, file);
            formApi.blur(`addImage`);
            await onImageUploadHandler(file);
          });
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addImageWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {fieldDisabled ? null : (
                <input {...inputProps} className={css.addImageInput} multiple />
              )}
              <label htmlFor={name} className={css.addImage}>
                {label}
              </label>
            </AspectRatioWrapper>
            <div className={css.checkImage}></div>
          </div>
        );
      }}
    </Field>
  );
};

// Component that shows listing images from "images" field array
const FieldListingImage = props => {
  const {
    name,
    intl,
    onRemoveImage,
    aspectWidth,
    setHeroImageId,
    heroImageId,
    aspectHeight,
    variantPrefix,
    image,
    onManageDisableScrolling
  } = props;
  return (
    <Field name={name}>
      {fieldProps => {
        const { input } = fieldProps;
        const image = input.value;
        return image ? (
          <ListingImage
            image={image}
            key={image?.id?.uuid || image?.id}
            className={css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={() => onRemoveImage(image?.id)}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
            heroImageId={heroImageId}
            setHeroImageId={setHeroImageId}
            showcheckbox={true}
            onManageDisableScrolling={onManageDisableScrolling}
          />
        ) : null;
      }}
    </Field>
  );
};

const EditListingDetailsForm = props => {
  const { uploadedVideo, setUploadedVideo } = props;
  const [state, setState] = useState({ imageUploadRequested: false });
  const [submittedImages, setSubmittedImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ailistingCreationErorModal, setAilistingCreationErorModal] = useState(false);

  const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const [progress, setProgress] = useState({
    title: 0,
    description: 0,
    tags: 0,
    category: 0,
    fullDetails: 0,
  });

  const onImageUploadHandler = (file, isAiPage = false) => {
    const { listingImageConfig, onImageUpload } = props;
    if (file) {
      setState({ imageUploadRequested: true });

      return onImageUpload({ id: `${file.name}_${Date.now()}`, file, isAiPage }, listingImageConfig)
        .then(imageId => {
          setState({ imageUploadRequested: false });
          return imageId;
        })
        .catch(() => {
          setState({ imageUploadRequested: false });
        });
    }
  };

  // useEffect(() => {
  //   let isCancelled = false;

  //   const animateBar = (key) => {
  //     return new Promise(resolve => {
  //       let value = 0;
  //       const step = 10;
  //       const duration = 1000;
  //       const intervalTime = duration / (100 / step);

  //       const interval = setInterval(() => {
  //         value += step;
  //         setProgress(prev => ({ ...prev, [key]: Math.min(value, 100) }));
  //         if (value >= 100 || isCancelled) {
  //           clearInterval(interval);
  //           resolve();
  //         }
  //       }, intervalTime);
  //     });
  //   };

  //   const runSequence = async () => {
  //     if (isModalOpen) {
  //       setProgress({
  //         title: 0,
  //         description: 0,
  //         tags: 0,
  //         category: 0,
  //         fullDetails: 0,
  //       });
  //       await animateBar('title');
  //       await animateBar('description');
  //       await animateBar('tags');
  //       await animateBar('category');
  //       await animateBar('fullDetails');
  //     }
  //   };

  //   runSequence();

  //   return () => {
  //     isCancelled = true;
  //   };
  // }, [isModalOpen]);
  useEffect(() => {
    let isCancelled = false;

    const animateBar = key => {
      return new Promise(resolve => {
        let value = 0;
        const step = 10; // 10 steps to reach 100% in 1 second
        const intervalTime = 100; // 100ms per step, so 10 steps = 1000ms

        const interval = setInterval(() => {
          if (isCancelled) {
            clearInterval(interval);
            resolve();
            return;
          }
          value += step;
          setProgress(prev => ({ ...prev, [key]: Math.min(value, 100) }));
          if (value >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, intervalTime);
      });
    };

    const animateFullDetails = () => {
      return new Promise(resolve => {
        let value = 0;
        const step = 5; // Slower increment to show ongoing progress
        const intervalTime = 100;

        const interval = setInterval(() => {
          if (isCancelled) {
            clearInterval(interval);
            resolve();
            return;
          }
          value += step;
          setProgress(prev => ({ ...prev, fullDetails: Math.min(value, 90) })); // Cap at 90%
          if (value >= 90) {
            clearInterval(interval);
            // Don't resolve, keep it running until response
          }
        }, intervalTime);
      });
    };

    const runSequence = async () => {
      if (isModalOpen) {
        // Reset progress
        setProgress({
          title: 0,
          description: 0,
          tags: 0,
          category: 0,
          fullDetails: 0,
        });

        // Animate bars sequentially, 1 second each
        await animateBar('title');
        if (!isCancelled) await animateBar('description');
        if (!isCancelled) await animateBar('tags');
        if (!isCancelled) await animateBar('category');
        if (!isCancelled) await animateFullDetails();
      }
    };

    runSequence();

    return () => {
      isCancelled = true;
    };
  }, [isModalOpen]);
  const completeFullDetailsProgress = () => {
    setProgress(prev => ({ ...prev, fullDetails: 100 }));
  };

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      keepDirtyOnReinitialize={true}
      render={formRenderProps => {
        const {
          autoFocus,
          className,
          disabled,
          ready,
          formId = 'EditListingDetailsForm',
          setUsedAiFortitle,
          usedAiFortitle,
          form: formApi,
          handleSubmit,
          invalid,
          pristine,
          marketplaceCurrency,
          marketplaceName,
          saveActionMsg,
          updated,
          updateInProgress,
          fetchErrors,
          listingFieldsConfig = [],
          listingCurrency,
          values,
          onRemoveImage,
          listingImageConfig,
          form,
          initialValues,
          onGetAiListingCreationData,
          aiData,
          aiDataError,
          aiDataInProgress,
          onManageDisableScrolling,
          listing,
          heroImageId,
          setHeroImageId,
          uploadImageInProgress,
        } = formRenderProps;
        const intl = useIntl();
        const images = values.images;
        const { aspectWidth = 1, aspectHeight = 1, variantPrefix } = listingImageConfig;
        // imgs can contain added images (with temp ids) and submitted images with uniq ids.
        const arrayOfImgIds = imgs =>
          imgs?.map(i => (typeof i?.id === 'string' ? i?.imageId : i?.id));
        const imageIdsFromProps = arrayOfImgIds(images);
        const imageIdsFromPreviousSubmit = arrayOfImgIds(submittedImages);
        const imageArrayHasSameImages = isEqual(imageIdsFromProps, imageIdsFromPreviousSubmit);
        const submittedOnce = submittedImages.length > 0;
        const pristineSinceLastSubmit = submittedOnce && imageArrayHasSameImages;
        const { uploadImageError } = fetchErrors || {};
        const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);
        const { listingType, transactionProcessAlias, unitType } = values;

        const currencyToCheck = listingCurrency || marketplaceCurrency;
        const isCompatibleCurrency = isValidCurrencyForTransactionProcess(
          transactionProcessAlias,
          currencyToCheck
        );
        const classes = classNames(css.root, className);
        const submitReady = (updated && pristine) || ready;
        const submitInProgress = updateInProgress;
        const hasMandatoryListingTypeData = listingType && transactionProcessAlias && unitType;
        const submitDisabled =
          invalid ||
          disabled ||
          submitInProgress ||
          !values.listingType ||
          values?.images?.length <= 0;
        // values?.refineImage?.length <= 0;
        // ||state?.imageUploadRequested
        // !hasMandatoryListingTypeData ||
        // !isCompatibleCurrency;

        // Function to upload Video to Cloudinary
        const uploadImageToCloudinary = async file => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', UPLOAD_PRESET);
          try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            return data.secure_url;
          } catch (err) {
            console.error('Upload failed:', err, err.message);
            setIsUploading(false);
            Swal.fire({
              icon: 'error',
              title: 'Upload Failed',
              text: `Failed to upload video: ${err.message}`,
              confirmButtonText: 'OK',
            });
            throw err;
            return null;
          }
        };
        const handleImageUpload = async e => {
          const file = e.target.files[0];
          if (file) {
            setIsUploading(true);
            const url = await uploadImageToCloudinary(file);
            setUploadedVideo(url);
            setIsUploading(false);
          }
        };
        const onCreateListing = async (isAicreation = false) => {
          if (
            usedAiFortitle >= 3 ||
            listing?.attributes?.publicData?.heroImageId == heroImageId ||
            isAicreation
          ) {
            formApi.submit();
          } else {
            setUsedAiFortitle(pr => pr + 1);
            setIsModalOpen(true);
            const heroImage = values?.images?.find(
              image => image?.imageId?.uuid === heroImageId || image?.id?.uuid === heroImageId
            );
            const data = {
              images: heroImage ? [heroImage.attributes?.variants?.['listing-card']?.url] : [],
            };
            try {
              const response = await onGetAiListingCreationData(data, heroImageId);
              if (response) {
                completeFullDetailsProgress();
                formApi.change('title', response?.data?.seoData?.content?.title);
                formApi.change('description', response?.data?.seoData?.content?.description);
                formApi.change('aiTags', response?.data?.hashtags?.hashtags);
                formApi.change('category', response?.data?.categoriesData?.category);
                formApi.submit();
              } else {
                setIsModalOpen(false);
                setAilistingCreationErorModal(true);
              }
            } catch (error) {
              setIsModalOpen(false);
              setProgress({
                title: 0,
                description: 0,
                tags: 0,
                category: 0,
                fullDetails: 0,
              });
            }
          }
        };

        return (
          <>
            <Form
              className={classes}
              onSubmit={e => {
                setSubmittedImages(images);
                handleSubmit(e);
              }}
            >
              <ErrorMessage fetchErrors={fetchErrors} />
              <div>
                <div className={css.heading}>
                  <FormattedMessage id="EditListingDetailsForm.formTittle" />
                  <BrandIconCard type="ai_star" />
                </div>
                <div className={css.subHeading}>
                  <FormattedMessage id="EditListingDetailsForm.AdditionalFormTittle" />
                </div>
              </div>
              <div className={css.informationWrapper}>
                <div>
                  <BrandIconCard type="infoGreen" />
                </div>
                <div>
                  <div className={css.informationText}>
                    <FormattedMessage id="EditListingDetailsForm.AdditionalFormInformationTittle" />
                  </div>
                  <div className={css.informationSubText}>
                    <FormattedMessage id="EditListingDetailsForm.AdditionalFormInformationDescription" />            
                  </div>
                  <div className={css.informationSubText}>
                     <FormattedMessage id="EditListingDetailsForm.AdditionalFormInformationDescriptionAdditinal" />
                  </div>
                </div>
              </div>
              <div className={css.panelBox}>
                <div className={css.repartyWorkHeading}>
                  <FormattedMessage id="EditListingDetailsForm.repartyWork" />
                </div>
                <div className={css.bottomBar}>
                  <div className={css.stepCard}>
                    <div className={css.headingWrapper}>
                      <BrandIconCard type="upload" />
                      {/* <span className={css.stepInfo}>
                        <FormattedMessage id="WelcomeListingPage.step1" />
                      </span> */}
                    </div>
                    <div>
                      <h3>
                        <FormattedMessage id="WelcomeListingPage.snapUpload" />
                      </h3>
                      <p>
                        <FormattedMessage id="WelcomeListingPage.snapUploadDetails" />
                      </p>
                    </div>
                  </div>
                  <div className={css.stepCard}>
                    <div className={css.headingWrapper}>
                      <BrandIconCard type="ai_profile" />
                      {/* <span className={css.stepInfo}>
                        <FormattedMessage id="WelcomeListingPage.step2" />
                      </span> */}
                    </div>
                    <div>
                      <h3>
                        <FormattedMessage id="WelcomeListingPage.aiHeading" />
                      </h3>
                      <p>
                        <FormattedMessage id="WelcomeListingPage.aiHeadingDetails" />
                      </p>
                    </div>
                  </div>
                  <div className={css.stepCard}>
                    <div className={css.headingWrapper}>
                      <BrandIconCard type="megaphone" />
                      {/* <span className={css.stepInfo}>
                        <FormattedMessage id="WelcomeListingPage.step3" />
                      </span> */}
                    </div>
                    <div>
                      <h3>
                        <FormattedMessage id="WelcomeListingPage.step3Heading" />
                      </h3>
                      <p>
                        <FormattedMessage id="WelcomeListingPage.step3HeadingDetails" />
                      </p>
                    </div>
                  </div>
                </div>
                <div className={css.imagesFieldArray}>
                  <div className={css.imageHeading}>
                    <div className={css.imageText}>
                      <FormattedMessage id="EditListingDetailsForm.UploadphotoLabel" />
                    </div>
                    <p className={css.sublabel}>
                      <FormattedMessage id="EditListingDetailsForm.UploadphotoRequirement" />
                    </p>
                  </div>
                  <FieldAddImage
                    id="addImage"
                    name="addImage"
                    accept={ACCEPT_IMAGES}
                    label={
                      <span className={css.chooseImageText}>
                        <div className={css.uploadText}>
                          <BrandIconCard type="uploadicon" />
                          <FormattedMessage id="EditListingDetailsForm.upload" />
                        </div>
                        <span className={css.chooseImage}>
                          <FormattedMessage id="EditListingPhotosForm.chooseImage" />
                        </span>
                        <span className={css.imageTypes}>
                          <FormattedMessage id="EditListingPhotosForm.imageTypes" />
                        </span>
                      </span>
                    }
                    type="file"
                    disabled={values?.images?.length === 10}
                    formApi={form}
                    onImageUploadHandler={onImageUploadHandler}
                    aspectWidth={aspectWidth}
                    aspectHeight={aspectHeight}
                    heroImageId={heroImageId}
                    setHeroImageId={setHeroImageId}
                  />
                  {values?.images?.length > 0 ? (
                    <div className={css.imageGrid}>
                      <FieldArray
                        name="images"
                        // validate={composeValidators(
                        //   nonEmptyArray(
                        //     intl.formatMessage({
                        //       id: 'EditListingPhotosForm.imageRequired',
                        //     })
                        //   )
                        // )}
                      >
                        {({ fields }) =>
                          fields.map((name, index) => (
                            <FieldListingImage
                              key={name}
                              name={name}
                              onRemoveImage={imageId => {
                                fields.remove(index);
                                onRemoveImage(imageId);
                              }}
                              intl={intl}
                              aspectWidth={aspectWidth}
                              aspectHeight={aspectHeight}
                              variantPrefix={variantPrefix}
                              setHeroImageId={setHeroImageId}
                              heroImageId={heroImageId}
                              onManageDisableScrolling={onManageDisableScrolling}
                            />
                          ))
                        }
                      </FieldArray>
                    </div>
                  ) : null}
                </div>

                <div className={css.instructionMessage}>
                  <FormattedMessage id="EditListingDetailsForm.uploadInstruction" />
                </div>
                <div className={css.imagesFieldArray}>
                  <div className={css.imagesFieldArray}>
                    <div className={css.imageHeading}>
                      <div className={css.imageText}>
                        <FormattedMessage id="EditListingDetailsForm.videoTextupload" />
                        </div>
                      <p className={css.sublabel}>
                        <FormattedMessage id="EditListingDetailsForm.videoTextuploadsublabel" />     
                      </p>
                    </div>
                    <div className={css.videoUploadWrapper}>
                      <input
                        type="file"
                        accept="video/*"
                        id="videoUpload"
                        name="videoUpload"
                        onChange={handleImageUpload}
                        disabled={isUploading || uploadedVideo}
                      />
                      <div className={css.blankUploadBox}>
                        <div className={css.uploadVideo}>
                          <BrandIconCard type="uploadvideo" />
                          upload
                        </div>
                        <div className={css.videoHere}>
                          <p className={css.sublabel}>
                            <FormattedMessage id="EditListingDetailsForm.videoHerelabel" />
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={css.videoGrid}>
                      {isUploading && !uploadedVideo ? (
                        <div className={css.notFoundGalley}>
                          <BrandIconCard type="blankvideo" />
                        </div>
                      ) : null}
                      {uploadedVideo ? (
                        <div className={css.videoGalley}>
                          {uploadedVideo && (
                            <button
                              type="button"
                              className={css.removeVideoButton}
                              onClick={() => {
                                setUploadedVideo('');
                                const fileInput = document.getElementById('videoUpload');
                                if (fileInput) {
                                  fileInput.value = '';
                                }
                              }}
                              disabled={!uploadedVideo}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z"
                                  fill="white"
                                />
                                <path
                                  d="M13 7L7 13"
                                  stroke="#222222"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                                <path
                                  d="M7 7L13 13"
                                  stroke="#222222"
                                  stroke-width="1.5"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                          <video
                            className={css.videoUploaded}
                            width="250"
                            height="250"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                          >
                            <source src={uploadedVideo} type="video/mp4" />
                          </video>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className={css.bottomButton}>
                <Button
                  type="button"
                  className={css.aiSubmitButton}
                  // disabled={values?.images?.length <= 0}
                  disabled={uploadImageInProgress}
                  onClick={() => {
                    const isHeroIagethere = values?.images?.some(
                      image =>
                        image?.id?.uuid === heroImageId || image?.imageId?.uuid === heroImageId
                    );
                    if (!values?.images || values.images.length === 0) {
                      Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        text: 'Please upload at least one image to proceed',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: toast => {
                          const progressBar = toast.querySelector('.swal2-timer-progress-bar');
                          if (progressBar) {
                            progressBar.style.backgroundColor = 'red';
                          }
                        },
                      });
                      return;
                    }
                    if (!heroImageId || !isHeroIagethere) {
                      Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        text: 'Please select a primary image to proceed',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: toast => {
                          const progressBar = toast.querySelector('.swal2-timer-progress-bar');
                          if (progressBar) {
                            progressBar.style.backgroundColor = 'red';
                          }
                        },
                      });
                      return;
                    }

                    onCreateListing(); // Only called if image validation passes
                  }}
                >
                  Next
                </Button>
              </div>
            </Form>
            <Modal
              className={css.stylingListingModal}
              isOpen={ailistingCreationErorModal}
              onClose={() => setAilistingCreationErorModal(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            >
              <h6 className={css.modalTitle}>
                 <FormattedMessage id="EditListingDetailsForm.informationHeading" />
                </h6>

              <h6 className={css.modalTitleDetails}>
                 <FormattedMessage id="EditListingDetailsForm.ApiUnavailable" />
              </h6>

              <div className={css.btnContainer}>
                <Button type="submit" onClick={() => onCreateListing(true)}>
                  {' '}
                  <FormattedMessage id="EditListingDetailsForm.createListing" />
                </Button>
                <Button type="submit" onClick={() => setAilistingCreationErorModal(false)}>
                  {' '}
                  <FormattedMessage id="EditListingDetailsForm.waitListing" />
                </Button>
              </div>
            </Modal>
            <Modal
              className={css.stylingListingModal}
              isOpen={!!aiDataInProgress || isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onManageDisableScrolling={onManageDisableScrolling}
              usePortal
            >
              <h6>
                <FormattedMessage id="EditListingDetailsForm.stylingListing" />
              </h6>
              <p>
                <FormattedMessage id="EditListingDetailsForm.stylingListingDescription" />
              </p>
              {/* <div className={css.logoRound}>
                <img src={roundLogo} alt="logo" />
              </div> */}
              <div className={css.logoRound}>
                <video width="250" height="250" autoPlay loop muted playsInline preload="auto">
                  <source src={reduceReuseVideo} type="video/mp4" />
                </video>
              </div>
              <div>
                <div className={css.progressBars}>
                  <div className={css.progressCard}>
                    <div className={css.progressCardHeader}>
                      <div className={css.progressLabel}>Generating Title</div>
                      {progress.title === 100 ? (
                        <span className={css.checkmark}>
                          <BrandIconCard type="greencheck" />
                        </span>
                      ) : (
                        <div className={css.progressPercentage}>{progress.title}%</div>
                      )}
                    </div>
                    <div className={css.progressBar}>
                      <div
                        className={css.progressFill}
                        style={{
                          width: `${progress.title}%`,
                          backgroundColor: progress.title === 100 ? '#C4984D' : '#000',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className={css.progressCard}>
                    <div className={css.progressCardHeader}>
                      <div className={css.progressLabel}>Generating Description</div>
                      {progress.description === 100 ? (
                        <span className={css.checkmark}>
                          <BrandIconCard type="greencheck" />
                        </span>
                      ) : (
                        <div className={css.progressPercentage}>{progress.description}%</div>
                      )}
                    </div>
                    <div className={css.progressBar}>
                      <div
                        className={css.progressFill}
                        style={{
                          width: `${progress.description}%`,
                          backgroundColor: progress.description === 100 ? '#C4984D' : '#000',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className={css.progressCard}>
                    <div className={css.progressCardHeader}>
                      <div className={css.progressLabel}>Adding Tags</div>
                      {progress.tags === 100 ? (
                        <span className={css.checkmark}>
                          <BrandIconCard type="greencheck" />
                        </span>
                      ) : (
                        <div className={css.progressPercentage}>{progress.tags}%</div>
                      )}
                    </div>
                    <div className={css.progressBar}>
                      <div
                        className={css.progressFill}
                        style={{
                          width: `${progress.tags}%`,
                          backgroundColor: progress.tags === 100 ? '#C4984D' : '#000',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className={css.progressCard}>
                    <div className={css.progressCardHeader}>
                      <div className={css.progressLabel}>Adding Categories</div>
                      {progress.category === 100 ? (
                        <span className={css.checkmark}>
                          <BrandIconCard type="greencheck" />
                        </span>
                      ) : (
                        <div className={css.progressPercentage}>{progress.category}%</div>
                      )}
                    </div>
                    <div className={css.progressBar}>
                      <div
                        className={css.progressFill}
                        style={{
                          width: `${progress.category}%`,
                          backgroundColor: progress.category === 100 ? '#C4984D' : '#000',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className={css.progressCard}>
                    <div className={css.progressCardHeader}>
                      <div className={css.progressLabel}>Finishing Touches</div>
                      {progress.fullDetails === 100 ? (
                        <span className={css.checkmark}>
                          <BrandIconCard type="greencheck" />
                        </span>
                      ) : (
                        <div className={css.progressPercentage}>{progress.fullDetails}%</div>
                      )}
                    </div>
                    <div className={css.progressBar}>
                      <div
                        className={css.progressFill}
                        style={{
                          width: `${progress.fullDetails}%`,
                          backgroundColor: progress.fullDetails === 100 ? '#C4984D' : '#000',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal>
          </>
        );
      }}
    />
  );
};

export default EditListingDetailsForm;
