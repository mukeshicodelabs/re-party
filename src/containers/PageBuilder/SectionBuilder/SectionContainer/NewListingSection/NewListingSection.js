import React from 'react';
import classNames from 'classnames';
import css from './NewListingSection.module.css';
import feature1 from '../../../../../assets/images/feature-1.png';
import feature2 from '../../../../../assets/images/feature-2.png';
import feature3 from '../../../../../assets/images/feature-3.png';
import feature4 from '../../../../../assets/images/feature-4.png';
import feature6 from '../../../../../assets/images/feature-6.png';
import BrandIconCard from '../../../../../components/BrandIconCard/BrandIconCard';
import { NamedLink } from '../../../../../components';
import { createSlug } from '../../../../../util/urlHelpers';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';



const NewListingSection = props => {
  const {
    sectionId,
    options
  } = props;
  const history = useHistory();
  const getListings = options?.listings;

  return (
    <div className={css.listingWrapper}>
      <div className={css.listingRowGrid}>
        <div className={css.listingLeftSide}>
          <div className={css.listingHead}>
            <div className={css.listingHeading}>New Listings</div>
            <div className={css.viewListingButton}>
               <NamedLink name='ContractorSearchPage'>
                View Listings
                <BrandIconCard type="rightarrow" />
              </NamedLink>
            </div>
          </div>
          <div className={css.listingGrid} >
            {getListings?.slice(0, 4)?.map((item, i) => {
              const slug = createSlug(item?.attributes?.title);
              const id = item?.id?.uuid;
              
              return (
                <div className={css.collectionCard} onClick={
                  () => history.push(`/l/${slug}/${id}`)
                }>
                  <div className={css.featureImage}>
                    <img src={item.images[0]?.attributes?.variants['square-small']?.url}alt='feature-image' />
                  </div>
                  <div className={css.featureInfo}>
                    <div className={css.featureTitle}>{item?.attributes?.title}</div>
                    <div className={css.featurePrice}>${(item?.attributes?.price.amount)/100}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={css.listingRightSide}>
          <div className={css.saleText}>Less Waste. More Party.</div>
          <div className={css.editionText}> Because every party piece deserves an encore.</div>
           <NamedLink name='ContractorSearchPage'className={css.shopButton}>
          {/* <a href='#' className={css.shopButton}> */}
            Shop Now
            {/* </a> */}
            </NamedLink>
        </div>
      </div>
    </div>
  );
};

export default NewListingSection;
