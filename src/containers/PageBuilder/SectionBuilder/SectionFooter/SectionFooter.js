import React from 'react';
import classNames from 'classnames';
import { LinkedLogo, NamedLink } from '../../../../components';

import Field from '../../Field';
import BlockBuilder from '../../BlockBuilder';

import SectionContainer from '../SectionContainer';
import css from './SectionFooter.module.css';
import logo from '../../../../assets/images/re-party-footer.png';
import BrandIconCard from '../../../../components/BrandIconCard/BrandIconCard';
import { contactUsMessage } from '../../../../util/api';
import Swal from 'sweetalert2';

const GRID_CONFIG = [
  { contentCss: css.contentCol1, gridCss: css.gridCol1 },
  { contentCss: css.contentCol2, gridCss: css.gridCol2 },
  { contentCss: css.contentCol3, gridCss: css.gridCol3 },
  { contentCss: css.contentCol4, gridCss: css.gridCol4 },
];
const MAX_MOBILE_SCREEN_WIDTH = 1024;

const getIndex = numberOfColumns => numberOfColumns - 1;

const getContentCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.contentCss : GRID_CONFIG[0].contentCss;
};

const getGridCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.gridCss : GRID_CONFIG[0].gridCss;
};

const SectionFooter = props => {
  const {
    sectionId,
    className,
    rootClassName,
    socialMediaLinks = [],
    options,
    linkLogoToExternalSite,
  } = props;

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const showSocialMediaLinks = socialMediaLinks?.length > 0;
  const [email, setEmail] = React.useState("");
  return (
    <SectionContainer
      as="footer"
      id={sectionId}
      className={classNames(css.root, className)}
      rootClassName={rootClassName}
      options={fieldOptions}
    >
      <div className={css.subscriptionSection}>
        <h2 className={css.subscriptionTitle}>Goodbye Waste, Hello ReParty!</h2>
        <p className={css.subscriptionSubtitle}>
          A smarter way to party with pre-loved, stylish decor. Sign up to get early access and
          exclusive updates!
        </p>
        <div className={css.subscriptionForm}>
          <div className={css.emailInputWrapperWithIcon}>
            <BrandIconCard type="emailicon" />
            <input
              type="email"
              value={email}
              placeholder="Enter your email address"
              onChange={(e) => setEmail(e.target.value)}
              className={css.subscriptionInput}
            />
          </div>
          <button className={css.subscribeButton} onClick={async () => {
              if (!email) {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'warning',
                  text: 'Please enter your email address',
                  showConfirmButton: false,
                  timer: 3000,
                  timerProgressBar: true
                });
                return;
              }
              
              // Email validation regex
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'warning',
                  text: 'Please enter a valid email address',
                  showConfirmButton: false,
                  timer: 3000,
                  timerProgressBar: true
                });
                return;
              }

              const toastConfig = {
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
                showClass: { popup: 'swal2-noanimation' },
                hideClass: { popup: '' },
                didOpen: (toast) => {
                  const progressBar = toast.querySelector('.swal2-timer-progress-bar');
                  if (progressBar) {
                    progressBar.style.backgroundColor = 'green';
                  }
                }
              };

              try {
                const response = await contactUsMessage({ email, subscribe: true });
                
                if (response?.message === 'Email sent successfully') {
                  setEmail('');
                  Swal.fire({
                    ...toastConfig,
                    icon: 'success',
                    text: 'Email sent successfully',
                  });
                } else {
                  throw new Error(response?.message || 'Subscription failed');
                }
              } catch (error) {
                toastConfig.didOpen = (toast) => {
                  const progressBar = toast.querySelector('.swal2-timer-progress-bar');
                  if (progressBar) {
                    progressBar.style.backgroundColor = 'red';
                  }
                };
                
                Swal.fire({
                  ...toastConfig,
                  icon: 'error',
                  text: error.message || 'Oops, something went wrong. Please try again.',
                });
                console.error('Subscription error:', error);
              }
            }}
          >
            SUBSCRIBE NOW <BrandIconCard type="subscription" />
          </button>
        </div>
      </div>

      <div className={css.footerContent}>
        <div className={css.leftColumn}>
          {/* <LinkedLogo
            rootClassName={css.logoLink}
            logoClassName={css.logoWrapper}
            logoImageClassName={css.logoImage}
            linkToExternalSite={linkLogoToExternalSite}
            image={<img src={logo} alt="ReParty Logo" />}
          /> */}
          <img src={logo} alt="ReParty Logo" />
          <div className={css.tagline}>Where Party Decor Gets a Second Celebration</div>
        </div>

        <div className={css.linkColumn}>
          <h3 className={css.columnTitle}>QUICK LINKS</h3>
          <ul className={css.linkList}>
            <li>
              <NamedLink
                name="ContractorSearchPage"
                to={{ search: '?productType=Sell' }}
                className={css.linkItem}
              >
                 Shop
              </NamedLink> 
            </li>
            <li>
              <NamedLink
                name="ContractorSearchPage"
                to={{ search: '?productType=Rent' }}
                className={css.linkItem}
              >
                Browse Rentals
              </NamedLink>  

            </li>
            <li>
              <NamedLink name='ContractorSearchPage' className={css.linkItem}>
                Search Listings
             </NamedLink>
            </li>
            <li>
              <NamedLink name='NewListingPage' className={css.linkItem}>
                Post a New Listing
              </NamedLink>
            </li>
            <li>
             <NamedLink name='NewListingPage' className={css.linkItem}>
                Sell Your Decor
             </NamedLink>
            </li>
          </ul>
        </div>

        <div className={css.linkColumn}>
          <h3 className={css.columnTitle}>COMPANY</h3>
          <ul className={css.linkList}>
            <li>
              <NamedLink name='OurStoryPage' className={css.linkItem}>
                Our Story
              </NamedLink>
            </li>
            <li>
              <NamedLink name="HowItWorkPage" className={css.linkItem}>
                How It works
              </NamedLink>
            </li>
            <li>
              <NamedLink name="FAQPage" className={css.linkItem}>
                FAQs
              </NamedLink>
            </li>
            {/* <li>
              <a href="/contact-us" className={css.linkItem}>
                Contact Us
              </a>
            </li> */}
            <li>
             <NamedLink name="PrivacyPolicyPage" className={css.linkItem}>
                Privacy Policy
              </NamedLink>
            </li>
            <li>
               <NamedLink name="TermsOfServicePage" className={css.linkItem}>
                Terms & Conditions
              </NamedLink>
            </li>
          </ul>
        </div>

        <div className={css.socialColumn}>
          <h3 className={css.columnTitle}>LET'S BE SOCIAL</h3>
          <div className={css.socialIcons}>
            <a href="https://www.facebook.com/RePartyMarketplace/" target='_blank' className={css.socialIconLink}>
              <BrandIconCard type="facebook" />
            </a>
            <a href=" https://instagram.com/repartymarketplace" target='_blank' className={css.socialIconLink}>
              <BrandIconCard type="instagram" />
            </a>
            <a href="https://www.linkedin.com/company/reparty" target='_blank' className={css.socialIconLink}>
              <BrandIconCard type="linkedin" />
            </a>
            <a href="https://www.tiktok.com/@repartymarketplace" target='_blank' className={css.socialIconLink}>
              <BrandIconCard type="tiktok" />
            </a>
            <a href="https://www.pinterest.com/repartymarketplace/" target='_blank' className={css.socialIconLink}>
              <BrandIconCard type="pinterest" />
            </a>
          </div>
        </div>
      </div>
      {/* <div className={css.copyright}>&copy; 2023 ReParty. All rights reserved.</div> */}
    </SectionContainer>
  );
};

export default SectionFooter;
