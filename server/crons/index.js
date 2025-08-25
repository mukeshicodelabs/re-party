// const schedule = require('node-schedule');
const schedule = require('node-cron');
const createDepositIntent = require('./reauthoriseDeposits');

module.exports = () => {
  console.log('running cron');
  const reauthorizeDepositsJob = () => {
    console.log('initialising createPayoutsJob');
    // Run every 6 hours: midnight, 6am, 12pm, 6pm
    // schedule.schedule('*/1 * * * *', async function() {
    schedule.schedule('0 */6 * * *', async function() {
      try {
        await createDepositIntent();
      } catch (err) {
        console.error('Cron job failed:', err.message);
      }
    });
  };

  reauthorizeDepositsJob();
};
