const { handleError } = require('../api-util/sdk');
const { getDistance } = require('geolib');
const axios = require('axios');

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

// Helper to geocode an address using Mapbox
const geocodeAddress = async (address) => {
  if (!address) throw new Error('Address is required for geocoding');

  const encodedAddress = encodeURIComponent(address);
  const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}`;

  const response = await axios.get(geocodingUrl);

  const features = response?.data?.features || [];

  if (features.length > 0 && features[0].center?.length === 2) {
    const [lng, lat] = features[0].center;
    return { lat, lng };
  } else {
    throw new Error(`No geocode result found for address: ${address}`);
  }
};

const getRangeFee = (distance, deliveryFeeArray) => {
  if (!Array.isArray(deliveryFeeArray)) return null;

  for (let item of deliveryFeeArray) {
    const { range, rangeFee } = item;

    if (range === '41_plus' && distance > 41) {
      return rangeFee;
    }

    const [min, max] = range.split('_').map(Number);
    if (distance >= min && distance <= max) {
      return rangeFee;
    }
  }

  return null; // If no match found
};


// Main controller for distance calculation
const getLocationDistance = async (req, res) => {

  try {
    const { shippingLocation, userLocation, listing } = req.body;
 
    if (!shippingLocation?.selectedPlace?.address || !userLocation?.address) {
      return res.status(400).json({
        error: 'Both listingLocation and userLocation with valid address are required.',
      });
    }

    // Geocode both addresses in parallel
    const [listingCoords, userCoords] = await Promise.all([
      geocodeAddress(shippingLocation.selectedPlace.address),
      geocodeAddress(userLocation.address),
    ]);

    // Calculate distance in meters
    const distanceMeters = getDistance(
      { latitude: listingCoords.lat, longitude: listingCoords.lng },
      { latitude: userCoords.lat, longitude: userCoords.lng }
    );

    // Convert meters to miles
    const distanceInMiles = distanceMeters / 1609.34;
    // Get the deliveryFee array from the listing
    const customSellShippingFee = listing?.attributes?.publicData?.customSellShippingFee || [];
    const deliveryFeeArray = listing?.attributes?.publicData?.deliveryFee || customSellShippingFee|| [];

    // Match the range dynamically based on distance
    const matchedRangeFee = getRangeFee(distanceInMiles, deliveryFeeArray);

    return res.status(200).json({
      distance: distanceInMiles.toFixed(2),
      unit: 'miles',
      deliveryFee: matchedRangeFee || { amount: 0, currency: 'USD' },
      listingShippingLocation: listingCoords,
      userLocation: userCoords,
    });

  } catch (error) {
    console.error('Error in getLocationDistance:', error.message);
    return handleError(res, error);
  }
};

module.exports = { getLocationDistance };