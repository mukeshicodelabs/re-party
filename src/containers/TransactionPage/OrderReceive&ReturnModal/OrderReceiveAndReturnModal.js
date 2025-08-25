import arrayMutators from 'final-form-arrays';
import React from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import { AspectRatioWrapper, Button, FieldTextInput, Form, Modal } from '../../../components';
import css from './OrderReceiveAndReturnModal.module.css'

const ACCEPT_IMAGES = 'image/*';

const FieldAddImage = props => {
  const { formApi, onImageUploadHandler, aspectWidth = 1, aspectHeight = 1, ...rest } = props;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const filesArray = Array.from(e.target.files);
          formApi.change(`receiveImages`, filesArray);
          formApi.blur(`receiveImages`);
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

const OrderReceiveForm = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={fieldRenderProps => {
      const { onSubmit, form, handleSubmit, loading, values } = fieldRenderProps;

      return (
        <Form onSubmit={handleSubmit}>
          <div className={css.gridBox}>
            <FieldTextInput
             id="receiveDescription"
             name="receiveDescription"
             label={"Please Enter suggestion"}
             placeHolder={"Please Enter suggestion"}
            />
            <div className={css.uploadImage}>
              <FieldAddImage
                id="receiveImages"
                name="receiveImages"
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
            {values && values.receiveImages && Array.isArray(values.receiveImages) ? values.receiveImages.map((st) => {
              const url = typeof st == "object" ? URL.createObjectURL(st) : null;
              return url ? <div className={css.galleryImage}>
                <img src={url} alt="Uploaded" />
              </div> : null;
            }) : null}
          </div>
          <Button 
          type="submit" 
          inProgress={loading} 
          className={css.submitButton}
          disabled={!values?.receiveImages?.length}
          >
            Submit
          </Button>
        </Form>
      );
    }}
  />
);

const OrderReceiveAndReturnModal = props => {
  const { isOpen, intl, onCloseModal, onSubmit, loading, transactionProtectedData,onManageDisableScrolling } = props;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
    >
      <div className={css.returnContent}>
        <div className={css.headingText}>Please upload photos</div>
        <OrderReceiveForm 
        onSubmit={onSubmit} 
        loading={loading} 
        onManageDisableScrolling={onManageDisableScrolling}
        transactionProtectedData={transactionProtectedData} />
      </div>
    </Modal>
  );
};

export default OrderReceiveAndReturnModal;
