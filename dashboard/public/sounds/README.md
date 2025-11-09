# 🎵 Custom Sound Notifications

## How to Use Your Own Sound Files

### 1. **Add Your Sound Files Here**
Place your custom sound files in this folder (`/dashboard/public/sounds/`):

```
dashboard/public/sounds/
  ├── message-sent.mp3         (sound saat kirim pesan)
  ├── message-received.mp3     (sound saat terima pesan)
  ├── new-conversation.mp3     (sound saat conversation baru)
  └── ai-suggestion.mp3        (sound saat AI kasih saran)
```

### 2. **Supported Formats**
- ✅ **MP3** (recommended, small size, universal support)
- ✅ **WAV** (high quality, larger size)
- ✅ **OGG** (good quality, smaller than WAV)
- ⚠️ **M4A** (depends on browser support)

### 3. **Recommended Sound Specs**
- **Duration:** 0.5 - 2 seconds (short & quick)
- **Bitrate:** 128kbps (balance quality & size)
- **File Size:** < 50KB per file
- **Volume:** Normalized to avoid too loud

### 4. **Enable Custom Sounds**
Edit `/dashboard/src/services/sound.service.js`:

**Before:**
```javascript
// OPTION 1: Use CUSTOM AUDIO FILES (recommended)
// this.sounds.messageSent = new Audio('/sounds/message-sent.mp3');
// this.sounds.messageReceived = new Audio('/sounds/message-received.mp3');
// this.sounds.newConversation = new Audio('/sounds/new-conversation.mp3');
// this.sounds.aiSuggestion = new Audio('/sounds/ai-suggestion.mp3');

// 🎵 OPTION 2: Use built-in data URI sounds (default)
this.sounds.messageSent = new Audio('data:audio/wav;base64,...');
```

**After:**
```javascript
// 🎵 OPTION 1: Use CUSTOM AUDIO FILES (recommended)
this.sounds.messageSent = new Audio('/sounds/message-sent.mp3');
this.sounds.messageReceived = new Audio('/sounds/message-received.mp3');
this.sounds.newConversation = new Audio('/sounds/new-conversation.mp3');
this.sounds.aiSuggestion = new Audio('/sounds/ai-suggestion.mp3');

// OPTION 2: Use built-in data URI sounds (default)
// this.sounds.messageSent = new Audio('data:audio/wav;base64,...');
```

### 5. **Free Sound Resources**
Download free notification sounds:

- **Pixabay Sounds:** https://pixabay.com/sound-effects/
- **Freesound:** https://freesound.org/
- **Zapsplat:** https://www.zapsplat.com/
- **Notification Sounds:** https://notificationsounds.com/

Search keywords: "notification", "ding", "pop", "chime", "alert"

### 6. **Test Your Sounds**
After adding files, refresh dashboard and test:

```javascript
// In browser console (F12)
import soundService from './services/sound.service.js';

soundService.play('messageSent');
soundService.play('messageReceived');
soundService.play('newConversation');
soundService.play('aiSuggestion');
```

---

**Note:** Make sure to rebuild/refresh after changing sound files!
