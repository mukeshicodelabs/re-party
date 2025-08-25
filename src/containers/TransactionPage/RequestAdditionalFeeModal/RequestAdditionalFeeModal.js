import React, { useState } from 'react';
import { AspectRatioWrapper, Button, FieldCurrencyInput, FieldRadioButton, FieldTextInput, Form, Modal } from '../../../components';
import { Form as FinalForm, Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays';
const ACCEPT_IMAGES = 'image/*';
import css from './RequestAdditionalFeeModal.module.css'
import { FormattedMessage, useIntl } from 'react-intl';
import appSettings from '../../../config/settings';
import { useConfiguration } from '../../../context/configurationContext';


const FieldAddImage = props => {
  const { formApi, onImageUploadHandler, aspectWidth = 1, aspectHeight = 1, ...rest } = props;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const filesArray = Array.from(e.target.files);
          formApi.change(`additionalFeeImages`, filesArray);
          formApi.blur(`additionalFeeImages`);
        };
        const inputProps = { multiple: true, accept, id: name, name, onChange, type };
        return (
          <div>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {<input {...inputProps} />}
              <label>{label}</label>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

const AdditionalFeeRequestForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={fieldRenderProps => {
      const { form, handleSubmit, values, loading, autoFocus,securityAmount } = fieldRenderProps;
      const intl = useIntl();
      const config = useConfiguration();



      // Validator for additional price
      const validateAdditionalPrice = value => {

        if (
          securityAmount &&
          value?.amount &&
          parseInt(value?.amount) / 100 < securityAmount &&
          values.reason &&
          values.additionalFeeImages
        ) {
          return false;
        }
        return true;
      };
      

      // Final form enable condition
      const isFormValid =   validateAdditionalPrice(values.AdditionalPrice);
      
      return (
        <Form onSubmit={handleSubmit}>
          <div className={css.returnContent}>
            <div className={css.headingText}>
              <div><FormattedMessage id="RequestAdditionalFeeModal.heading1" /></div>
            </div>
            <div className={css.damageSection}>
              {/* <h4><FormattedMessage id="RequestAdditionalFeeModal.heading6" /></h4> */}
              <FieldTextInput
                id={'reason'}
                name={'reason'}
                type={'textarea'}
                placeholder={'Describe the damage...'}
                className={css.descriptions}
                label={<FormattedMessage id="RequestAdditionalFeeModal.heading6"/>}
              />
                <div className={css.gridBox}>
                  <div
                  className={css.uploadImage}
                  >
                    <FieldAddImage
                      id="additionalFeeImages"
                      name="additionalFeeImages"
                      accept={ACCEPT_IMAGES}
                      // label={'Add images'}
                      type="file"
                      formApi={form}
                      aspectWidth={1}
                      aspectHeight={1}
                    />
                    <span className={css.uploadIcon}>
                    <svg width="100px" height="100px" viewBox="0 0 2.5 2.5" xmlns="http://www.w3.org/2000/svg"><path d="M2.375 0.313A0.188 0.188 0 0 0 2.188 0.125H0.313A0.188 0.188 0 0 0 0.125 0.313v1.875a0.188 0.188 0 0 0 0.188 0.188H1.25v-0.25H0.437a0.062 0.062 0 0 1 -0.05 -0.099l0.444 -0.506a0.063 0.063 0 0 1 0.09 -0.002l0.204 0.232 0.383 -0.598a0.063 0.063 0 0 1 0.105 0.003l0.09 0.157A0.75 0.75 0 0 1 2 1.25h0.375zm-1.438 0.25c0.138 0 0.25 0.113 0.25 0.25s-0.113 0.25 -0.25 0.25 -0.25 -0.113 -0.25 -0.25 0.113 -0.25 0.25 -0.25m1.526 1.349a0.125 0.125 0 0 0 -0.088 -0.036h-0.25v-0.25a0.125 0.125 0 0 0 -0.25 0v0.25h-0.25a0.125 0.125 0 0 0 0 0.25h0.25v0.25a0.125 0.125 0 1 0 0.25 0v-0.25h0.25a0.125 0.125 0 0 0 0.088 -0.213" fill="#5C5F62"/></svg>
                    </span>
                  </div>
                  {values && values.additionalFeeImages && Array.isArray(values.additionalFeeImages) ?
                    values.additionalFeeImages.map((st, index) => {
                      const url = typeof st == "object" ? URL.createObjectURL(st) : null;
                      return url ? (
                        <div key={index} className={css.galleryImage}>
                          <img src={url} alt="Uploaded damage" />
                        </div>
                      ) : null;
                    }) : null
                  }
                </div>
              <div>
                <FieldCurrencyInput
                  id={`AdditionalPrice`}
                  name="AdditionalPrice"
                  className={css.input}
                  autoFocus={autoFocus}
                  label={intl.formatMessage(
                    { id: 'EditListingPricingAndStockForm.enterAdditionalPrice' },
                  )}
                  placeholder={intl.formatMessage({
                    id: 'EditListingPricingAndStockForm.EnterAmountInputPlaceholder',
                  })}
                  currencyConfig={appSettings.getCurrencyFormatting(config.currency)}
                  validate={validateAdditionalPrice}
                />
              </div>
            </div>

            <div className={css.buttonContainer}>
              <Button
                type="submit"
                inProgress={loading}
                className={css.submitButton}
                disabled={isFormValid}
              >
                SUBMIT
              </Button>
            </div>
          </div>
        </Form>
      );
    }}
  />
);

function RequestAdditionalFeeModal(props) {
  const {
    id,
    className,
    rootClassName,
    isOpen,
    intl,
    onCloseModal,
    onManageDisableScrolling,
    onSubmit,
    loading,
    handleConfirmCondition,
    securityAmount
  } = props;

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      className={rootClassName || css.modal}
    >
      <div className={css.container}>
        <AdditionalFeeRequestForm
          onSubmit={onSubmit}
          loading={loading}
          securityAmount={securityAmount}
        />
      </div>
    </Modal>
  );
}

export default RequestAdditionalFeeModal;