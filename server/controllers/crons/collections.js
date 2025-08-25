const { handleError } = require('../../api-util/sdk');
const { getCollection } = require('./getCollection');

const MONGO_SEQUENCE_ID = 'sequenceId';

const mongooseCreateCollectionData = async (req, res) => {
  const { tableName, payload, isCallBackFn = false } = req.body;

  try {
    const collection = await getCollection(tableName);

    if (!tableName || !collection || !payload) {
      const error = new Error('Invalid tableName so collection not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const data = await collection.create(payload);

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

const mongooseFindCollectionData = async (req, res) => {
  const { tableName, payload, isCallBackFn = false, pageParams = {} } = req.body;

  try {
    const collection = await getCollection(tableName);

    if (!tableName || !collection) {
      const error = new Error('Invalid tableName so collection not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const { page = 1, perPage = 100 } = pageParams || {};

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(perPage);
    const skip = (pageNumber - 1) * limitNumber;

    const data = await collection
      .find(payload)
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const total = await collection.countDocuments(payload);

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
      pagination: {
        totalItems: total,
        totalPages: total ? Math.ceil(total / limitNumber) : 0,
        page: pageNumber,
        perPage: limitNumber,
      },
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

const mongooseUpdateCollectionData = async (req, res) => {
  const { tableName, id, payload, isCallBackFn = false } = req.body;

  try {
    const collection = await getCollection(tableName);

    if (!tableName || !collection || !id) {
      const error = new Error('Invalid tableName so collection not found || id not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const update = await collection.findOneAndUpdate({ _id: id }, { $set: { ...payload } });
    const data = await collection.find({ _id: id });

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

const mongooseDeleteCollectionData = async (req, res) => {
  const { tableName, id, isCallBackFn = false } = req.body;

  try {
    const collection = await getCollection(tableName);

    if (!tableName || !collection || !id) {
      const error = new Error('Invalid tableName so collection not found || id not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const data = await collection.deleteOne({ _id: id });

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

const mongooseDeleteManyCollectionData = async (req, res) => {
  const { tableName, payload, isCallBackFn = false } = req.body;

  try {
    const collection = await getCollection(tableName);

    if (!tableName || !collection || !payload) {
      const error = new Error('Invalid tableName so collection not found || id not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const data = await collection.deleteMany({ ...payload });

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

const mongooseUpdateManyCollectionData = async (req, res) => {
  const { tableName, payload, isCallBackFn = false } = req.body;

  try {
    const collection = await getCollection(tableName);

    if (!tableName || !collection || !payload) {
      const error = new Error('Invalid tableName so collection not found || id not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const data = await collection.updateMany(payload.filter, payload.update);

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

const updatedSequenceId = async (req, res) => {
  const { payload, isCallBackFn = false } = req.body;

  try {
    const { type } = payload;
    const collection = await getCollection(MONGO_SEQUENCE_ID);

    if (!collection || !payload) {
      const error = new Error('Invalid tableName so collection not found');
      error.status = 400; // Bad Request
      throw error;
    }

    const allCollections = type ? await collection.find({ type }).exec() : [];

    const data = allCollections.length
      ? await collection.findOneAndUpdate({ _id: allCollections[0]._id }, { $set: { ...payload } })
      : await collection.create(payload);

    const collectionResponse = {
      status: 200,
      statusText: 'Success',
      data,
    };

    return isCallBackFn
      ? collectionResponse
      : res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(collectionResponse)
        .end();
  } catch (e) {
    return isCallBackFn ? { error: JSON.stringify(e) } : handleError(res, e);
  }
};

module.exports = {
  mongooseCreateCollectionData,
  mongooseFindCollectionData,
  mongooseUpdateCollectionData,
  mongooseDeleteCollectionData,
  mongooseDeleteManyCollectionData,
  mongooseUpdateManyCollectionData,
  updatedSequenceId,
};
