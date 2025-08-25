const axios = require('axios').default;
const { handleError } = require('../../api-util/sdk');

const BASE_URL = process.env.REACT_APP_AI_URL;
const GENERATE_ENDPOINT = '/api/mockup/generate';

const generateAiImage = async (req, res) => {
  const { images, description } = req.body;
  
  if (!images?.length || !description) {
    return res.status(400).json({
      error: 'Images and description are required.',
    });
  }

  try {
    const response = await axios.post(`${BASE_URL}${GENERATE_ENDPOINT}`, {
      image_urls: images,
      prompt: description,
    });
    const result = {
      imageData: response.data,
    }; 
    res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send({ data: result });
  } catch (error) {
    console.error('Error in generateAiListing:', error);
    handleError(res, error);
  }
};

module.exports = { generateAiImage };
