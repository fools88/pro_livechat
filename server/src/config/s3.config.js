// /pro_livechat/server/src/config/s3.config.js

require('dotenv').config();
const logger = require('../utils/logger');
const { S3Client } = require('@aws-sdk/client-s3');

let s3Client = null;

const initS3 = (opts = {}) => {
  const region = process.env.S3_REGION || opts.S3_REGION;
  const accessKey = process.env.AWS_ACCESS_KEY_ID || opts.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY || opts.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT || opts.S3_ENDPOINT;

  if (!region || !accessKey || !secretKey || !endpoint) {
    logger.warn('[Storage] Peringatan: S3/MinIO keys (Endpoint, Region, Access Key, Secret Key) tidak ditemukan di .env. Fitur upload file tidak akan berjalan.');
    return;
  }

  try {
    s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
    logger.info(`[Storage] MinIO S3-Compatible Client (di ${endpoint}) siap.`);
  } catch (error) {
    logger.error({ msg: '[Storage] GAGAL terhubung ke MinIO Client', error: error && (error.stack || error.message || error) });
  }
};

const getS3Client = () => s3Client;

module.exports = {
  initS3,
  getS3Client,
};