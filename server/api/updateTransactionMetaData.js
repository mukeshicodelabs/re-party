const { getISdk, handleError } = require('../api-util/sdk');
const integrationSdk = getISdk();
const sharetribeSdk = require('sharetribe-flex-sdk');
const { types } = sharetribeSdk;
const { UUID } = types;

const updateMetaDataApi = (req, res) => {
  try {
    const updateParams = {
        id:req.body.id , 
        metadata:req.body.metadata 
    }
    return integrationSdk.transactions.updateMetadata(updateParams).then(response=>{
       return res.status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          {
            status:200,
            statusText: "success",
            data: req.body.metadata,
          }
        )
        .end();
    }).catch((e) => {
       return handleError(res, e);
    });
  } catch (error) {
    console.error(error, '&&& &&& => error');
    handleError(error);
  }
}
    
module.exports = { updateMetaDataApi };
