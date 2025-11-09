// /server/src/services/storage.service.js
// MinIO/S3 Storage Service untuk File Sharing V23

const Minio = require('minio');
const logger = require('../utils/logger');

// Initialize MinIO client
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
  secretKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin123'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'prochat-files';

/**
 * Initialize MinIO bucket - create if doesn't exist
 */
async function initBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`[Storage] MinIO bucket '${BUCKET_NAME}' created`);
    } else {
      logger.info(`[Storage] MinIO bucket '${BUCKET_NAME}' ready`);
    }
  } catch (error) {
    logger.error(`[Storage] Failed to initialize bucket: ${error.message}`);
    throw error;
  }
}

/**
 * Upload file to MinIO
 */
async function uploadFile(fileBuffer, storedFilename, mimeType) {
  try {
    await minioClient.putObject(
      BUCKET_NAME,
      storedFilename,
      fileBuffer,
      fileBuffer.length,
      { 'Content-Type': mimeType }
    );
    
    logger.info(`[Storage] File uploaded: ${storedFilename}`);
    return storedFilename;
  } catch (error) {
    logger.error(`[Storage] Upload failed: ${error.message}`);
    throw error;
  }
}

/**
 * Download file from MinIO as stream
 */
async function downloadFile(storedFilename) {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, storedFilename);
    logger.info(`[Storage] File downloaded: ${storedFilename}`);
    return stream;
  } catch (error) {
    logger.error(`[Storage] Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * Delete file from MinIO
 */
async function deleteFile(storedFilename) {
  try {
    await minioClient.removeObject(BUCKET_NAME, storedFilename);
    logger.info(`[Storage] File deleted: ${storedFilename}`);
  } catch (error) {
    logger.error(`[Storage] Delete failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initBucket,
  uploadFile,
  downloadFile,
  deleteFile,
  BUCKET_NAME
};