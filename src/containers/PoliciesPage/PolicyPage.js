import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { H3, Page, NamedLink, LayoutSideNavigation } from '../../components';
import css from './PolicyPage.module.css';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

export const PolicyPage = props => {
  const intl = useIntl();
  const { scrollingDisabled } = props;

  const title = intl.formatMessage({ id: 'ContactDetailsPage.title' });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            {/* <UserNav currentPage="ContactDetailsPage" /> */}
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        currentPage="PolicyPage"
        helpCenterTab={true}
        isAccountSettingTab={true}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <div>
            <h4>Privacy Policy</h4>
            <p>
              We started blossoming like a flower shop online with the spirit of entrepreneurship.
              However, with the seed of motivation and innovation, we extended our hands into the
              business firmly and decided to enhance our gifting range to fruits, chocolates, cakes,
              luxury gifts, and more. Today, we are a dedicated enterprise that delivers flowers and
              gifts with professional service to various locations around the globe. With every
              order, we tend to execute the delivery as an assignment to grow and ensure exceptional
              service.
            </p>
          </div>

          <div>
            <h4>Terms & Conditions</h4>
            <p>
              We started blossoming like a flower shop online with the spirit of entrepreneurship.
              However, with the seed of motivation and innovation, we extended our hands into the
              business firmly and decided to enhance our gifting range to fruits, chocolates, cakes,
              luxury gifts, and more. Today, we are a dedicated enterprise that delivers flowers and
              gifts with professional service to various locations around the globe. With every
              order, we tend to execute the delivery as an assignment to grow and ensure exceptional
              service.
            </p>
          </div>
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

export default PolicyPage;
