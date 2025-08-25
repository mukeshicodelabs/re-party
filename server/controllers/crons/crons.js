const nodeCron = require('node-cron');
const { deleteAlgoliaListings } = require('./delete-listings');
const { updateAlgoliaListings } = require('./update-listings');


const runCronServices = process.env.RUN_ALL_CRON_SERVICES == "true";
const runDeleteListingsCron = process.env.RUN_DELETE_LISTINGS_CRON == "true";
const runUpdateListingsCron = process.env.RUN_UPDATE_LISTINGS_CRON == "true";


const runCron = () => {
 
        //  delete listing from algolia Cron run in 5 min
        nodeCron.schedule('*/5 * * * * *', () => {
                console.log('&&& delete algolia listing Cron run in every 5 minute &&& => ');
                deleteAlgoliaListings();
        });

        //  update listing in algolia Cron run in 5 min
        nodeCron.schedule('*/5 * * * * *', () => {
                console.log('&&& update algolia listing Cron run in every  minute &&& => ');
                updateAlgoliaListings();
        });

};

module.exports = { runCron };
