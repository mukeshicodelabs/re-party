const moment = require('moment');
const { getISdk, handleError, getSdk } = require('../api-util/sdk');
const integrationSdk = getISdk();
const sharetribeSdk = require('sharetribe-flex-sdk');
const { types } = sharetribeSdk;
const { UUID } = types;

const checkCalenderAvailability = async (req, res) => {
  const sdk = getSdk(req, res);
  try {
    const { bookmarks } = req.body;
    const responses = [];

    for (let index = 0; index < bookmarks.length; index++) {
      const { id, startDate, endDate } = bookmarks[index];
      const response = await sdk.timeslots.query({
        listingId: id,
        start: new Date(moment(endDate).startOf().toDate()),
        end: new Date(moment(endDate).endOf().add(2, 'days').toDate()),
      });

      const eachResponse = (response && response.data && response.data.data) 
      ? response.data.data.filter((st, i) => {
          const start = moment(st.attributes.start);
          const end = moment(st.attributes.end);
          const durationMinutes = end.diff(start, 'minutes');
          return  durationMinutes > 1440;
        }) 
      : [];


      eachResponse.forEach(slot => {
        responses.push({
          id,
          data: eachResponse,
        });
      });
    }

    return res.status(200).send({
      data: responses,
    });
  } catch (e) {
    console.error('Error in checkCalenderAvailability:', e);
    return res.status(500).send({
      error: 'An error occurred while checking calendar availability.',
    });
  }
};

module.exports = { checkCalenderAvailability };
