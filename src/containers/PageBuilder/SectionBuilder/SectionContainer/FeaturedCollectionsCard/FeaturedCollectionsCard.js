import React from 'react';
import classNames from 'classnames';
import css from './FeaturedCollectionsCard.module.css';
import feature1 from '../../../../../assets/images/feature-1.png';
import feature2 from '../../../../../assets/images/feature-2.png';
import feature3 from '../../../../../assets/images/feature-3.png';
import feature4 from '../../../../../assets/images/feature-4.png';
import feature6 from '../../../../../assets/images/feature-6.png';
import { ListingCard, NamedLink } from '../../../../../components';
import { createSlug } from '../../../../../util/urlHelpers';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

const FeaturedCollectionsCard = props => {
  const {
    sectionId,
    options
  } = props;
  const history = useHistory();

  const getListings = options?.listings;
  const order = getListings
  ?.filter((item) => {
    const orderValue = item?.attributes?.publicData?.featureListingOrder;
    return (
      item?.attributes?.publicData?.isFeatured === true &&
      orderValue >= 1 &&
      orderValue <= 6
    );
  })
  ?.sort((a, b) => {
    const orderA = a?.attributes?.publicData?.featureListingOrder;
    const orderB = b?.attributes?.publicData?.featureListingOrder;
    return orderA - orderB;
  });

 
  const cardRenderSizes = isMapVariant => {
    if (isMapVariant) {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 767px) 100vw',
        `(max-width: 1023px) ${panelMediumWidth}vw`,
        `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
        `${panelLargeWidth / 3}vw`,
      ].join(', ');
    } else {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 549px) 100vw',
        '(max-width: 767px) 50vw',
        `(max-width: 1439px) 26vw`,
        `(max-width: 1920px) 18vw`,
        `14vw`,
      ].join(', ');
    }
  };

  return (
    <div>
      <div className={css.featuredCollectionWrapper}>
        {order?.map((item, i)=>{
          const slug = createSlug(item?.attributes?.title);
          const id = item?.id?.uuid;
          return(
            <div key={id} className={css.collectionCard} onClick={
             ()=> history.push(`/l/${slug}/${id}`)
            }>
              <div className={css.featureImage}>
                <img src={item.images[0]?.attributes?.variants['square-small']?.url} 
                alt='feature-image'/>
              </div>
              <div className={css.featureInfo}>
                <div className={css.featureTitle}>{item?.attributes?.title}</div>
                <div className={css.featurePrice}>${(item?.attributes?.price.amount)/100}</div>
              </div>
            </div>
          )
        })}
        
      </div>
      <div className={css.viewListing}>
        <NamedLink name='ContractorSearchPageWithFeatured' params={{featured:"featured"}}>
        <button>View All Listings</button>
        </NamedLink>
      </div>
    </div>
  );
};

export default FeaturedCollectionsCard;
