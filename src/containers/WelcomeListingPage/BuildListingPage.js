import React, { useState } from 'react';
import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { H3, Page, NamedLink, LayoutSingleColumn, Button } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import css from './BuildListingPage.module.css';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';

export const BuildListingPage = props => {
  const intl = useIntl();
  const { scrollingDisabled } = props;
  const [selectedOption, setSelectedOption] = useState('ai');

  const title = intl.formatMessage({ id: 'ContactDetailsPage.title' });
  const draftId = '00000000-0000-0000-0000-000000000000';
  const draftSlug = 'draft';

  const handleOptionSelect = option => {
    setSelectedOption(option);
  };

  const renderNextLink = () => {
    const isManual = selectedOption === 'manual';
    const linkProps = {
      name: isManual ? 'EditListingPage' : null,
      ...(isManual && {
        params: {
          slug: draftSlug,
          id: draftId,
          type: 'new',
          tab: 'details',
          custom: selectedOption,
        },
      }),
      className: `${css.nextLink} ${!selectedOption ? css.disabledLink : ''}`,
    };

    return (
      <NamedLink {...linkProps} className={css.nextButton}>
          <FormattedMessage id="WelcomeListingPage.NextButton" />
      </NamedLink>
    );
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
        className={css.layoutWrapper}
      >
        <div className={css.contentWrapper}>
          <div className={css.content}>
            <h3 className={css.mainHeading}>
              <FormattedMessage id="BuildListingPage.aiheading" />
            </h3>
            <h4 className={css.subHeading}>
              <FormattedMessage id="BuildListingPage.aiheadingDetails" />
            </h4>
          </div>

          <div className={css.radioOptions}>
            <label className={`${css.radioOption} ${selectedOption === 'ai' ? css.selected : ''}`}>
              <input
                type="radio"
                name="creationMethod"
                value="ai"
                checked={selectedOption === 'ai'}
                onChange={() => handleOptionSelect('ai')}
                className={css.radioInput}
              />
              <span className={css.customRadio}></span>
              <div className={css.radioContent}>
                <span className={css.optionIcon}>
                  <BrandIconCard type="ai_profile" />
                </span>
                <div className={css.cardHeading}>
                  <FormattedMessage id="WelcomeListingPage.Airedirection" />
                </div>
                <p className={css.cardDescription}>
                  <FormattedMessage id="WelcomeListingPage.AiredirectionDetail" />
                </p>
              </div>
            </label>

            {/* Manual Option */}
            <label
              className={`${css.radioOption} ${selectedOption === 'manual' ? css.selected : ''}`}
            >
              <input
                type="radio"
                name="creationMethod"
                value="manual"
                checked={selectedOption === 'manual'}
                onChange={() => handleOptionSelect('manual')}
                className={css.radioInput}
              />
              <span className={css.customRadio}></span>
              <div className={css.radioContent}>
                <span className={css.optionIcon}>
                  <BrandIconCard type="checklist" />
                </span>
                <div className={css.cardHeading}>
                  <FormattedMessage id="WelcomeListingPage.manualredirection" />
                </div>
                <p className={css.cardDescription}>
                  <FormattedMessage id="WelcomeListingPage.manualredirectionDetail" />
                </p>
              </div>
            </label>
          </div>
        </div>
        <div className={css.buttonWrapper}>
          {/* 
                        <NamedLink
                            name="WelcomeListingPage" >
                            <Button
                                rootClassName={css.nextButton}
                                disabled={!selectedOption}
                            >
                                <BrandIconCard type="leftarrow" />
                                <FormattedMessage id="WelcomeListingPage.backButton" />
                            </Button>
                        </NamedLink> */}
          {renderNextLink()}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default BuildListingPage;
