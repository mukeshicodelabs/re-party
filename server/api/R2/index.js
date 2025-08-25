const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getFileCategory } = require('./helper');
const { R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
const path = require('path');
const { getR2Client } = require('../../api-util/sdk');

const uploadFileToR2 = async (req, res) => {
  try {
    const R2 = getR2Client();
    const { filePath } = req.body;
    const file = req.file;
    const fileCategory = getFileCategory(file.mimetype);
    const fileExtension = path.extname(file.originalname);

    // special characters in filename were causing error in Metadata
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Generate unique filename
    const filename = `${filePath}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${fileExtension}`;
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalname: sanitizedOriginalName,
        category: fileCategory,
      },
    });

    await R2.send(command);

    // Generate public URL
    const publicUrl = `${R2_PUBLIC_DOMAIN}/${filename}`;

    return res.status(200).json({
      success: true,
      file: {
        url: publicUrl,
        filename: filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        category: fileCategory,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

const deleteFileFromR2 = async (req, res) => {
  try {
    const R2 = getR2Client();
    const { filename } = req.body;

    // Validate filename is provided
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Create delete command
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
    });

    // Execute delete operation
    await R2.send(command);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      filename,
    });
  } catch (error) {
    console.error('Delete error:', error);

    // Handle specific error scenarios
    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(500).json({ error: 'Failed to delete file' });
  }
};

module.exports = {
  uploadFileToR2,
  deleteFileFromR2,
};
