require('dotenv').config();
const logger = require('../src/utils/logger');
const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');

const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
const region = process.env.S3_REGION || 'us-east-1';
const accessKey = process.env.AWS_ACCESS_KEY_ID || 'minioadmin';
const secretKey = process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin123';
const bucket = process.env.S3_BUCKET_NAME || 'prochat-files';

const client = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId: accessKey, secretAccessKey: secretKey } });

(async () => {
  try {
    logger.info('Creating bucket: ' + bucket + ' on ' + endpoint);
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    logger.info('Bucket created (or already exists).');
    process.exit(0);
  } catch (e) {
    logger.error('Failed to create bucket: ' + (e && e.message));
    process.exit(2);
  }
})();
