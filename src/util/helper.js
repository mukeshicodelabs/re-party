import { categorLabel } from "./constants";

export function base64ToFile(base64String, filename, mimeType) {
  try {
    const byteString = atob(base64String); // No need to split if it's raw
    const byteArray = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    return new File([byteArray], filename, { type: mimeType });
  } catch (error) {
    console.error("Invalid Base64 string:", error);
    return null;
  }
}

export function getListingTypeLabel(listingType) {
  switch (listingType) {
    case 'sell':
      return 'Sell';
    case 'rent':
      return 'Rent';
    default:
      return 'Both';
  }
}

export function getCategoryKeyByLabel(label, categories) {
  const matchedCategory = categories?.find(cat => cat.label === label);
  return matchedCategory ? matchedCategory.key : null;
}

export const getEventTypeLabels = (eventTypes, config) => {
  // Find the event_type field in listingFields
  const eventTypeField = config.listing.listingFields?.find(field => field.key === 'event_type');
  
  // If event_type field is not found, return null or empty array
  if (!eventTypeField || !eventTypeField.enumOptions) {
    return [];
  }

  // Map the provided event type options to their labels
  return eventTypes?.map(eventType => {
    const option = eventTypeField.enumOptions?.find(opt => opt.option === eventType);
    return option ? option.label : null;
  })?.filter(label => label !== null); // Filter out any null values
}

export const getColorLabels = (colors, config) => {
  // Find the select_color field in listingFields
  const colorField = config.listing.listingFields?.find(field => field.key === 'select_color');
  
  // If select_color field is not found, return empty array
  if (!colorField || !colorField.enumOptions) {
    return [];
  }

  // Map the provided color options to their labels
  return colors?.map(color => {
    const option = colorField.enumOptions?.find(opt => opt.option === color);
    return option ? option.label : null;
  })?.filter(label => label !== null); // Filter out any null values
}

export const getCategoryLabel = (categoryKey)  => {
  const category = categorLabel?.find(cat => cat.key === categoryKey);
  return category ? category.label : null;
}
