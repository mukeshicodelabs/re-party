import React, { Component } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { obfuscatedCoordinates } from '../../util/maps';
import { Heading, Map } from '../../components';

import css from './ListingPage.module.css';

/**
 * The SectionMapMaybe component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.latlng} [props.geolocation] - The geolocation
 * @param {propTypes.uuid} props.listingId - The listing id
 * @returns {JSX.Element} section map maybe component
 */
class SectionMapMaybe extends Component {
  constructor(props) {
    super(props);
    this.state = { isStatic: true };
  }

  render() {
    const { className, rootClassName, geolocation, publicData, listingId, mapsConfig } = this.props;

    if (!geolocation) {
      return null;
    }
    const { productType, rentDeliveryOptions = [], sellDeliveryOptions = [] } = publicData || {};

    const address = publicData && (publicData?.pickuplocation || publicData?.listingLocation)?.address;
    const classes = classNames(rootClassName || css.sectionMap, className);
    const cacheKey = listingId ? `${listingId.uuid}_${geolocation.lat}_${geolocation.lng}` : null;

    const mapProps = mapsConfig.fuzzy.enabled
      ? { obfuscatedCenter: obfuscatedCoordinates(geolocation, mapsConfig.fuzzy.offset, cacheKey) }
      : { address, center: geolocation };
    const map = <Map {...mapProps} useStaticMap={this.state.isStatic} />;

    return (
      <section className={classes} id="listing-location">
        <div className={css.mapHeading}>
          <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
            <FormattedMessage id="ListingPage.locationTitle" />
          </Heading>
          <p>
            {(() => {
              let messageId = '';
              if (productType === 'rent') {
                if (rentDeliveryOptions?.includes('pickup') && rentDeliveryOptions?.includes('shipping')) {
                  messageId = 'ListingPage.locationDescription';
                } else if (rentDeliveryOptions?.includes('pickup')) {
                  messageId = 'ListingPage.locationDescriptionpickup';
                } else {
                  messageId = 'ListingPage.locationDescriptiondelivery';
                }
              } else if (productType === 'sell') {
                if (sellDeliveryOptions?.includes('pickup') && sellDeliveryOptions?.includes('shipping')) {
                  messageId = 'ListingPage.locationDescriptionboth';
                } else if (sellDeliveryOptions?.includes('pickup')) {
                  messageId = 'ListingPage.locationDescriptionpickup';
                } else if (sellDeliveryOptions?.includes('shipping')) {
                  messageId = 'ListingPage.locationDescriptionShipping';
                }
              }
              return messageId ? (
                <FormattedMessage id={messageId} values={{ location: address }} />
              ) : null;
            })()}
          </p>
        </div>
        {this.state.isStatic ? (
          <button
            className={css.map}
            onClick={() => {
              this.setState({ isStatic: false });
            }}
          >
            {map}
          </button>
        ) : (
          <div className={css.map}>{map}</div>
        )}
      </section>
    );
  }
}

export default SectionMapMaybe;
