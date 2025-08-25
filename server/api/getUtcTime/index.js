const moment = require('moment');

const getUtcTime = async (req, res) => {
  try {
    const utc = moment.utc().format();
    return res
      .status(200)
      .send({ date: utc })
      .end();
  } catch (error) {}
};

module.exports = { getUtcTime };
