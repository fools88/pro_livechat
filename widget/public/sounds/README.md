# 🎵 Custom Widget Sound Notifications

## How to Use Your Own Sound Files

### 1. **Add Your Sound Files Here**
Place your custom sound files in this folder (`/widget/public/sounds/`):

```
widget/public/sounds/
  ├── message-sent.mp3         (sound saat visitor kirim pesan)
  ├── message-received.mp3     (sound saat visitor terima balasan)
  └── widget-open.mp3          (sound saat widget dibuka)
```

### 2. **Supported Formats**
- ✅ **MP3** (recommended, small size, universal support)
- ✅ **WAV** (high quality, larger size)
- ✅ **OGG** (good quality, smaller than WAV)

### 3. **Recommended Sound Specs**
- **Duration:** 0.3 - 1 second (quick & subtle for visitor)
- **Bitrate:** 96-128kbps (light file size)
- **File Size:** < 30KB per file
- **Volume:** Soft & pleasant (visitor-friendly)

### 4. **Enable Custom Sounds**
Edit `/widget/src/services/sound.service.js`:

**Before:**
```javascript
// OPTION 1: Use CUSTOM AUDIO FILES (recommended)
// this.sounds.messageSent = new Audio('/sounds/message-sent.mp3');
// this.sounds.messageReceived = new Audio('/sounds/message-received.mp3');
// this.sounds.widgetOpen = new Audio('/sounds/widget-open.mp3');

// 🎵 OPTION 2: Use built-in data URI sounds (default)
this.sounds.messageSent = new Audio('data:audio/wav;base64,...');
```

**After:**
```javascript
// 🎵 OPTION 1: Use CUSTOM AUDIO FILES (recommended)
this.sounds.messageSent = new Audio('/sounds/message-sent.mp3');
this.sounds.messageReceived = new Audio('/sounds/message-received.mp3');
this.sounds.widgetOpen = new Audio('/sounds/widget-open.mp3');

// OPTION 2: Use built-in data URI sounds (default)
// this.sounds.messageSent = new Audio('data:audio/wav;base64,...');
```

### 5. **Rebuild Widget**
After adding custom sounds:

```cmd
cd widget
npm run build
```

Then refresh the page with embedded widget.

---

**Tip:** Keep visitor sounds softer and less intrusive than admin sounds!
