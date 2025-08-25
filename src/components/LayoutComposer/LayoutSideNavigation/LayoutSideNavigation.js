import { bool, node, string } from 'prop-types';
import classNames from 'classnames';
import LayoutComposer from '../LayoutComposer';
import css from './LayoutSideNavigation.module.css';
import LayoutWrapperSideTab from './LayoutWrapperSideTab/LayoutWrapperSideTab';
import LayoutSinglePageTabs from './ProfileSettingPageTabs/ProfileSettingPageTabs';
// import PaymentStateTab from './PaymentStateTab/PaymentStateTab';
import WelcomeMessage from '../../WelcomeMessage/WelcomeMessage';
import HelpCenterPageTabs from './HelpCenterPageTabs/HelpCenterPageTabs';
import InboxPageTab from './InboxTab/InboxTab';
import OutfitListingStateTab from './OutfitListingStateTab/OutfitListingStateTab';
import { FormattedMessage } from 'react-intl';
import PaymentStateTab from './PaymentStateTab/PaymentStateTab';
import MyPurchasesPageTabs from './MyPurchasesPageTabs/MyPurchasesPageTabs';


/**
 * Commonly used layout
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.containerClassName overwrite components own css.container
 * @param {string?} props.mainColumnClassName add more style rules in addition to css.main
 * @param {string?} props.sideNavClassName add more style rules in addition to css.sideNav
 * @param {ReactNode} props.children
 * @param {ReactNode} props.topbar
 * @param {ReactNode?} props.sideNav
 * @param {ReactNode?} props.footer
 * @param {boolean?} props.useAccountSettingsNav
 * @param {string?} props.currentPage
 * @returns {JSX.Element} LayoutComposer that expects children to be a function.
 */
const LayoutSideNavigation = props => {
  const {
    className,
    rootClassName,
    containerClassName,
    mainColumnClassName,
    sideNavClassName,
    children,
    topbar: topbarContent,
    footer: footerContent,
    sideNav: sideNavContent,
    useAccountSettingsNav,
    currentPage,
    profilePageTab,
    outfitPage,
    inboxPageTab,
    sideBarButtons,
    tabType,
    onLogout,
    listingTab,
    paymentMethods,
    outfitTab,
    validTab,
    profilePageFullView,
    paymentSideNavIcon,
    payoutSideNavIcon,
    paymentTabs,
    helpCenterTab,
    isAccountSettingTab,
    ...rest
  } = props;
  
  const classes = classNames(rootClassName || css.root, className);
  const containerClasses = containerClassName || css.container;

  // TODO: since responsiveAreas are still experimental,
  //       we don't separate "aside" through layoutComposer
  const layoutAreas = `
    topbar
    main
    footer
  `;
  const titleText =
    currentPage == 'InboxPage'
      ? 'Inbox'
      : currentPage == 'CartPage' && currentPage !== 'FavoritePage'
      ? 'Your Cart'
      : profilePageTab && currentPage !== 'FavoritePage'
      ? 'Account Settings'
      : helpCenterTab
      ? 'Help Center'
      : currentPage == 'FavoritePage'
      ? 'Favorites'
      : currentPage == 'MyPurchasesPage'
      ? 'My Orders'
      : '';

  return (
    <LayoutComposer areas={layoutAreas} className={classes} {...rest}>
      {layoutProps => {
        const { Topbar, Main, Footer } = layoutProps;
        return (
          <>
            <Topbar as="header" className={css.topbar}>
              {topbarContent}
            </Topbar>

            <Main as="div">
              <WelcomeMessage />
              <div className={containerClasses}>
                <aside className={classNames(css.sideNav, sideNavClassName)}>
                  <LayoutWrapperSideTab
                    paymentSideNavIcon={paymentSideNavIcon}
                    payoutSideNavIcon={payoutSideNavIcon}
                    sideBarButtons={true}
                    currentPage={currentPage}
                    customTabs
                    isAccountSettingTab={isAccountSettingTab}
                  />
                </aside>

                <main className={classNames(css.main, mainColumnClassName)}>
                  {!paymentMethods && !profilePageFullView && !paymentTabs && (
                    <div className={css.rightWrapper}>
                      {titleText && <div className={css.mainTitleName}>{titleText}</div>}
                      {!profilePageTab &&
                      !inboxPageTab &&
                      currentPage !== 'FavoritePage' &&
                      currentPage !== 'CartPage' &&
                      currentPage == 'ManageListingsPage' ? (
                        <>
                          <div className={css.mainTitleName}>
                            <FormattedMessage id="ManageListingsPage.sectionLabel" />
                          </div>
                          {/* className={css.outFitBox} */}
                          <div>
                            <OutfitListingStateTab
                              profilePageTab={profilePageTab}
                              currentPage={currentPage}
                              tabType={tabType}
                            />
                          </div>
                        </>
                      ) : null}

                      {profilePageTab &&
                      currentPage !== 'FavoritePage' &&
                      currentPage !== 'CartPage' &&
                      !paymentMethods ? (
                        <div>
                          <LayoutSinglePageTabs
                            profilePageTab={profilePageTab}
                            currentPage={currentPage}
                            listingTab={true}
                          />
                        </div>
                      ) : null}
                      {currentPage=='MyPurchasesPage' ? (
                        <div>
                          <MyPurchasesPageTabs
                          //  profilePageTab={profilePageTab}
                              currentPage={currentPage}
                              tabType={tabType}
                          />
                        </div>
                      ) : null}
                      {inboxPageTab && (
                        <InboxPageTab
                          currentPage={currentPage}
                          tabType={tabType}
                          inboxPageTab={inboxPageTab}
                          profilePageTab={profilePageTab}
                        />
                      )}
                      {helpCenterTab ? (
                        <HelpCenterPageTabs
                          // profilePageTab={profilePageTab}
                          currentPage={currentPage}
                          helpCenterTab={true}
                        />
                      ) : null}
                    </div>
                  )}
                  {currentPage == 'StripePayoutPage' || currentPage == 'PaymentMethodsPage' ? (
                    <PaymentStateTab
                      currentPage={currentPage}
                      listingTab={true}
                      tabType={tabType}
                    />
                  ) : null}
                  {children}
                </main>
              </div>
            </Main>
            <Footer>{footerContent}</Footer>
          </>
        );
      }}
    </LayoutComposer>
  );
};

LayoutSideNavigation.displayName = 'LayoutSideNavigation';

LayoutSideNavigation.defaultProps = {
  className: null,
  rootClassName: null,
  sideNav: null,
  footer: null,
  useAccountSettingsNav: false,
  currentPage: null,
};

LayoutSideNavigation.propTypes = {
  className: string,
  rootClassName: string,
  children: node.isRequired,
  topbar: node.isRequired,
  sideNav: node,
  footer: node,
  useAccountSettingsNav: bool,
  currentPage: string,
};

export default LayoutSideNavigation;
