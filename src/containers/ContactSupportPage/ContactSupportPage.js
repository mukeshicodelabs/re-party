import { useIntl } from '../../util/reactIntl';
import { H3, Page, LayoutSideNavigation } from '../../components';
import css from './ContactSupportPage.module.css';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import BrandIconCard from '../../components/BrandIconCard/BrandIconCard';

export const ContactSupportPage = props => {
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
        currentPage="ContactSupportPage"
        helpCenterTab={true}
        footer={<FooterContainer />}
        isAccountSettingTab={true}
      >
        <div className={css.content}>
          <div className={css.mainWrapper}>
            <div className={css.contactContainer}>
              <div className={css.contactRow}>
                <div className={css.contactBox}>
                  <div className={css.iconCircle}>
                   <BrandIconCard type='contact'/>
                  </div>
                  <span>532875329, 832772983</span>
                </div>
                <div className={css.contactBox}>
                  <div className={css.iconCircle}>
                    
                  <BrandIconCard type='email'/>
                  </div>
                  <span>help@reparty.co</span>
                </div>
              </div>

              <div className={css.addressBox}>
                <div className={css.iconCircle}>
                <BrandIconCard type='address'/>

                </div>
                <span>123 Main Street Chicago, IL 60601 United States</span>
              </div>
            </div>

          </div>
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

export default ContactSupportPage;
