// /pro_livechat/server/src/api/controllers/upload.controller.js

const s3Service = require('../../services/s3.service');
const logger = require('../../utils/logger');

// Ini adalah API #1 (Minta Link)
exports.getKnowledgeUploadUrl = async (req, res) => {
  const { websiteId } = req.params;
  const { fileName, fileType } = req.body; // Misal: "faq.pdf", "application/pdf"

  if (!fileName || !fileType) {
    return res.status(400).json({ message: 'fileName dan fileType wajib diisi.' });
  }

  try {
    const { uploadUrl, s3Key } = await s3Service.generateUploadUrl(
      fileName,
      fileType,
      websiteId
    );

    // Kirim link-nya kembali ke React
    res.status(200).json({ uploadUrl, s3Key });

  } catch (error) {
    logger.error('[Upload Controller] GAGAL buat link S3: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Gagal membuat link upload.' });
  }
};