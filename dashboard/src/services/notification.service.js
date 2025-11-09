// /dashboard/src/services/notification.service.js
// (SERVICE V18 - BROWSER NOTIFICATIONS)

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isEnabled = localStorage.getItem('prochat-notifications-enabled') === 'true';
    this.checkPermission();
  }

  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      this.isEnabled = true;
      localStorage.setItem('prochat-notifications-enabled', 'true');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.isEnabled = true;
        localStorage.setItem('prochat-notifications-enabled', 'true');
        return true;
      }
    }

    return false;
  }

  show(title, options = {}) {
    if (!this.isEnabled || this.permission !== 'granted') {
      return null;
    }

    // Don't show notification if window is focused
    if (document.hasFocus()) {
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'prochat-notification',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      // Focus window when clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (err) {
      console.warn('Failed to show notification:', err);
      return null;
    }
  }

  showNewMessage(senderName, message) {
    return this.show('Pesan Baru 💬', {
      body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      tag: 'new-message',
      icon: '/favicon.ico'
    });
  }

  showNewConversation(visitorId) {
    return this.show('Percakapan Baru 🆕', {
      body: `Visitor ${visitorId.substring(0, 6)} memulai percakapan baru`,
      tag: 'new-conversation',
      requireInteraction: true // Require user interaction for new conversations
    });
  }

  showAiSuggestion() {
    return this.show('Saran AI Tersedia 🤖', {
      body: 'AI telah menyarankan balasan untuk percakapan ini',
      tag: 'ai-suggestion'
    });
  }

  toggleNotifications() {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem('prochat-notifications-enabled', this.isEnabled);
    return this.isEnabled;
  }

  isNotificationsEnabled() {
    return this.isEnabled && this.permission === 'granted';
  }

  getPermissionStatus() {
    return this.permission;
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
