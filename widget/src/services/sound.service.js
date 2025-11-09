// /widget/src/services/sound.service.js
// (SERVICE V18 - SOUND NOTIFICATIONS FOR WIDGET)

class WidgetSoundService {
  constructor() {
    this.sounds = {
      messageSent: null,
      messageReceived: null,
      widgetOpen: null,
    };
    this.isMuted = localStorage.getItem('prochat-widget-sound-muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('prochat-widget-sound-volume') || '0.5');
    
    this.initializeSounds();
  }

  initializeSounds() {
    // 🎵 OPTION 1: Use CUSTOM AUDIO FILES (ENABLED!)
    // Custom sounds dari user sudah tersimpan di /widget/public/sounds/
    
    this.sounds.messageSent = new Audio('/sounds/message-sent.mp3');
    this.sounds.messageReceived = new Audio('/sounds/message-received.mp3');
    this.sounds.widgetOpen = new Audio('/sounds/widget-open.mp3');
    
    // 🎵 OPTION 2: Use built-in data URI sounds (DISABLED - sekarang pakai custom)
    // this.sounds.messageSent = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+K0fPTgjMGHmzA7+OZSBAKTJ3e8rt9LgU7k9n0yHwuBS2Fzfrtdjn');
    // this.sounds.messageReceived = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgYJ/fn+AgYKDg4OCgX9+foCBgoOEhIOCgYB/gIGDhIWFhIOCgYGChIWGhoWEg4KBgoSFhoaGhYSCgoOEhYaGhoWEgwICBAUGBwcGBQMCAwUGBwcHBgUDAwQFBgcHBwYFBAQFBQYHBwcGBQQEBQYGBwcHBgUFBQYGBgcHBwYGBQUGBgYHBwcGBgYFBQYGBwcHBwYGBQUFBgYGBwcGBgUFBQUGBgYGBwY=');
    // this.sounds.widgetOpen = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf4B/gH+Af39/f39/gH9/f4B/gICAgH+AgICAgICAgH+AgIB/gICAgICAgICAf4CAgICAgICAgIB/gICAgICAgICAgH+AgICAgICAgICAgH+AgICAgICAgICAgH+AgICAgICAgICAgH+AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==');

    // Set initial volume
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.volume = this.volume;
    });
  }

  play(soundType) {
    if (this.isMuted) return;
    
    const sound = this.sounds[soundType];
    if (sound) {
      const clone = sound.cloneNode();
      clone.volume = this.volume;
      clone.play().catch(err => {
        console.warn('[Widget] Sound play failed:', err);
      });
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('prochat-widget-sound-volume', this.volume);
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.volume = this.volume;
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('prochat-widget-sound-muted', this.isMuted);
    return this.isMuted;
  }

  isSoundMuted() {
    return this.isMuted;
  }
}

// Export singleton instance
const widgetSoundService = new WidgetSoundService();
export default widgetSoundService;
