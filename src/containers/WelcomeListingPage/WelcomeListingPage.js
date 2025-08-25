import React, { useState } from 'react';
import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  H3,
  Page,
  UserNav,
  LayoutSideNavigation,
  NamedLink,
  LayoutSingleColumn,
  Button,
  Modal,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import css from './WelcomeListingPage.module.css';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';
import { manageDisableScrolling } from '../../ducks/ui.duck';

export const WelcomeListingPage = props => {
  const intl = useIntl();
  const { scrollingDisabled } = props;

  const title = intl.formatMessage({ id: 'ContactDetailsPage.title' });
  // <NamedRedirect
  //         name="EditListingPage"
  //         params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }}
  //       />

  const draftId = '00000000-0000-0000-0000-000000000000';
  const draftSlug = 'draft';
  const [isComingSoon, setComingSoon] = useState(false);
  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
        className={css.layoutWrapper}
      >
        <div className={css.contentWrapper}>
          <div className={css.content}>
            <h3 className={css.heading}>
              <FormattedMessage id="WelcomeListingPage.heading" />
            </h3>
            <h4 className={css.subHeading}>
              <FormattedMessage id="WelcomeListingPage.Additionalheading" />
            </h4>
          </div>
          <div className={css.bottomBar}>
            <div className={css.stepCard}>
              <div className={css.headingWrapper}>
                <BrandIconCard type="upload" />
                <span className={css.stepInfo}>
                  <FormattedMessage id="WelcomeListingPage.step1" />
                </span>
              </div>
              <h3>
                <FormattedMessage id="WelcomeListingPage.snapUpload" />
              </h3>
              <p>
                <FormattedMessage id="WelcomeListingPage.snapUploadDetails" />
              </p>
            </div>
            <div className={css.stepCard}>
              <div className={css.headingWrapper}>
                <BrandIconCard type="ai_profile" />
                <span className={css.stepInfo}>
                  <FormattedMessage id="WelcomeListingPage.step2" />
                </span>
              </div>
              <h3>
                <FormattedMessage id="WelcomeListingPage.aiHeading" />
              </h3>
              <p>
                <FormattedMessage id="WelcomeListingPage.aiHeadingDetails" />
              </p>
            </div>
            <div className={css.stepCard}>
              <div className={css.headingWrapper}>
                <BrandIconCard type="megaphone" />
                <span className={css.stepInfo}>
                  <FormattedMessage id="WelcomeListingPage.step3" />
                </span>
              </div>
              <h3>
                <FormattedMessage id="WelcomeListingPage.step3Heading" />
              </h3>
              <p><FormattedMessage id="WelcomeListingPage.step3HeadingDetails" />
              </p>
            </div>
          </div>

        </div>
        <div className={css.buttonWrapper}>
          {/* <NamedLink
              name="BuildListingPage" >
              <Button
                rootClassName={css.nextButton}
              >
                <BrandIconCard type="leftarrow" />
                <FormattedMessage id="WelcomeListingPage.backButton" />
              </Button>
            </NamedLink> */}

          <NamedLink
              name="EditListingPage"
              params={{
                slug: draftSlug,
                id: draftId,
                type: 'new',
                tab: 'details',
                // custom: "ai"
              }}
              className={`${css.nextLink}`}
            >
              <Button>
                <FormattedMessage id='WelcomeListingPage.startListings' />
              </Button>
            </NamedLink> 
          {/* <Button type='button' onClick={() => setComingSoon(true)}>
            <FormattedMessage id='WelcomeListingPage.startListings' />
          </Button>

          <Modal
            id="WelcomeListingPage.comingSoon"
            contentClassName={css.comingSoon}
            isOpen={isComingSoon}
            onClose={() => setComingSoon(false)}
            onManageDisableScrolling={manageDisableScrolling}
          >
            <h1>Coming Soon</h1>
          </Modal> */}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default WelcomeListingPage;
