// /dashboard/src/services/sound.service.js
// (SERVICE V18 - SOUND NOTIFICATIONS)

class SoundService {
  constructor() {
    this.sounds = {
      messageSent: null,
      messageReceived: null,
      messageInRoom: null, // 🆕 Sound khusus untuk pesan di dalam room chat
      newConversation: null,
      aiSuggestion: null,
    };
    this.isMuted = localStorage.getItem('prochat-sound-muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('prochat-sound-volume') || '0.5');
    
    this.initializeSounds();
  }

  initializeSounds() {
    // 🎵 OPTION 1: Use CUSTOM AUDIO FILES (ENABLED!)
    // Custom sounds dari user sudah tersimpan di /dashboard/public/sounds/
    
    this.sounds.messageSent = new Audio('/sounds/message-sent.mp3');
    this.sounds.messageReceived = new Audio('/sounds/message-received.mp3'); // Untuk notification (belum buka room)
    this.sounds.messageInRoom = new Audio('/sounds/message-in-room.mp3'); // 🆕 Untuk pesan di dalam room chat (lebih soft)
    this.sounds.newConversation = new Audio('/sounds/new-conversation.mp3');
    this.sounds.aiSuggestion = new Audio('/sounds/ai-suggestion.mp3');
    
    // 🎵 OPTION 2: Use built-in data URI sounds (DISABLED - sekarang pakai custom)
    // this.sounds.messageSent = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+K0fPTgjMGHmzA7+OZSBAKTJ3e8rt9LgU7k9n0yHwuBS2Fzfrtdjn');
    // this.sounds.messageReceived = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgYJ/fn+AgYKDg4OCgX9+foCBgoOEhIOCgYB/gIGDhIWFhIOCgYGChIWGhoWEg4KBgoSFhoaGhYSCgoOEhYaGhoWEgwICBAUGBwcGBQMCAwUGBwcHBgUDAwQFBgcHBwYFBAQFBQYHBwcGBQQEBQYGBwcHBgUFBQYGBgcHBwYGBQUGBgYHBwcGBgYFBQYGBwcHBwYGBQUFBgYGBwcGBgUFBQUGBgYGBwY=');
    // this.sounds.newConversation = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgYJ/fn+AgYKDg4OCgX9+foCBgoOEhIOCgYB/gIGDhIWFhIOCgYGChIWGhoWEg4KBgoSFhoaGhYSCgoOEhYaGhoWEgwICBAUGBwcGBQMCAwUGBwcHBgUDAwQFBgcHBwYFBAQFBQYHBwcGBQQEBQYGBwcHBgUFBQYGBgcHBwYGBQUGBgYHBwcGBgYFBQYGBwcHBwYGBQUFBgYGBwcGBgUFBQUGBgYGBwYGBQUFBQUGBgYGBgY=');
    // this.sounds.aiSuggestion = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf4B/gH+Af39/f39/gH9/f4B/gICAgH+AgICAgICAgH+AgIB/gICAgICAgICAf4CAgICAgICAgIB/gICAgICAgICAgH+AgICAgICAgICAgH+AgICAgICAgICAgH+AgICAgICAgICAgH+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==');

    // Set initial volume for all sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.volume = this.volume;
    });
  }

  play(soundType) {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundType];
    if (sound) {
      // Clone and play to allow overlapping sounds
      const clone = sound.cloneNode();
      clone.volume = this.volume;
      clone.play().catch(err => {
        console.warn('Sound play failed:', err);
      });
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('prochat-sound-volume', this.volume);
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.volume = this.volume;
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('prochat-sound-muted', this.isMuted);
    return this.isMuted;
  }

  isSoundMuted() {
    return this.isMuted;
  }

  getVolume() {
    return this.volume;
  }
}

// Export singleton instance
const soundService = new SoundService();
export default soundService;
