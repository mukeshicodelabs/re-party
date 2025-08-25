import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';

import { Form, PrimaryButton, FieldTextInput, CustomExtendedDataField, FieldPhoneNumberInput } from '../../../components';

import FieldSelectUserType from '../FieldSelectUserType';
import UserFieldDisplayName from '../UserFieldDisplayName';
import UserFieldPhoneNumber from '../UserFieldPhoneNumber';

import css from './SignupForm.module.css';
import BrandIconCard from '../../../components/BrandIconCard/BrandIconCard';
import logo from '../../../assets/images/Primary-Logo.png';

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

  const PhoneNumberMaybe = props => {
    const { formId, userTypeConfig, intl } = props;
  
    const isDisabled = userTypeConfig?.defaultUserFields?.phoneNumber === false;
    if (isDisabled) {
      return null;
    }
  
    const { required } = userTypeConfig?.phoneNumberSettings || {};
    const isRequired = required === true;
  
    const validateFns = [
      value => {
        if (!value) {
          return intl.formatMessage({ id: 'ContactDetailsForm.phoneRequired' });
        }
        if (value && !/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(value)) {
          return intl.formatMessage({
            id: 'ContactDetailsForm.phoneInvalid',
            defaultMessage: 'Enter a valid U.S. phone number (e.g., (123) 456-7890)',
          });
        }
        return undefined;
      },
    ];
  
    return (
      <FieldPhoneNumberInput
        className={css.phoneNumber}
        name="phoneNumber"
        id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
        label={intl.formatMessage({
          id: 'SignupForm.phonenumberLabel',
        })}
        placeholder={intl.formatMessage({
          id: 'SignupForm.phonenumberPlaceholder',
        })}
        validate={validators.composeValidators(...validateFns)}
        parse={value =>
          value ? value.replace(/[^\d]/g, '').slice(0, 10) : '' // keep only digits up to 10
        }
        format={value =>
          value && value.length === 10
            ? `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`
            : value
        }
      />
    );
  };
const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    initialValues={{ userType: props.preselectedUserType || getSoleUserTypeMaybe(props.userTypes) }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
        preselectedUserType,
        userTypes,
        userFields,
        values,
      } = formRenderProps;

      const { userType } = values || {};

      // email
      const emailRequired = validators.required(
        intl.formatMessage({
          id: 'SignupForm.emailRequired',
        })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({
          id: 'SignupForm.emailInvalid',
        })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({
        id: 'SignupForm.passwordRequired',
      });
      const passwordMinLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooShort',
        },
        {
          minLength: validators.PASSWORD_MIN_LENGTH,
        }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        {
          id: 'SignupForm.passwordTooLong',
        },
        {
          maxLength: validators.PASSWORD_MAX_LENGTH,
        }
      );
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordMinLength,
        passwordMaxLength
      );
      const validateUSPhoneNumber = value => {
        const phoneRegex = /^\d{10}$/; // Matches exactly 10 digits
        if (!phoneRegex.test(value)) {
          return 'Enter a valid 10-digit US phone number';
        }
        return undefined;
      };
      // Custom user fields. Since user types are not supported here,
      // only fields with no user type id limitation are selected.
      const userFieldProps = getPropsForCustomUserFieldInputs(userFields, intl, userType);

      const noUserTypes = !userType && !(userTypes?.length > 0);
      const userTypeConfig = userTypes.find(config => config.userType === userType);
      const showDefaultUserFields = userType || noUserTypes;
      const showCustomUserFields = (userType || noUserTypes) && userFieldProps?.length > 0;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.authHeading}>
            <div className={css.loginLogo}>
              <img src={logo} alt="logo" />
            </div>
            <div className={css.welcomeMessage}>Sign Up for Reparty</div>
            <div className={css.authDescription}>
              Join our community to buy and resell party decor, waste-free.
            </div>
          </div>
          <FieldSelectUserType
            name="userType"
            userTypes={userTypes}
            hasExistingUserType={!!preselectedUserType}
            intl={intl}
          />

          {showDefaultUserFields ? (
            <div className={css.defaultUserFields}>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={intl.formatMessage({
                  id: 'SignupForm.emailLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.emailPlaceholder',
                })}
                validate={validators.composeValidators(emailRequired, emailValid)}
              />
              <div className={css.name}>
                <FieldTextInput
                  className={css.firstNameRoot}
                  type="text"
                  id={formId ? `${formId}.fname` : 'fname'}
                  name="fname"
                  autoComplete="given-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.firstNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.firstNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.firstNameRequired',
                    })
                  )}
                />
                <FieldTextInput
                  className={css.firstNameRoot}
                  type="text"
                  id={formId ? `${formId}.lname` : 'lname'}
                  name="lname"
                  autoComplete="family-name"
                  label={intl.formatMessage({
                    id: 'SignupForm.lastNameLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'SignupForm.lastNamePlaceholder',
                  })}
                  validate={validators.required(
                    intl.formatMessage({
                      id: 'SignupForm.lastNameRequired',
                    })
                  )}
                />
              </div>

              <UserFieldDisplayName
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />

              <FieldTextInput
                className={css.password}
                type="password"
                id={formId ? `${formId}.password` : 'password'}
                name="password"
                autoComplete="new-password"
                label={intl.formatMessage({
                  id: 'SignupForm.passwordLabel',
                })}
                placeholder={intl.formatMessage({
                  id: 'SignupForm.passwordPlaceholder',
                })}
                validate={passwordValidators}
              />

              <UserFieldPhoneNumber
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />
              {/* <FieldPhoneNumberInput
              className={css.phoneNumber}
              type="number"
              id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
              name="phoneNumber"
              label={intl.formatMessage({
                id: 'SignupForm.phonenumberLabel',
              })}
              placeholder={intl.formatMessage({
                id: 'SignupForm.phonenumberPlaceholder',
              })}
              validate={validators.composeValidators(
                validators.required('This field is required'),
                validateUSPhoneNumber
              )}
              /> */}
              <PhoneNumberMaybe formId={formId} userTypeConfig={userTypeConfig} intl={intl} />
            </div>
          ) : null}

          {showCustomUserFields ? (
            <div className={css.customFields}>
              {userFieldProps.filter(value=>value.key !=='pub_phonenumber').map(({ key, ...fieldProps }) => (
                <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
              ))}
            </div>
          ) : null}

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
            >
              <FormattedMessage id="SignupForm.signUp" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

/**
 * A component that renders the signup form.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class name that overrides the default class css.root
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {ReactNode} props.termsAndConditions - The terms and conditions
 * @param {string} props.preselectedUserType - The preselected user type
 * @param {propTypes.userTypes} props.userTypes - The user types
 * @param {propTypes.listingFields} props.userFields - The user fields
 * @returns {JSX.Element}
 */
const SignupForm = props => {
  const intl = useIntl();
  return <SignupFormComponent {...props} intl={intl} />;
};

export default SignupForm;
