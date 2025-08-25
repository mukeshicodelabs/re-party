
export const States = [
    { option: "AL", label: "Alabama" },
    { option: "AK", label: "Alaska" },
    { option: "AZ", label: "Arizona" },
    { option: "AR", label: "Arkansas" },
    { option: "CA", label: "California" },
    { option: "CO", label: "Colorado" },
    { option: "CT", label: "Connecticut" },
    { option: "DE", label: "Delaware" },
    { option: "DC", label: "District of Columbia" },
    { option: "FL", label: "Florida" },
    { option: "GA", label: "Georgia" },
    { option: "HI", label: "Hawaii" },
    { option: "ID", label: "Idaho" },
    { option: "IL", label: "Illinois" },
    { option: "IN", label: "Indiana" },
    { option: "IA", label: "Iowa" },
    { option: "KS", label: "Kansas" },
    { option: "KY", label: "Kentucky" },
    { option: "LA", label: "Louisiana" },
    { option: "ME", label: "Maine" },
    { option: "MD", label: "Maryland" },
    { option: "MA", label: "Massachusetts" },
    { option: "MI", label: "Michigan" },
    { option: "MN", label: "Minnesota" },
    { option: "MS", label: "Mississippi" },
    { option: "MO", label: "Missouri" },
    { option: "MT", label: "Montana" },
    { option: "NE", label: "Nebraska" },
    { option: "NV", label: "Nevada" },
    { option: "NH", label: "New Hampshire" },
    { option: "NJ", label: "New Jersey" },
    { option: "NM", label: "New Mexico" },
    { option: "NY", label: "New York" },
    { option: "NC", label: "North Carolina" },
    { option: "ND", label: "North Dakota" },
    { option: "OH", label: "Ohio" },
    { option: "OK", label: "Oklahoma" },
    { option: "OR", label: "Oregon" },
    { option: "PA", label: "Pennsylvania" },
    { option: "RI", label: "Rhode Island" },
    { option: "SC", label: "South Carolina" },
    { option: "SD", label: "South Dakota" },
    { option: "TN", label: "Tennessee" },
    { option: "TX", label: "Texas" },
    { option: "UT", label: "Utah" },
    { option: "VT", label: "Vermont" },
    { option: "VA", label: "Virginia" },
    { option: "WA", label: "Washington" },
    { option: "WV", label: "West Virginia" },
    { option: "WI", label: "Wisconsin" },
    { option: "WY", label: "Wyoming" }
  ];

  export const customizableAddons = [
    { key: 'setUpFee', label: 'Setup Fee' },
    { key: 'lateFee', label: 'Late Return Fee' },
    { key: 'deposit', label: 'Deposit Fee' },
  ];
  export const deliveryRanges = [
    { key: '0_10', label: '0 - 10 miles' },
    { key: '11_20', label: '11 - 20 miles' },
    { key: '21_40', label: '21 - 40 miles' },
    { key: '41_plus', label: '41+ miles' },
  ];
  export const allProductsType = [
    { key: "sell", label: "For Sale" ,value:'sell-purchase'},
    { key: "rent", label: "For Rent",value:'Rental_booking' },
    { key: "both", label: "For Sell & Rent", value:'both-sale-&-purchase' }
  ]
  export const deliveryOptions = [
    { key: 'pickup', label: 'Pickup' },
    { key: 'shipping', label: 'Delivery' },
  ];
  export const sellDeliveryOptions = [
    { key: 'pickup', label: 'Pickup' },
    { key: 'shipping', label: 'Shipping by shippo' },
    { key: 'customShipping', label: 'Custom Shipping' },
  ];
  export const shippingOptions = [
    { key: 'sameAsPickupAddress', label: 'Same As Pickup Address' },
    { key: 'addNewAddress', label: 'Add New Address' },
  ];

  export const categories=[
    {key:'backdrop_decor',label: "Backdrop & Decor"} ,
    {key:'tabletop_centerpieces',label: "Tabletop & Centerpieces"} ,
    {key:'serveware',label: "Serveware"} ,
    {key:'party_tableware',label: "Party Tableware"} ,
    {key:'bundles_kits',label: "Bundles & Kits"} ,
    {key:'Furniture_and_lounge',label: "Furniture & Lounge"} ,
  ];
  export const staticAiTags = [
    { key: 'ai_tags', label: '#Ai Tags' },
    { key: 'keep_ai_tags', label: '#Keep Ai Tags' },
    { key: 'remove_ai_tags', label: '#Remove Ai Tags' },
  ];      
  export const tagsType = [
    { option: 'keep_ai_tags', label: 'Use Suggested Tags' },
    { option: 'keep_manual_tags', label: 'Choose Your Own Tags' }
  ];

  export const categorLabel=[
    {key:'backdrop_decor',label: "Backdrop & Decor"} ,
    {key:'tabletop_centerpieces',label: "Tabletop & Centerpieces"} ,
    {key:'serveware',label: "Serveware"} ,
    {key:'party_tableware',label: "Party Tableware"} ,
    {key:'bundles_kits',label: "Bundles & Kits"} ,
    {key:'Furniture_and_lounge',label: "Furniture & Lounge"} ,
  ];

// Shipping box size options with static headers
export const shippingBoxSizes = [
  { 
    key: 'header_flat_rate_box', 
    label: 'Small Flat Rate Box – ',
    disabled: true,
    isHeader: true
  },
  { key: '8.69x5.44x1.75', label: '8.69" x 5.44" x 1.75"' },
  
  // Static header for Medium Flat Rate Box (Top Loading)
  { 
    key: 'header_medium_top', 
    label: 'Medium Flat Rate Box (Top Loading)',
    disabled: true,
    isHeader: true
  },
  { key: '11.25x8.75x6', label: '11.25" x 8.75" x 6"' },
  
  // Static header for Medium Flat Rate Box (Side Loading)
  { 
    key: 'header_medium_side', 
    label: 'Medium Flat Rate Box (Side Loading)',
    disabled: true,
    isHeader: true
  },
  { key: '14x12x3.5', label: '14" x 12" x 3.5"' },
  
  // Static header for Large Flat Rate Box
  { 
    key: 'header_large', 
    label: 'Large Flat Rate Box –',
    disabled: true,
    isHeader: true
  },
  { key: '12.25x12.25x6', label: '12.25" x 12.25" x 6"' },
  
  // Static header for Standard Sizes
  // { 
  //   key: 'header_standard', 
  //   label: 'Standard Sizes',
  //   disabled: true,
  //   isHeader: true
  // },
  { key: '6x6x6', label: '6" x 6" x 6"' },
  { key: '8x6x4', label: '8" x 6" x 4"' },
  { key: '9x6x3', label: '9" x 6" x 3"' },
  { key: '12x9x4', label: '12" x 9" x 4"' },
  { key: '12x12x6', label: '12" x 12" x 6"' },
  { key: '14x10x4', label: '14" x 10" x 4"' },
  { key: '16x12x8', label: '16" x 12" x 8"' },
  { key: '18x12x6', label: '18" x 12" x 6"' },
  { key: '20x14x6', label: '20" x 14" x 6"' },
  { key: '24x18x6', label: '24" x 18" x 6"' },
  { key: '24x4x4', label: '24" x 4" x 4"' },
  { key: '30x6x6', label: '30" x 6" x 6"' },
  { key: '36x6x6', label: '36" x 6" x 6"' },
  { key: '48x4x4', label: '48" x 4" x 4"' },
]