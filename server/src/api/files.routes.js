// /server/src/api/files.routes.js
// 🆕 V23: File Upload/Download Routes

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../../models');
const storageService = require('../services/storage.service');
const logger = require('../utils/logger');

// Middleware untuk autentikasi admin
//const { adminAccess } = require('./middleware/adminAccess');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5 // Max 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  }
});

/**
 * POST /api/files/upload
 */
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const files = req.files;

    logger.info(`[Files API] Upload request: ${files?.length || 0} files for conversation ${conversationId}`);

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Determine uploader
    let uploaderType, uploaderId;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      uploaderType = 'admin';
      uploaderId = decoded.id;
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Create message
    const message = await db.Message.create({
      conversationId,
      senderType: uploaderType,
      senderId: uploaderId,
      content: content || 'Sent file(s)',
      contentType: 'file'
    });

    // Upload files
    const uploadedFiles = [];
    for (const file of files) {
      const storedFilename = `${uuidv4()}-${file.originalname}`;
      
      await storageService.uploadFile(file.buffer, storedFilename, file.mimetype);

      const fileRecord = await db.File.create({
        messageId: message.id,
        conversationId,
        originalFilename: file.originalname,
        storedFilename,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath: storedFilename,
        storageBucket: storageService.BUCKET_NAME,
        uploaderType,
        uploaderId,
        virusScanStatus: 'pending'
      });

      uploadedFiles.push(fileRecord);
    }

    logger.info(`[Files API] Successfully uploaded ${uploadedFiles.length} files`);

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', {
        ...message.toJSON(),
        files: uploadedFiles.map(f => f.toJSON())
      });
    }

    res.status(201).json({
      message: message.toJSON(),
      files: uploadedFiles.map(f => f.toJSON())
    });
  } catch (error) {
    logger.error(`[Files API] Upload error: ${error.message}`);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
});

/**
 * GET /api/files/:id/download
 */
router.get('/:id/download', async (req, res) => {
  try {
    const file = await db.File.findByPk(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileStream = await storageService.downloadFile(file.storedFilename);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
    res.setHeader('Content-Length', file.fileSize);

    fileStream.pipe(res);
  } catch (error) {
    logger.error(`[Files API] Download error: ${error.message}`);
    res.status(500).json({ error: 'File download failed' });
  }
});

/**
 * GET /api/files/conversation/:conversationId
 * Return list of files for a conversation (metadata only)
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId) return res.status(400).json({ error: 'Conversation ID required' });

    const files = await db.File.findAll({
      where: { conversationId },
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({ files });
  } catch (error) {
    logger.error('[Files API] List by conversation error: ' + (error && (error.stack || error.message)));
    res.status(500).json({ error: 'Failed to list files' });
  }
});

module.exports = router;