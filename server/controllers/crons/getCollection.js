const {
  subscription,
  sequenceId,
  category,
  subCategory,
  subSubCategory,
  dynamicFieldsSubSubCat,
  groupFolder,
  groupFolderDocument,
  organization,
  errorRecord,
  freeTransaction,
  youthAccount,
  moderator,
  groupPayment,
  customerGroupPayment,
  customerGroupPaymentInvoice
} = require('./index');


const getCollection = tableName => {
  switch (tableName) {
    case 'sequenceId':
      return sequenceId;

    default:
      return null;
  }
};

module.exports = { getCollection };
