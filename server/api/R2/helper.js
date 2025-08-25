// Allowed file types
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  pdf: ['application/pdf'],
};

// Middleware to validate file type
const validateFileType = (req, res, next) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const validTypes = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!validTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  next();
};

// Helper function to get file type category
const getFileCategory = mimetype => {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }
  return 'other';
};

module.exports = {
  validateFileType,
  getFileCategory,
};
