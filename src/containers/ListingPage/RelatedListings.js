import React from 'react';
import PropTypes from 'prop-types';
import { ListingCard } from '../../components';
import css from './ListingPage.module.css';
import Loader from '../../components/Loader/Loader';
import Slider from 'react-slick';

const RelatedListings = props => {
  const {
    listings = [],
    onUpdateProfile,
    authorName,
    intl,
    currentUser,
    isMapVariant = true,
    inProgress,
    error,
    pagination,
  } = props;

  if (!listings?.length) return null;

  if (inProgress) return <Loader />;

  if (error) {
    return (
      <div className={css.relatedListingsContainer}>
        <div className={css.errorText}>
          {intl.formatMessage({ id: 'RelatedListings.somethingWentWrong' })}
        </div>
      </div>
    );
  }

  const settings = {
    infinite: false,
    autoplay: true,
    autoplaySpeed: 2000, // Adjust speed (ms)
    speed: 800, // Transition duration
    slidesToShow: 4,
    slidesToScroll: 1,
    cssEase: 'ease-in-out', // For smooth scroll effect
    arrows: false,
    dots: false,
    pauseOnHover: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className={css.relatedListingsContainer}>
      <h3 className={css.relatedHeading}>
        {intl.formatMessage({ id: 'RelatedListings.moreFrom' }, { authorName })}
      </h3>
      <div className={css.relatedListings}>
        <Slider {...settings}>
          {listings.map(listing => (
            <ListingCard
              key={listing.id.uuid}
              listing={listing}
              onUpdateProfile={onUpdateProfile}
              // renderSizes={cardRenderSizes(isMapVariant)}
              // setActiveListing={setActiveListing}
              currentUser={currentUser}
            />
          ))}
        </Slider>
      </div>
    </div>
  );
};

RelatedListings.propTypes = {
  listings: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default RelatedListings;
