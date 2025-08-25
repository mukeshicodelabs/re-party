import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { Form, PrimaryButton, FieldTextInput, NamedLink } from '../../../components';

import css from './LoginForm.module.css';
import BrandIconCard from '../../../components/BrandIconCard/BrandIconCard';

const LoginFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        intl,
        invalid,
        values,
        errors,
      } = fieldRenderProps;

      // email
      const emailLabel = intl.formatMessage({
        id: 'LoginForm.emailLabel',
      });
      const emailPlaceholder = intl.formatMessage({
        id: 'LoginForm.emailPlaceholder',
      });
      const emailRequiredMessage = intl.formatMessage({
        id: 'LoginForm.emailRequired',
      });
      const emailRequired = validators.required(emailRequiredMessage);
      const emailInvalidMessage = intl.formatMessage({
        id: 'LoginForm.emailInvalid',
      });
      const emailValid = validators.emailFormatValid(emailInvalidMessage);

      // password
      const passwordLabel = intl.formatMessage({
        id: 'LoginForm.passwordLabel',
      });
      const passwordPlaceholder = intl.formatMessage({
        id: 'LoginForm.passwordPlaceholder',
      });
      const passwordRequiredMessage = intl.formatMessage({
        id: 'LoginForm.passwordRequired',
      });
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      const passwordRecoveryLink = (
        <NamedLink
          name="PasswordRecoveryPage"
          className={css.recoveryLink}
          to={{
            search:
              values?.email && !errors?.email ? `email=${encodeURIComponent(values.email)}` : '',
          }}
        >
          <FormattedMessage id="LoginForm.forgotPassword" />
        </NamedLink>
      );

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div>
            <div className={css.authHeading}>
              <div className={css.loginLogo}>
                <BrandIconCard type="loginlogo" />
              </div>
              <div className={css.welcomeMessage}>Welcome Back to Reparty!</div>
              <div className={css.authDescription}>
                Log in to Reparty – the Sustainable Marketplace for Pre-Loved Party Magic.
              </div>
            </div>
            <FieldTextInput
              type="email"
              id={formId ? `${formId}.email` : 'email'}
              name="email"
              autoComplete="email"
              label={emailLabel}
              placeholder={emailPlaceholder}
              validate={validators.composeValidators(emailRequired, emailValid)}
            />
            <FieldTextInput
              className={css.password}
              type="password"
              id={formId ? `${formId}.password` : 'password'}
              name="password"
              autoComplete="current-password"
              label={passwordLabel}
              placeholder={passwordPlaceholder}
              validate={passwordRequired}
            />
          </div>
          <div className={css.bottomWrapper}>
            <p className={css.bottomWrapperTextTop}>
              <span className={css.recoveryLinkInfo}>
                Not signed up yet ?
                <NamedLink name="SignupPage" className={css.signupLink}>
                  Create an account.
                </NamedLink>
              </span>
            </p>
            <PrimaryButton
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="LoginForm.logIn" />
            </PrimaryButton>
              <p className={css.bottomWrapperText}>
              <span className={css.recoveryLinkInfo}>
                <FormattedMessage
                  id="LoginForm.forgotPasswordInfo"
                  values={{ passwordRecoveryLink }}
                />
              </span>
            </p>
          </div>
        </Form>
      );
    }}
  />
);

/**
 * A component that renders the login form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @returns {JSX.Element}
 */
const LoginForm = props => {
  const intl = useIntl();
  return <LoginFormComponent {...props} intl={intl} />;
};

export default LoginForm;
