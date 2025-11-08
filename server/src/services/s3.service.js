// /pro_livechat/server/src/services/s3.service.js

// Ambil "Konektor" MinIO kita (getter)
const s3Config = require('../config/s3.config');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Ambil nama "ember" kita dari .env
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// --- (A) FUNGSI UNTUK MEMBUAT LINK UPLOAD AMAN ---
// (Dashboard React akan panggil ini)
const generateUploadUrl = async (fileName, fileType, websiteId) => {
  // Cek apa MinIO-nya nyala
  const s3Client = s3Config.getS3Client();
  if (!s3Client) {
    throw new Error('S3 Client (MinIO) tidak siap.');
  }

  // Buat nama file unik
  // Misal: "knowledge/id-website-abc/1678886400_faq.pdf"
  const s3Key = `knowledge/${websiteId}/${Date.now()}_${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: fileType, // Misal: 'application/pdf'
  });

  try {
    // Buat URL yang berlaku 10 menit (600 detik)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    // Kembalikan URL-nya dan Key-nya
    return {
      uploadUrl: signedUrl, // URL untuk di-upload oleh client
      s3Key: s3Key,       // Path file-nya di S3 (untuk disimpan di DB)
    };
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ msg: '[S3 Service] GAGAL membuat pre-signed URL', error: error && (error.stack || error.message || error) });
    throw error;
  }
};

// --- (B) FUNGSI UNTUK DOWNLOAD FILE DARI S3/MINIO ---
// (Parsing Service akan panggil ini)
const downloadFileFromS3 = async (s3Key) => {
  const s3Client = s3Config.getS3Client();
  if (!s3Client) {
    throw new Error('S3 Client (MinIO) tidak siap.');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  try {
    const response = await s3Client.send(command);
    // Ubah 'ReadableStream' jadi 'Buffer' (yang bisa dibaca pdf-parse)
    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });

    const buffer = await streamToBuffer(response.Body);
    return buffer;

  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ msg: '[S3 Service] GAGAL mengunduh file dari MinIO', error: error && (error.stack || error.message || error) });
    throw error;
  }
};

module.exports = {
  generateUploadUrl,
  downloadFileFromS3,
};