// /dashboard/src/pages/AIPage.jsx
// (VERSI V16.1 FINAL - DROP DOWN MODEL FIXED & KATEGORI INTEGRATED)

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import aiService from '../services/ai.service';
import websiteService from '../services/website.service';

function AIPage() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');

  // --- State V14 (Persona) ---
  const [persona, setPersona] = useState({
    nama_persona: '', gaya_bicara: '', salam_pembuka: '',
    salam_penutup: '', modelName: 'gemini-2.5-flash' // <-- ALIAS STABIL
  });
  const [loadingPersona, setLoadingPersona] = useState(false);

  // --- State V13 (Rules) ---
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // --- State V16 (Knowledge Base) ---
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loadingUpload, setLoadingUpload] = useState(false);
  
  // --- STATE BARU V16 (KATEGORI) ---
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(''); // Untuk dropdown
  // --- AKHIR STATE BARU V16 ---

  const [globalError, setGlobalError] = useState('');

  // Ambil daftar website (Aman)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await websiteService.getAllWebsites();
        setWebsites(res.data);
        if (res.data.length > 0) {
          setSelectedWebsiteId(res.data[0].id);
        }
      } catch (err) {
        setGlobalError('Gagal memuat data website.');
      }
    };
    fetchAllData();
  }, []);

  // --- (MODIFIKASI V16) ---
  // Kita buat fungsi 'fetchCategories' yang bisa dipanggil ulang
  const fetchCategories = useCallback(async (websiteId) => {
    if (!websiteId) return;
    setLoadingCategories(true);
    try {
      const res = await aiService.getCategories(websiteId);
      setCategories(res.data);
      setSelectedCategoryId(''); 
      if (res.data.length > 0) {
        setSelectedCategoryId(res.data[0].id); 
      }
    } catch (err) {
      setGlobalError('Gagal memuat kategori AI.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Ambil SEMUA data (Persona, Rules, Kategori) saat website berubah
  useEffect(() => {
    if (selectedWebsiteId) {
      
      // 1. Ambil Persona (V14 - AMAN)
      const fetchPersona = async () => {
        try {
          const res = await aiService.getPersona(selectedWebsiteId);
          setPersona(res.data); 
        } catch (err) {
          setGlobalError('Gagal memuat persona AI.');
        }
      };
      fetchPersona();

      // 2. Ambil Rules (V13 - AMAN)
      const fetchRules = async () => {
        try {
          const res = await aiService.getRules(selectedWebsiteId);
          setRules(res.data);
        } catch (err) {
          setGlobalError('Gagal memuat aturan AI.');
        }
      };
      fetchRules();

      // 3. (BARU V16) Ambil Kategori
      fetchCategories(selectedWebsiteId);

    }
  }, [selectedWebsiteId, fetchCategories]); 

  // --- (HANDLER BARU V16: BUAT KATEGORI) ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName || !selectedWebsiteId) {
      setGlobalError('Nama kategori tidak boleh kosong.');
      return;
    }
    setLoadingCategories(true);
    setGlobalError('');
    try {
      await aiService.createCategory(selectedWebsiteId, newCategoryName, '');
      setNewCategoryName(''); 
      await fetchCategories(selectedWebsiteId); 
    } catch (err) {
      setGlobalError('Gagal membuat kategori baru.');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Handler V14 Persona (Aman)
  const handlePersonaChange = (e) => {
    const { name, value } = e.target;
    setPersona(prev => ({ ...prev, [name]: value }));
  };
  const handleSavePersona = async (e) => {
    e.preventDefault();
    setLoadingPersona(true);
    setGlobalError('');
    try {
      await aiService.setPersona(selectedWebsiteId, persona);
      setGlobalError('Persona berhasil disimpan!');
    } catch (err) {
      setGlobalError('Gagal menyimpan persona.');
    } finally {
      setLoadingPersona(false);
    }
  };

  // --- (MODIFIKASI V16: UPLOAD KNOWLEDGE) ---
  const handleUpload = async (e) => {
    e.preventDefault();
    // (VALIDASI BARU V16)
    if (!file || loadingUpload || !selectedWebsiteId || !selectedCategoryId) {
      setGlobalError('Harap pilih file DAN pilih kategori terlebih dahulu.');
      return;
    }

    setLoadingUpload(true);
    setUploadStatus('1/3: Meminta link upload...');
    setGlobalError('');
    try {
      const uploadRes = await aiService.getUploadUrl(selectedWebsiteId, file.name, file.type);
      const { uploadUrl, s3Key } = uploadRes.data;
      setUploadStatus('2/3: Mengupload file ke MinIO...');
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      
      setUploadStatus('3/3: Memulai pemrosesan AI...');
      // (KIRIM PAYLOAD V16 - TERMASUK KATEGORI ID)
      await aiService.processFile(selectedWebsiteId, s3Key, file.name, selectedCategoryId); 

      setUploadStatus('Sukses! Knowledge Base berhasil diperbarui.');
      setFile(null);
    } catch (err) {
      setUploadStatus('');
      setGlobalError(`Gagal: ${err.message || err.response?.data?.message}`);
    } finally {
      setLoadingUpload(false);
    }
  };

  // Atur Auto-Reply (V13 - Aman)
  const handleToggleAutoReply = async (e) => {
    const isAutoReplyActive = e.target.checked;
    setLoadingRules(true);
    setGlobalError('');
    const existingRule = rules.find(r => r.targetType === 'website' && r.action === 'AUTO_REPLY');
    try {
      if (isAutoReplyActive) {
        if (!existingRule) {
          await aiService.createRule(selectedWebsiteId, {
            targetType: 'website',
            targetValue: selectedWebsiteId,
            action: 'AUTO_REPLY'
          });
        }
      } else {
        if (existingRule) {
          await aiService.deleteRule(existingRule.id);
        }
      }
      const res = await aiService.getRules(selectedWebsiteId);
      setRules(res.data);
    } catch (err) {
      setGlobalError('Gagal mengubah pengaturan auto-reply.');
    } finally {
      setLoadingRules(false);
    }
  };

  // TAMPILAN UI
  return (
    <DashboardLayout>
      <h1>🤖 AI Engine Control Panel (V16)</h1>
      <p>Atur kepribadian, basis pengetahuan (Knowledge Base), dan aturan otomatisasi untuk setiap website.</p>

      {/* Website Selector (Aman) */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="website-select" style={{ fontWeight: 'bold' }}>Website yang Diatur:</label>
        <select
          id="website-select"
          value={selectedWebsiteId}
          onChange={(e) => setSelectedWebsiteId(e.target.value)}
          disabled={websites.length === 0}
        >
          {websites.length === 0 ? (
            <option value="">Tambah website dulu...</option>
          ) : (
            websites.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name} ({ws.url})</option>
            ))
          )}
        </select>
      </div>

      {selectedWebsiteId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

          {/* KOTAK 1: PERSONA AI (V16) */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2>1. Kepribadian (Persona)</h2>
            <form onSubmit={handleSavePersona}>
              {/* Input V14 #1 */}
              <label htmlFor="nama_persona">Nama Persona:</label>
              <input type="text" id="nama_persona" name="nama_persona" value={persona.nama_persona} onChange={handlePersonaChange} required />
              {/* Input V14 #2 */}
              <label htmlFor="gaya_bicara">Gaya Bicara (Prompt Inti):</label>
              <textarea id="gaya_bicara" name="gaya_bicara" value={persona.gaya_bicara} onChange={handlePersonaChange} rows="8" required style={{ width: '100%', resize: 'none' }}></textarea>

              {/* Input V14 #3 */}
              <label htmlFor="salam_pembuka">Salam Pembuka (Opsional):</label>
              <input type="text" id="salam_pembuka" name="salam_pembuka" value={persona.salam_pembuka} onChange={handlePersonaChange} />
              {/* Input V14 #4 */}
              <label htmlFor="salam_penutup">Salam Penutup (Opsional):</label>
              <input type="text" id="salam_penutup" name="salam_penutup" value={persona.salam_penutup} onChange={handlePersonaChange} />

              <label htmlFor="modelName" style={{ marginTop: '10px' }}>Model Gemini:</label>
              <select
                id="modelName"
                name="modelName" // PENTING
                value={persona.modelName}
                onChange={handlePersonaChange}
              >
                {/* --- (FIX V16.1: ALIAS STABIL) --- */}
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Sangat Cepat & Direkomendasikan)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Paling Canggih & Akurat)</option>
              </select>

              <button type="submit" disabled={loadingPersona} style={{ marginTop: '10px' }}>
                {loadingPersona ? 'Menyimpan...' : 'Simpan Persona'}
              </button>
              {globalError && !uploadStatus && <p style={{ color: '#ff8080' }}>{globalError}</p>}
            </form>
          </div>

          {/* KOTAK 2a: MANAJEMEN KATEGORI OTAK (V16) */}
          <div className="card">
            <h2>2a. Manajemen Kategori Otak</h2>
            <p>Buat kategori (misal: "Promosi", "Aturan") sebelum meng-upload file.</p>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nama Kategori Baru..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" disabled={loadingCategories}>
                {loadingCategories ? '...' : '+ Buat'}
              </button>
            </form>
            <div style={{ marginTop: '15px' }}>
              <strong>Kategori Saat Ini:</strong>
              {loadingCategories && <p>Memuat...</p>}
              {categories.length === 0 && !loadingCategories && <p>Belum ada kategori.</p>}
              <ul style={{ paddingLeft: '20px' }}>
                {categories.map(cat => (
                  <li key={cat.id}>{cat.name}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* KOTAK 2b: UPLOAD KNOWLEDGE BASE (V16) */}
          <div className="card">
            <h2>2b. Upload Knowledge Base</h2>
            <p>Pilih kategori, lalu upload file FAQ (.txt/.pdf).</p>
            <form onSubmit={handleUpload}>
              {/* --- DROPDOWN BARU V16 --- */}
              <label htmlFor="category-select">1. Pilih Kategori:</label>
              <select
                id="category-select"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={loadingCategories || categories.length === 0}
                required
              >
                {categories.length === 0 ? (
                  <option value="">Buat kategori dulu</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                )}
              </select>
              
              {/* --- UPLOAD FILE (LAMA) --- */}
              <label htmlFor="file-upload" style={{ marginTop: '15px' }}>2. Pilih File:</label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />

              {/* --- TOMBOL SUBMIT --- */}
              <button 
                type="submit" 
                disabled={loadingUpload || !file || loadingPersona || categories.length === 0} 
                style={{ width: '100%', marginTop: '15px' }}
              >
                {loadingUpload ? 'Processing...' : 'Upload & Proses File'}
              </button>
              {uploadStatus && (
                <div style={{ marginTop: '15px' }}>{uploadStatus}</div>
              )}
              {globalError && uploadStatus && <p style={{ color: '#ff8080' }}>{globalError}</p>}
            </form>
          </div>

          {/* KOTAK 3: RULE ENGINE (V13 - AMAN) */}
          <div className="card">
            <h2>3. Aturan Default (Global)</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0 }}>
                <strong>Aktifkan Auto-Reply 24/7?</strong><br/>
                <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                  Ini adalah status *default* untuk semua *chat baru*.
                </span>
              </p>
              <label className="switch">
                <input
                  type="checkbox"
                  disabled={loadingRules}
                  checked={rules.some(r => r.targetType === 'website' && r.action === 'AUTO_REPLY')}
                  onChange={handleToggleAutoReply}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}

export default AIPage;