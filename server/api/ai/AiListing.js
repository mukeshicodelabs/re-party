const { default: axios } = require('axios');
const { handleError } = require('../../api-util/sdk');

const BASE_URL = process.env.REACT_APP_AI_URL;

const generateAiListing = async (req, res) => {
  const { images , heroImageId} = req.body;
  const payload = {
    image_url: images.length > 0 ? images[0] : '',
  };

  try {
    const [
      hashtagResponse,
      seoResponse,
      categoriesResponse,
    ] = await Promise.all([
      axios.post(`${BASE_URL}/api/hashtags/generate`, payload),
      axios.post(`${BASE_URL}/api/seo/generate`, payload),
      axios.post(`${BASE_URL}/api/category/classify`, payload),
    ]);

    const result = {
      hashtags: hashtagResponse.data,
      seoData: seoResponse.data,
      categoriesData: categoriesResponse.data,
    };
    
    return res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send({ data: result })
      .end();
  } catch (e) {
    console.error(e, 'Error in generateAiListing');
    return res
      .status(500)
      .set('Content-Type', 'application/transit+json')
      .send({ error: 'Failed to generate AI listing', details: e.message }); 
  }
};

module.exports = { generateAiListing };
