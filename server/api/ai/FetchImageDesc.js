const axios = require('axios').default;
const BASE_URL = process.env.REACT_APP_AI_URL;
const GENERATE_ENDPOINT = '/generate-mockup-prompts';

const FetchImageDesc = async (req, res) => {
  const { metadata } = req.body;
  if (!metadata) {
    return res.status(400).json({
      error: 'Description is required.',
    });
  }
  try {
    let data = JSON.stringify({metadata});
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BASE_URL}/${GENERATE_ENDPOINT}?`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: data,
    };
    axios.request(config).then(response => {
      return res.status(200).json({ status: "success", data: response?.data || {} });
    });
  } catch (error) {
    console.error('Error fetching image description:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}; 



module.exports = { FetchImageDesc };
