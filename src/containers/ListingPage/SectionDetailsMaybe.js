import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import { isFieldForListingType } from '../../util/fieldHelpers';

import { Heading } from '../../components';

import css from './ListingPage.module.css';
import { SELL_PRODUCT } from '../../util/types';
import { categories } from '../../util/constants';

const SectionDetailsMaybe = props => {
  const {
    publicData,
    metadata = {},
    listingFieldConfigs,
    isFieldForCategory,
    intl,
    config,
  } = props;

  const categoryConfig = config?.categoryConfiguration?.categories;

  const { listingFields } = config?.listing || {};
  const tagsConfig =
    listingFields
      .find(field => field.key === 'tags')
      ?.enumOptions?.map(({ label, option }) => ({
        label,
        option,
      })) || [];
  const colorsConfig =
    listingFields
      .find(field => field.key === 'select_color')
      ?.enumOptions?.map(({ label, option }) => ({
        label,
        option,
      })) || [];
  const eventTypeConfig =
    listingFields
      .find(field => field.key === 'event_type')
      ?.enumOptions?.map(({ label, option }) => ({
        label,
        option,
      })) || [];


  if (!publicData || !listingFieldConfigs) {
    return null;
  }

  const { listingType, tags = [], event_type = [], select_color = [] ,rentDeliveryOptions,productType ,sellDeliveryOptions} = publicData || {};

  const matchedLabels = tags?.map(tag => {
    const config = tagsConfig?.find(config => config.option === tag);
    return config ? config.label : tag;
  });

  const matchedColorsLabels = select_color?.map(color => {
    const config = colorsConfig?.find(config => config.option === color);
    return config ? config.label : color;
  });
  const matchedEventTypeLabels = event_type?.map(eventType => {
    const config = eventTypeConfig?.find(config => config.option === eventType);
    return config ? config.label : eventType;
  });

  const pickListingFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, showConfig = {} } = config;
    const listingType = publicData.listingType;
    const isTargetListingType = isFieldForListingType(listingType, config);
    const isTargetCategory = isFieldForCategory(config);

    const { isDetail, label } = showConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata[key];
    const value = typeof publicDataValue != null ? publicDataValue : metadataValue;

    if (isDetail && isTargetListingType && isTargetCategory && typeof value !== 'undefined') {
      const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
      const getBooleanMessage = value =>
        value
          ? intl.formatMessage({ id: 'SearchPage.detailYes' })
          : intl.formatMessage({ id: 'SearchPage.detailNo' });
      const optionConfig = findSelectedOption(value);

      return schemaType === 'enum'
        ? filteredConfigs.concat({ key, value: optionConfig?.label, label })
        : schemaType === 'boolean'
          ? filteredConfigs.concat({ key, value: getBooleanMessage(value), label })
          : schemaType === 'long'
            ? filteredConfigs.concat({ key, value, label })
            : filteredConfigs;
    }
    return filteredConfigs;
  };

  const existingListingFields = listingFieldConfigs.reduce(pickListingFields, []);

  // Priority order
  const priorityOrder = ['category', 'event_type', 'select_color', 'theme_style', 'tags'];

  const category = publicData?.category; // e.g., "diy_kits"

  // const matchedCategory = categoryConfig.find(cat => cat.id === selectedCategoryId)?.name;
  const matchedCategory = categories?.find(cat => cat.key === category)?.label;

  // Rearranged array
  const rearrangedListingFields = [
    ...priorityOrder
      .map(key => existingListingFields.find(item => item.key === key))
      .filter(Boolean),
    // Remaining items not in priority
    ...existingListingFields.filter(
      item => !priorityOrder.includes(item.key) && item.key != 'productType'
    ),
  ];

  return rearrangedListingFields.length > 0 ? (
    <section className={css.sectionDetails}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="ListingPage.detailsTitle" />
      </Heading>
      <ul className={css.details}>
        {listingType ? (
          <li key={'listingType'} className={css.detailsRow}>
            <span className={css.detailLabel}>
              {intl.formatMessage({ id: 'ListingPage.listingTypeLabel' })}
            </span>
            <span>
              {listingType === SELL_PRODUCT
                ? intl.formatMessage({ id: 'ListingPage.listingTypeForSale' })
                : intl.formatMessage({ id: 'ListingPage.listingTypeForRent' })}
            </span>
          </li>
        ) : null}
        <div className={css.categoryDetailsWrapper}>
          <div className={css.categoryWrapper}>
            {matchedCategory && (
              <li key="category">
                <div className={css.categoryHeading}>Category</div>
                <span className={css.categoryDetails}>{matchedCategory}</span>
              </li>
            )}

            {publicData?.selectedCategoryOptions?.length > 0 && (
              <li key="selectedCategoryOptions">
                <div className={css.categoryHeading}>Subcategories</div>
                <span className={css.categoryDetails}>
                  {(() => {
                    const selectedCategoryField = listingFields.find(
                      field => field.key === category
                    );

                    const matchedSubcategoryLabels = publicData.selectedCategoryOptions.map(
                      option => {
                        const match = selectedCategoryField?.enumOptions?.find(
                          enumItem => enumItem.option === option
                        );
                        return match ? match.label.trim() : option;
                      }
                    );

                    return matchedSubcategoryLabels?.join(', ');
                  })()}
                </span>
              </li>
            )}
          </div>
        </div>

        {/* {rearrangedListingFields.map(detail => {
          return (
            <li key={detail.key} className={css.detailsRow}>
              <span className={css.detailLabel}>{detail.label}</span>
              <span className={css.tagValue}>{detail.value}</span>
            </li>
          );
        })} */}
        {/* eventType */}
        <div className={css.tagCard}>
          <div className={css.detailLabel}>Event Type</div>
          <span className={css.valueName}>
            {matchedEventTypeLabels?.join(', ')}
          </span>
        </div>
        <div className={css.tagCard}>
          <div className={css.detailLabel}>Colors</div>
          <span className={css.valueName}>
            {matchedColorsLabels?.join(', ')}
          </span>
        </div>
        <div className={css.tagCard}>
          <div className={css.detailLabel}>Tags</div>
          <div className={css.tagCardItem}>
            {matchedLabels?.map(label => (
              <span key={label} className={css.tagValue}>{label.replace('#', '')}</span>
            ))}
          </div>
        </div>
        <div className={css.tagCard}>
          <div className={css.detailLabel}>Delivery Methods</div>
          <div className={css.tagCardItem}>
            {productType === 'rent'
              ? [...new Set(rentDeliveryOptions)]?.map(value => (
                <span key={value} className={css.tagValueLight}>
                  {value === 'pickup' ? 'Pickup' : 'Delivery'}
                </span>
              ))
              : (() => {
                const uniqueOptions = [...new Set(sellDeliveryOptions)];
                const hasShipping =
                  uniqueOptions.includes('shipping') ||
                  uniqueOptions.includes('customShipping');

                return uniqueOptions
                  .filter(v => v === 'pickup' || v === 'delivery') // only keep relevant
                  .map(value => (
                    <span key={value} className={css.tagValueLight}>
                      {value === 'pickup' ? 'Pickup' : 'Shipping'}
                    </span>
                  ))
                  .concat(
                    hasShipping
                      ? [
                        <span key="shipping" className={css.tagValueLight}>
                          Shipping
                        </span>,
                      ]
                      : []
                  );
              })()}
          </div>
        </div>
      </ul>
    </section>
  ) : null;
};

export default SectionDetailsMaybe;
