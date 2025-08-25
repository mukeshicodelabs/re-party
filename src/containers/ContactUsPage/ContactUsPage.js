import React, { useState } from 'react';
import { string } from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import css from './ContactUsPage.module.css';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import { LayoutSingleColumn, Modal, Page, H1, H3, NamedLink } from '../../components';
import ContactUsForm from './ContactUsForm.js';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import FooterContainer from '../FooterContainer/FooterContainer.js'
import { contactUsMessage } from '../../util/api.js';

const ContactUsPage = (props) => {
  const { intl,scrollingDisabled } = props;
  const [isSendMail, setIsSendMail] = useState(false);
  const [contactSubmitModal, setContactSubmitModal] = useState(false);
  const title = intl.formatMessage({ id: 'ProfileSettingsPage.title' });

  const handleSubmit = values => {
        const { firstName, lastName, email, message } = values;

    contactUsMessage({ firstName, lastName, email, message }).then(
      res => {
        setIsSendMail(true);
        setContactSubmitModal(true)
        setTimeout(() => {
          setIsSendMail(false);
        }, 3000);
      },
      error => {
        console.error(error);
        if (error) {
          console.error(error);
        }
      }
    );
  };

  return (
    <Page className={css.root} title={title} scrollingDisabled={scrollingDisabled} >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="ProfileSettingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        {!contactSubmitModal ?
          <div>
            <div className={css.contactWrapper}>
              {isSendMail ? <div className={css.successMessage}>Message sent successfully</div> : null}
              {/* <ContactUsForm className={css.form} onSubmit={handleSubmit} isSendMail={isSendMail} /> */}
              <ContactUsForm 
              className={css.form} 
              onSubmit={handleSubmit} 
              isSendMail={isSendMail} 
              />
            {contactSubmitModal ? (
                <Modal
                  id="contactSubmitModal"
                  isOpen={contactSubmitModal}
                  onClose={() => setContactSubmitModal(false)}
                  onManageDisableScrolling={() => { }}
                  containerClassName={css.modalContainer}
                  contactUs={true}
                >
                  <div className={css.thankYouModal}>
                    <H1>Thank You!</H1>
                    <H3>Thanks for reaching out, we'll be touch shortly</H3>

                    <div>
                      <NamedLink name="LandingPage">
                        <span>
                          <FormattedMessage id="TopbarDesktop.contactUsShop" />
                        </span>
                      </NamedLink>
                    </div>
                  </div>
                </Modal>
              ) : null}
            </div>
          </div>
          :

          <div className={css.thankYouModal}>
            <H1>Thank You!</H1>
            <H3>Thanks for reaching out, we'll be touch shortly</H3>

            <NamedLink name="LandingPage">
              <span>
                <FormattedMessage id="TopbarDesktop.contactUsShop" />
              </span>
            </NamedLink>
          </div>}
            
      </LayoutSingleColumn>
    </Page>
  );
};

ContactUsPage.defaultProps = {
  rootClassName: null,
  className: null,
};

ContactUsPage.propTypes = {
  rootClassName: string,
  className: string,
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};
const ContactUs = compose(connect(mapStateToProps))(ContactUsPage);

export default injectIntl(ContactUs);
