const moment = require("moment");
const { getISdk } = require('../../api-util/sdk');
const { updateSearchData, deleteSearchData } = require('../algolia/alogoliaSearch');
const sequence = require("../../models/sequence");

const REACT_APP_ALGOLIA_LISTING_INDEX = process.env.REACT_APP_ALGOLIA_LISTING_INDEX;
const startTime = moment().subtract(5, "minutes").toDate();

const EVENT_TYPE_LISTING_UPDATED = "listing/updated";
const EVENT_RESOURCE_TYPE_LISTING = "listing";
const MONGO_SEQUENCE_ID_UPDATE_ALGOLIA_LISTINGS_TYPE = "UPDATE_ALGOLIA_LISTINGS";
const EVENT_TYPE_LISTING_DELETED = "listing/deleted";


// const ENV_MODE = process.env.NODE_ENV;
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
    const isdk = getISdk();
    const { auditData, resource: currentListing, eventType, resourceId, source } = event.attributes;
    const listingId = resourceId?.uuid;
    const updatedFromFlex = Boolean(auditData?.adminId);
    const { state, publicData } = currentListing?.attributes || {};

    if (!listingId) {
      console.warn('analyzeEvent: Missing listingId, skipping event processing.');
      return;
    }

    // console.log(`analyzeEvent: Processing event - ${eventType} for Listing ID: ${listingId}`);
    const getLabelOfValue = (value = "") => {
      try {
        if (!value) return "";

        return value
          .replace(/[-_]/g, " ") // handle snake_case and kebab-case
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      } catch (error) {
        console.error("Error in getLabelOfValue:", error);
        return value; // fallback to original value
      }
    };

    const { category, event_type, select_color } = publicData || {}
    const payload = {
      body: {
        indexName: REACT_APP_ALGOLIA_LISTING_INDEX,
        isCallbackFn: true,
        data: [{
          objectID: listingId,
          title: currentListing?.attributes?.title,
          description: currentListing?.attributes?.description,
          ...publicData,
          state,
          category: getLabelOfValue(category),
          event_type: event_type?.map(el => getLabelOfValue(el)),
          select_color: select_color?.map(el => getLabelOfValue(el))
        }],
      },
    };

    if (eventType === EVENT_TYPE_LISTING_DELETED) {
      // console.log(`analyzeEvent: Deleting listing ${listingId} from Algolia.`);
      await deleteSearchData(payload);
    } else if (updatedFromFlex && eventType === EVENT_TYPE_LISTING_UPDATED) {
      // console.log(`analyzeEvent: Updating listing ${listingId} in Algolia.`);
      await updateSearchData(payload);
      // console.log(`analyzeEvent: Done listing ${listingId} in Algolia.`);
    } else {
      // console.log(`analyzeEvent: No action taken for event type: ${eventType}`);
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
      type: MONGO_SEQUENCE_ID_UPDATE_ALGOLIA_LISTINGS_TYPE,
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
      { type: MONGO_SEQUENCE_ID_UPDATE_ALGOLIA_LISTINGS_TYPE },
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
const updateAlgoliaListings = async () => {
  try {
    const sequenceId = await loadLastEventSequenceId();

    const params = sequenceId ? { startAfterSequenceId: sequenceId } : { createdAtStart: startTime };
    const iSdk = getISdk();

    const res = await iSdk.events.query({
      ...params,
      eventTypes: [EVENT_TYPE_LISTING_UPDATED, EVENT_TYPE_LISTING_DELETED],
    });

    const events = res.data.data;

    await Promise.all(events.map(analyzeEvent));

    // Save the last processed event sequence ID if events were received
    if (events.length) {
      const lastEvent = events[events.length - 1];
      await saveLastEventSequenceId(lastEvent.attributes.sequenceId);
    }
  } catch (error) {
    console.error('Error in updateAlgoliaListings:', error);
  }
};

module.exports = { updateAlgoliaListings };
