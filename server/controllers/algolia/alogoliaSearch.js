const algoliasearch = require('algoliasearch'); // Use Node.js version
const { handleError } = require('../../api-util/sdk');

const getClientIndex = indexName => {
    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
    return client.initIndex(indexName);
};

const createSearchData = async (req, res) => {
    const { indexName, isCallbackFn = false, data } = req.body;

    try {
        const index = getClientIndex(indexName);
        const formattedData = data.map(item => ({
            ...item,
            // keep arrays exactly as they are
            event_type: item.event_type || [],
            select_color: item.select_color || [],
            selectedCategoryOptions: item.selectedCategoryOptions || [],

            // lowercase only category if needed
            category: item.category,
        }));

        const createData = await index.saveObjects(formattedData);

        if (isCallbackFn) return createData;

        return res
            .status(200)
            .set('Content-Type', 'application/transit+json')
            .send({ data: createData })
            .end();
    } catch (error) {
        console.error(error, '**** createSearchData **** => error');
        return handleError(res, error);
    }
};

const updateSearchData = async (req, res) => {
    const { indexName, isCallbackFn = false, data } = req.body;
    try {
        const index = getClientIndex(indexName);
        const temp=JSON.stringify(data, null, 2)
        const updateData = await index.partialUpdateObjects(JSON.parse(temp),{ createIfNotExists: true });
        if (isCallbackFn) return updateData;
   
        return res
            .status(200)
            .set('Content-Type', 'application/transit+json')
            .send({ data: updateData })
            .end();
    } catch (error) {
        console.error(error, '**** updateSearchData **** => error');
        return handleError(res, error);
    }
};

const deleteSearchData = async (req, res) => {
    const { indexName, isCallbackFn = false, data } = req.body;

    try {
        const { objectID } = data;
        const index = getClientIndex(indexName);
        const deleteData = await index.deleteObjects([objectID]);

        if (isCallbackFn) return deleteData;

        return res
            .status(200)
            .set('Content-Type', 'application/transit+json')
            .send({ data: deleteData })
            .end();
    } catch (error) {
        console.error(error, '**** deleteSearchData **** => error');
        if (isCallbackFn) return error;
        return handleError(res, error);
    }
};

module.exports = {
    createSearchData,
    updateSearchData,
    deleteSearchData,
};
