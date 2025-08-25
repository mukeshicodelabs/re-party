import React, { useEffect, useRef } from 'react';
import { Field, Form as FinalForm, useField } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { maxLength, required } from '../../../../util/validators';

// Import shared components
import {
  Button,
  Form,
  FieldCheckboxGroup,
  FieldTextInput,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingAdditionalForm.module.css';

import {
  composeValidators,
  autocompleteSearchRequired,
  autocompletePlaceSelected,
} from '../../../../util/validators';
import {
  categories,
  customizableAddons,
  deliveryOptions,
  deliveryRanges,
  staticAiTags,
  tagsType,
} from '../../../../util/constants';
import { FieldArray } from 'react-final-form-arrays';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';
import ListingImage from '../EditListingPhotosPanel/ListingImage';

const TITLE_MAX_LENGTH = 150;
const FieldListingImage = props => {
  const { name, intl, onRemoveImage, aspectWidth, aspectHeight, variantPrefix, image,heroImageId, onManageDisableScrolling } = props;
  return (
    <Field name={name}>
      {fieldProps => {
        const { input } = fieldProps;
        const image = input.value;
        const isHeroImage = heroImageId === (image?.id?.uuid||image?.id);
        return image ? (
          <ListingImage
            image={image}
            key={image?.id?.uuid || image?.id}
            className={isHeroImage ? css.newThumbnail:css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={() => onRemoveImage(image?.id)}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
            onManageDisableScrolling={onManageDisableScrolling}
          />
        ) : null;
      }}
    </Field>
  );
};
export const EditListingAdditionalForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        formId = 'EditListingAdditionalForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        config,
        listing,
        form,
        prevButton,
        listingImageConfig,
        onRemoveImage,
        onManageDisableScrolling
      } = formRenderProps;
   const { publicData } = listing?.attributes || {};
      useEffect(() => {
        if ((!publicData?.aiTags || publicData.aiTags.length === 0) && values?.tagsType !== 'keep_manual_tags') {
          form.change('tagsType', 'keep_manual_tags');
        }
      }, [publicData?.aiTags, values?.tagsType, form]);

      const { heroImageId } = listing?.attributes?.publicData || {};
      
      const prevCategoryRef = useRef();
      const prevTagsTypeRef = useRef();
      useEffect(() => {
        if (prevCategoryRef.current && prevCategoryRef.current !== values?.category) {
          // Reset the FieldArray when category changes
          form.change('selectedCategoryOptions', []);
        }
        prevCategoryRef.current = values.category;
      }, [values?.category, form]);

      // Reset tags when switching to keep_manual_tags
      useEffect(() => {
        if (
          prevTagsTypeRef.current &&
          prevTagsTypeRef.current !== values?.tagsType &&
          values?.tagsType === 'keep_manual_tags'
        ) {
          form.change('tags', []); // Clear tags when switching to manual tags
        }
        prevTagsTypeRef.current = values?.tagsType;
      }, [values?.tagsType, form]);
      const tagOptions =
        config?.listing?.listingFields?.find(item => item.key === 'tags')?.enumOptions || [];

      const {
        backdrop_decor: backdropsOptions = [],
        tabletop_centerpieces: tabletopCenterpiecesOptions = [],
        serveware: servewareOptions = [],
        party_tableware: partyTablewareOptions = [],
        bundles_kits: bundlesKitsOptions = [],
        Furniture_and_lounge: furnitureAndLoungeOption = [],
      } = Object.fromEntries(
        ['backdrop_decor', 'tabletop_centerpieces', 'serveware', 'party_tableware', 'bundles_kits','Furniture_and_lounge'].map(key => [
          key,
          config?.listing?.listingFields?.find(item => item.key === key)?.enumOptions || [],
        ])
      );
      const optionsMap = {
        backdrop_decor: backdropsOptions,
        tabletop_centerpieces: tabletopCenterpiecesOptions,
        serveware: servewareOptions,
        party_tableware: partyTablewareOptions,
        bundles_kits: bundlesKitsOptions,
        Furniture_and_lounge:furnitureAndLoungeOption
      };
      const selectedCategory = values.category;
      const selectedCategoryOptionsList = optionsMap[selectedCategory] || [];

      const intl = useIntl();
      // Note: outdated listings don't have listingType!
      // I.e. listings that are created with previous listing type setup.

      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titleRequired',
      });

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled =
        invalid ||
        disabled ||
        submitInProgress ||
        values?.tags?.length <= 0 ||
        (values?.category &&
          (!values?.selectedCategoryOptions || values?.selectedCategoryOptions?.length === 0));
      const { updateListingError, showListingsError, setStockError } = fetchErrors || {};
        const { aspectWidth = 1, aspectHeight = 1, variantPrefix } = listingImageConfig;
      return (
        <div className={css.formWrapper}>
          <Form onSubmit={handleSubmit} className={classes}>
            
            <div className={css.pricingWrapper}>
              <div className={css.panelBox} style={{}}>
                <div className={css.imagesFieldArray}>
                  <div className={css.imageHeading}>
                    <div className={css.imageText}>
                      <FormattedMessage id="EditListingAdditionalForm.UploadphotoLabel" />
                    </div>
                    <p className={css.sublabel}>
                      <FormattedMessage id="EditListingAdditionalForm.UploadphotoRequirement" />
                    </p>
                  </div>
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
                      {({ fields }) => {
                        const images = values.images || [];
                        const heroIndex = images.findIndex(
                          img => img?.id?.uuid === heroImageId || img?.imageId?.uuid === heroImageId
                        );
                        let orderedFieldNames = fields.map((name, idx) => name);
                        if (heroIndex > 0) {
                          const [heroField] = orderedFieldNames.splice(heroIndex, 1);
                          orderedFieldNames.unshift(heroField);
                        }
                        return orderedFieldNames.map((name, index) => (
                          <FieldListingImage
                            heroImageId={heroImageId}
                            key={name}
                            name={name}
                            onRemoveImage={imageId => {
                              fields.remove(fields.value.findIndex(img => (img?.id === imageId || img?.id?.uuid === imageId)));
                              onRemoveImage(imageId);
                            }}
                            intl={intl}
                            aspectWidth={aspectWidth}
                            aspectHeight={aspectHeight}
                            variantPrefix={variantPrefix}
                            onManageDisableScrolling={onManageDisableScrolling}
                          />
                        ));
                      }}
                    </FieldArray>
                  </div>
                </div>
              </div>
              <div className={css.textFieldWrapper}>
                <div className={css.imageHeading}>
                  <label className={css.imageText}>
                    <FormattedMessage id="EditListingDetailsForm.title" />
                  </label>
                  <p className={css.sublabel}>
                    <FormattedMessage id="EditListingDetailsForm.titleDetails" />
                  </p>
                </div>
                <FieldTextInput
                  id={`${formId}title`}
                  name="title"
                  className={css.inputBox}
                  type="text"
                  // label={intl.formatMessage({ id: 'EditListingDetailsForm.title' })}
                  placeholder={intl.formatMessage({
                    id: 'EditListingDetailsForm.titlePlaceholder',
                  })}
                  maxLength={TITLE_MAX_LENGTH}
                  autoFocus={autoFocus}
                />
              </div>

              <div className={css.textFieldWrapper}>
                <div className={css.imageHeading}>
                  <label className={css.imageText}>
                    <FormattedMessage id="EditListingDetailsForm.description" />
                  </label>
                  <p className={css.sublabel}>
                    <FormattedMessage id="EditListingDetailsForm.descriptionDetails" />
                  </p>
                   <p className={css.subscribelabel}>
                    <FormattedMessage id="EditListingDetailsForm.subdescriptionDetails" />
                  </p>
                </div>
                <FieldTextInput
                  id={`${formId}description`}
                  name="description"
                  className={css.inputBox}
                  type="textarea"
                  placeholder={intl.formatMessage({
                    id: 'EditListingDetailsForm.descriptionPlaceholder',
                  })}
                  // validate={required('This field is required')}
                />
              </div>
              <div className={css.pricingWrapper}>
              <div className={css.categoryWrapper}>
                <div className={css.header}>
                  <label>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectCategoryLabel" />
                  </label>
                  <p>
                    <FormattedMessage id="EditListingPricingAndStockForm.selectCategoryLabelDetails" />
                  </p>
                </div>

                <div className={css.selectCategory}>
                  <div className={`${css.gridRadioBoxWrapper} ${css.radioBoxWrapper}`}>
                    {categories.map(({ key, label }, index) => (
                      <Field
                        key={key}
                        type="radio"
                        name="category"
                        value={key}
                        // validate={required('This field is required')}
                      >
                        {({ input }) => (
                          <label htmlFor={`category.${key}`} className={css.radioBox}>
                            <div className={css.iconNlabel}>
                              <BrandIconCard
                                type={
                                  index == 0
                                    ? 'star'
                                    : index == 1
                                      ? 'partypopper'
                                      : index == 2
                                        ? 'star'
                                        : index == 3
                                          ? 'partypopper'
                                        : index == 4
                                          ? 'star'
                                          :index == 5
                                          ? 'partypopper'
                                          : ''
                                }
                              />
                              <span>{label}</span>
                            </div>
                            <input
                              {...input}
                              type="radio"
                              id={`category.${key}`}
                              className={css.hiddenInput}
                            />
                            <span className={css.radioBtn} />
                          </label>
                        )}
                      </Field>
                    ))}
                  </div>

                    {selectedCategoryOptionsList?.length > 0 && (
                      <div className={css.optionsOnRadioSelect}>
                        <div className={css.subCategoriesName}>Subcategories</div>
                        <FieldArray name="selectedCategoryOptions">
                          {({ fields }) => {
                            const {
                              input: { value: selectedOptions = [], onChange },
                            } = useField('selectedCategoryOptions', { subscription: { value: true } });

                            const handleCheckboxChange = (option) => (e) => {
                              const checked = e.target.checked;
                              let newOptions;
                              if (checked) {
                                newOptions = [...selectedOptions, option];
                              } else {
                                newOptions = selectedOptions.filter(o => o !== option);
                              }
                              onChange(newOptions);
                            };

                            return (
                              <div className={css.options}>
                                {selectedCategoryOptionsList.map(({ option, label }) => {
                                  const isChecked = selectedOptions.includes(option);
                                  return (
                                    <div key={option} className={css.checkboxLabel}>
                                      <div className={css.customCheckBox}>
                                        <input
                                          type="checkbox"
                                          value={option}
                                          checked={isChecked}
                                          onChange={handleCheckboxChange(option)}
                                    />
                                    <span className={css.checkmark} />
                                  </div>
                                  <p>{label}</p>
                                </div>
                              );
                            })}
                          </div>
                        );
                          }}
                      </FieldArray>
                    </div>
                  )}
                </div>
              </div>

            </div>
            <div className={`${css.categoryWrapper} ${css.lastWrapper}`}>
                <div className={css.header}>
                  <label className={css.tagsLabel}>
                    <FormattedMessage id="EditListingDetailsForm.tagsLabel" />
                  </label>
                  <p className={css.tagsSubLabel}>
                    <FormattedMessage id="EditListingDetailsForm.tagsLabelDetails" />
                  </p>
                </div>
                <div className={css.selectTagsType}>
                  <div
                    className={` ${css.customWidthSuppy} ${css.gridRadioBoxWrapper} ${css.radioBoxWrapper}`}
                  >
                    {tagsType?.map(type => {
                      const { option, label } = type;
                      const isDisabled = option === 'keep_ai_tags' && (!publicData?.aiTags || publicData.aiTags.length == 0);

                      return (
                        <Field
                          key={option}
                          type="radio"
                          name="tagsType"
                          value={option}
                        >
                          {({ input }) => (
                            <label htmlFor={`tagsType.${option}`} className={classNames(css.radioBox, { [css.disabled]: isDisabled })}>
                              <span>{label}</span>
                              <input
                                {...input}
                                type="radio"
                                id={`tagsType.${option}`}
                                disabled={isDisabled}
                                className={css.hiddenInput}
                              />
                              <span className={css.radioBtn} />
                            </label>
                          )}
                        </Field>
                      );
                    })}
                  </div>
                </div>
                <div>
                  {values?.tagsType === 'keep_ai_tags' && (
                    <div className={css.aiTags}>
                      <ul>
                        {publicData?.aiTags?.length > 0 &&
                          publicData.aiTags.map((tag, index) => (
                            <li key={index}>{tag.replace('#', '')}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  
                   {values?.tagsType=='keep_manual_tags' && <div className={css.tagCheck}>
                      <FieldCheckboxGroup
                        className={css.radioBox}
                        id="tags"
                        name="tags"
                        options={tagOptions.map(({ label, option }) => ({
                          key: option,
                          label,
                        }))}
                        // validate={required('This field is required')}
                      />
                    </div>}
                  </div>
                </div>

              <div className={css.bottomButton}>
                <button type="button" className={css.backButton} onClick={() => prevButton()}>
                  <BrandIconCard type="back" />
                  <FormattedMessage id="EditListingWizard.back" />
                </button>
                <Button
                  className={css.nextButton}
                  type="submit"
                  inProgress={submitInProgress}
                  // disabled={submitDisabled}
                  ready={submitReady}
                >
                  {saveActionMsg}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      );
    }}
  />
);

export default EditListingAdditionalForm;
