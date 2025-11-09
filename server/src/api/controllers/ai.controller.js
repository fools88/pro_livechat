// /pro_livechat/server/src/api/controllers/ai.controller.js
// (VERSI V16.1 FINAL - MODEL ALIAS FIXED & KATEGORI)

const db = require('../../../models');
const AIPersona = db.AIPersona;
const AIRule = db.AIRule;
const AIKnowledge = db.AIKnowledge;
const KnowledgeCategory = db.KnowledgeCategory; // <-- (IMPORT V15)
const s3Service = require('../../services/s3.service');
const parsingService = require('../../services/parsing.service');
const logger = require('../../utils/logger');

// --- (A) FUNGSI SETTING PERSONA (UPGRADE V16) ---
exports.setPersonaForWebsite = async (req, res) => {
  const { websiteId } = req.params;
  
  // Ambil 'field' V14 BARU dari body
  const { 
    nama_persona, 
    gaya_bicara, 
    salam_pembuka, 
    salam_penutup, 
    modelName // (Sekarang menggunakan alias stabil)
  } = req.body;

  // Validasi V14
  if (!nama_persona || !gaya_bicara || !modelName) {
    return res.status(400).json({ message: 'Nama Persona, Gaya Bicara, dan Model Name wajib diisi.' });
  }

  try {
    const personaData = {
      nama_persona, gaya_bicara, salam_pembuka, salam_penutup, modelName, websiteId
    };

    // Cari atau Buat
    let persona = await AIPersona.findOne({ where: { websiteId } });

    if (persona) {
      await persona.update(personaData);
      logger.info(`[AI Controller V16] Persona untuk ${websiteId} berhasil di-update.`);
    } else {
      persona = await AIPersona.create(personaData);
      logger.info(`[AI Controller V16] Persona untuk ${websiteId} berhasil dibuat.`);
    }

    res.status(200).json({ message: 'Persona AI berhasil disimpan.', persona });
  } catch (error) {
    logger.error('[AI Controller V16] Gagal menyimpan persona: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat menyimpan persona.' });
  }
};

// --- (B) FUNGSI MENGAMBIL PERSONA (UPGRADE V16.1) ---
exports.getPersonaForWebsite = async (req, res) => {
  const { websiteId } = req.params;

  try {
    const persona = await AIPersona.findOne({ where: { websiteId } });

    if (!persona) {
      // (FIX V16.1) - Fallback model menggunakan alias stabil
      return res.status(200).json({
        nama_persona: 'Asisten (Default)',
        gaya_bicara: 'Anda adalah asisten yang ramah dan profesional.',
        salam_pembuka: 'Halo kak, ada yang bisa dibantu?',
        salam_penutup: 'Ada lagi yang bisa dibantu?',
        modelName: 'gemini-2.0-flash' // ✅ UPGRADED: Better quota (15 RPM vs 10)
      });
    }

    res.status(200).json(persona);
  } catch (error) {
    res.status(500).json({ message: 'Server error saat mengambil persona.' });
  }
};

// --- (C) FUNGSI ATURAN (RULE) BARU ---
exports.createRuleForWebsite = async (req, res) => {
    const { websiteId } = req.params;
    const { targetType, targetValue, action } = req.body;
    try {
        const newRule = await AIRule.create({ websiteId, targetType, targetValue, action });
        res.status(201).json({ message: "Aturan AI baru berhasil dibuat.", rule: newRule });
    } catch (error) {
         res.status(500).json({ message: 'Server error saat membuat aturan.' });
    }
};

// --- (D) FUNGSI MENGAMBIL SEMUA ATURAN ---
exports.getRulesForWebsite = async (req, res) => {
    const { websiteId } = req.params;
    try {
        const rules = await AIRule.findAll({ where: { websiteId } });
        res.status(200).json(rules);
    } catch (error) {
        res.status(500).json({ message: 'Server error saat mengambil aturan.' });
    }
};

// --- (E) FUNGSI MENGHAPUS ATURAN ---
exports.deleteRule = async (req, res) => {
    const { ruleId } = req.params;
    try {
        const rule = await AIRule.findByPk(ruleId);
        if (!rule) { return res.status(404).json({ message: 'Aturan tidak ditemukan.' }); }
        await rule.destroy();
        res.status(200).json({ message: 'Aturan AI berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error saat menghapus aturan.' });
    }
};

// --- (F) FUNGSI MEMPROSES FILE (UPGRADE V16) ---
exports.processKnowledgeFile = async (req, res) => {
  const { websiteId } = req.params;
  const { s3Key, fileName, categoryId } = req.body; 

  if (!s3Key || !fileName) {
    return res.status(400).json({ message: 's3Key dan fileName wajib diisi.' });
  }
  if (!categoryId) {
    return res.status(400).json({ message: 'categoryId wajib diisi.' });
  }

  let knowledgeFile;
  try {
    knowledgeFile = await AIKnowledge.create({
      websiteId,
      fileName,
      s3Url: s3Key,
      status: 'PROCESSING',
      categoryId: categoryId 
    });

  logger.info(`[AI Controller] Mengunduh file dari MinIO: ${s3Key}`);
  const fileBuffer = await s3Service.downloadFileFromS3(s3Key);

  logger.info(`[AI Controller] Memulai proses parsing & embedding...`);
    const { success, chunkCount } = await parsingService.processFile(
      fileBuffer,
      fileName,
      websiteId,
      knowledgeFile.id,
      categoryId 
    );

    if (success) {
      knowledgeFile.status = 'COMPLETED';
      await knowledgeFile.save();
      res.status(200).json({ 
        message: `File berhasil diproses. ${chunkCount} "otak" baru ditambahkan ke Kategori.`,
        knowledgeFile,
      });
    } else {
      throw new Error('Tidak ada data yang bisa diproses dari file.');
    }

  } catch (error) {
    logger.error('[AI Controller] GAGAL memproses Knowledge File: ' + (error && (error.stack || error.message)));
    if (knowledgeFile) {
      knowledgeFile.status = 'FAILED';
      await knowledgeFile.save();
    }
    res.status(500).json({ message: `Gagal memproses file: ${error.message}` });
  }
};

// --- (G) FUNGSI BARU V16: MEMBUAT KATEGORI ---
exports.createCategory = async (req, res) => {
  const { websiteId } = req.params;
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
  }
  try {
    const newCategory = await KnowledgeCategory.create({ name, description, websiteId });
    res.status(201).json({ message: "Kategori baru berhasil dibuat.", category: newCategory });
  } catch (error) {
    logger.error('[AI Controller V16] Gagal membuat kategori: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat membuat kategori.' });
  }
};

// --- (H) FUNGSI BARU V16: MENGAMBIL SEMUA KATEGORI ---
exports.getCategoriesForWebsite = async (req, res) => {
  const { websiteId } = req.params;
  try {
    const categories = await KnowledgeCategory.findAll({ 
      where: { websiteId },
      order: [['name', 'ASC']]
    });
    res.status(200).json(categories);
  } catch (error) {
      logger.error('[AI Controller V16] Gagal mengambil kategori: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat mengambil kategori.' });
  }
};
