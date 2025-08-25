const moment = require("moment");
const { getISdk } = require('../../api-util/sdk');
const { deleteSearchData } = require('../algolia/alogoliaSearch');
const sequence = require("../../models/sequence");

const REACT_APP_ALGOLIA_LISTING_INDEX = process.env.REACT_APP_ALGOLIA_LISTING_INDEX;
const startTime = moment().subtract(5, "minutes").toDate();

const EVENT_TYPE_LISTING_DELETED = "listing/deleted";
const DELETE_ALGOLIA_LISTINGS = "listingDeleted";
const EVENT_SOURCE_CONSOLE = 'source/console';
const EVENT_RESOURCE_TYPE_LISTING = "listing";

/**
 * Analyzes an event and updates Algolia if necessary.
 * @param {Object} event - The event object from Sharetribe.
 */
const analyzeEvent = async (event) => {
    if (!event?.attributes || event.attributes.resourceType !== EVENT_RESOURCE_TYPE_LISTING || !REACT_APP_ALGOLIA_LISTING_INDEX) {
        console.warn('analyzeEvent: Skipping processing due to invalid event structure or missing index.');
        return;
    }

    try {
        const { eventType, resourceId, source } = event.attributes;
        const listingId = resourceId?.uuid;

        if (!listingId) {
            console.warn('analyzeEvent: Missing listingId, skipping event processing.');
            return;
        }

        // console.log(`analyzeEvent: Processing event - ${eventType} for Listing ID: ${listingId}`);
        const payload = {
            body: {
                indexName: REACT_APP_ALGOLIA_LISTING_INDEX,
                isCallbackFn: true,
                data: { objectID: listingId },
            },
        };

        if (eventType === EVENT_TYPE_LISTING_DELETED && source === EVENT_SOURCE_CONSOLE) {
            console.log(`analyzeEvent: Deleting listing ${listingId} from Algolia.`);
            await deleteSearchData(payload);
          
        }

    } catch (error) {
        console.error('analyzeEvent: Error processing event:', error);
    }
};

/**
 * Retrieves the last processed event sequence ID from MongoDB.
 * @returns {Promise<string>} The last sequence ID or an empty string if not found.
 */
const loadLastEventSequenceId = async () => {
  try {
    const sequenceRecord = await sequence.findOne({
      type: DELETE_ALGOLIA_LISTINGS,
    });

    return sequenceRecord?.lastId || "";
  } catch (error) {
    console.error("Failed to load last event sequence ID:", error);
    return "";
  }
};

/**
 * Saves the last processed event sequence ID to MongoDB.
 * @param {string} lastSequenceId - The last event sequence ID to save.
 */
const saveLastEventSequenceId = async (lastSequenceId) => {
  try {
    await sequence.findOneAndUpdate(
      { type: DELETE_ALGOLIA_LISTINGS },
      { lastId: lastSequenceId },
      { new: true, upsert: true } // Create if not found
    );
  } catch (error) {
    console.error("Failed to save last event sequence ID:", error);
  }
};

/**
 * Queries Sharetribe for listing events and updates Algolia accordingly.
 */
const deleteAlgoliaListings = async () => {
    try {
        const sequenceId = await loadLastEventSequenceId();

        const params = sequenceId ? { startAfterSequenceId: sequenceId } : { createdAtStart: startTime };
        const iSdk = getISdk();

        const res = await iSdk.events.query({
            ...params,
            eventTypes: [EVENT_TYPE_LISTING_DELETED],
        });

        const events = res.data.data;

        await Promise.all(events.map(analyzeEvent));

        // Save the last processed event sequence ID if events were received
        if (events.length) {
            const lastEvent = events[events.length - 1];
            await saveLastEventSequenceId(lastEvent.attributes.sequenceId);
        }
    } catch (error) {
        console.error('Error in deleteAlgoliaListings:', error);
    }
};

module.exports = { deleteAlgoliaListings };
