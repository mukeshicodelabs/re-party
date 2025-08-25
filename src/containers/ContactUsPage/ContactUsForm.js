import React, { Component } from 'react';
import { string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import { propTypes } from '../../util/types';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import * as validators from '../../util/validators';
import arrayMutators from 'final-form-arrays';


import {
  Form,
  Button,
  FieldTextInput,
  H3,
  H1,
  FieldCheckboxGroup,
} from '../../components';

import css from './ContactUsForm.module.css';
import FieldRadioButtonComponent from '../../components/FieldRadioButton/FieldRadioButton';
class ContactUsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.uploadDelayTimeoutId = null;
    this.state = {
      uploadDelay: false
    };
    this.submittedValues = {};
  }

  componentDidUpdate(prevProps) {
    // Upload delay is additional time window where Avatar is added to the DOM,
    // but not yet visible (time to load image URL from srcset)
    if (prevProps.uploadInProgress && !this.props.uploadInProgress) {
      this.setState({ uploadDelay: true });
      this.uploadDelayTimeoutId = window.setTimeout(() => {
        this.setState({ uploadDelay: false });
      }, UPLOAD_CHANGE_DELAY);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.uploadDelayTimeoutId);
  }


  render() {
    return (
      <FinalForm
      keepDirtyOnReinitialize={true}
        mutators={{ ...arrayMutators }}
        {...this.props}
        render={fieldRenderProps => {
          const {
            className,
            handleSubmit,
            intl,
            invalid,
            pristine,
            rootClassName,
            form,
            values,
            updateInProgress,
            uploadInProgress,
          } = fieldRenderProps;

          // First name
          const firstNameLabel = intl.formatMessage({
            id: 'ContactUsForm.firstNameLabel',
          });
          const firstNamePlaceholder = intl.formatMessage({
            id: 'ContactUsForm.firstNamePlaceholder',
          });
          const firstNameRequiredMessage = intl.formatMessage({
            id: 'ProfileSettingsForm.firstNameRequired',
          });
          const firstNameRequired = validators.required(firstNameRequiredMessage);


          // Last name
          const lastNameLabel = intl.formatMessage({
            id: 'ContactUsForm.lastNameLabel',
          });
          const lastNamePlaceholder = intl.formatMessage({
            id: 'ContactUsForm.lastNamePlaceholder',
          });
          const lastNameRequiredMessage = intl.formatMessage({
            id: 'ProfileSettingsForm.lastNameRequired',
          });
          const lastNameRequired = validators.required(lastNameRequiredMessage);

          // email
          const emailLabel = intl.formatMessage({
            id: 'ContactUsForm.emailLabel',
          });
          const emailPlaceholder = intl.formatMessage({
            id: 'ContactUsForm.emailPlaceholder',
          });
          const emailRequiredMessage = intl.formatMessage({
            id: 'LoginForm.emailRequired',
          });
          const emailValidMessage = intl.formatMessage({
            id: 'ContactUsForm.emailValidMessage',
          });
          const emailRequired = validators.composeValidators(validators.required(emailRequiredMessage),validators.emailFormatValid(emailValidMessage));

          // message
          const messageLabel = intl.formatMessage({
            id: 'ContactUsForm.messageLabel',
          });
          const messagePlaceholder = intl.formatMessage({
            id: 'ContactUsForm.messagePlaceholder',
          });

          const RequiredMessage = intl.formatMessage({
            id: 'ContactUsForm.messageRequired',
          });
          const messageRequired = validators.required(RequiredMessage);

          const classes = classNames(rootClassName || css.root, className);
          const submitInProgress = updateInProgress;
          const submittedOnce = Object.keys(this.submittedValues).length > 0;
          const pristineSinceLastSubmit = submittedOnce && isEqual(values, this.submittedValues);
          const submitDisabled =
            invalid || pristine || pristineSinceLastSubmit || uploadInProgress || submitInProgress;


          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
                handleSubmit(e);
                form.reset();
              }}
            >
              <div className={css.sectionContainer}>

                <div className={css.contactInnerWrapper}>
                  <div className={css.contactEmailBox}>
                    <H1 as="h2" className={css.sectionTitle}>
                      <FormattedMessage id="ContactUsForm.contactUsHeading" />
                    </H1>
                    <H3 className={css.talkText}>
                      <FormattedMessage id="ContactUsForm.letsTalk" />
                    </H3>

                  

                  </div>
                  <div className={css.nameContainer}>
                    <div className={css.rowForm}>
                      <FieldTextInput
                        className={css.inputBox}
                        type="text"
                        id="firstName"
                        name="firstName"
                        label={firstNameLabel}
                        placeholder={firstNamePlaceholder}
                        validate={firstNameRequired}
                      />
                      <FieldTextInput
                        className={css.inputBox}
                        type="text"
                        id="lastName"
                        name="lastName"
                        label={lastNameLabel}
                        placeholder={lastNamePlaceholder}
                        validate={lastNameRequired}
                      />
                      <FieldTextInput
                        className={css.inputBox}
                        type="email"
                        id="email"
                        name="email"
                        label={emailLabel}
                        placeholder={emailPlaceholder}
                        validate={emailRequired}
                      />
                    </div>
                  
                    <FieldTextInput
                      className={css.inputBox}
                      type="textarea"
                      id="message"
                      name="message"
                      label={messageLabel}
                      placeholder={messagePlaceholder}
                      validate={messageRequired}
                    />
                    {/* <FieldCheckboxGroup
                      name="terms"
                      id="terms-accepted"
                      optionLabelClassName={css.finePrint}
                      className={css.contactCheckbox}
                      options={[
                        {
                          key: 'tos-and-privacy',
                          label: intl.formatMessage({ id: "ContactUsForm.contactUsTerms" })
                          ,
                        },
                      ]}
                      validate={validators.requiredFieldArrayCheckbox(
                        intl.formatMessage({ id: 'contactUsPage.termsAndConditionsAcceptRequired' })
                      )}
                    /> */}
                    <Button
                      className={css.submitButton}
                      type="submit"
                      disabled={submitDisabled}
                      inProgress={submitInProgress}
                      ready={pristineSinceLastSubmit}
                    >
                      <FormattedMessage id="ContactUsForm.submit" />
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

ContactUsFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  uploadImageError: null,
  updateProfileError: null,
  updateProfileReady: false,
};

ContactUsFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  // from injectIntl
  intl: intlShape.isRequired,
};

const ContactUsForm = compose(injectIntl)(ContactUsFormComponent);

ContactUsForm.displayName = 'ContactUsForm';

export default ContactUsForm;
