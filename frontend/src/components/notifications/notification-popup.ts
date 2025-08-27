import { Notification } from '../../features/notifications/notification.service';

export class NotificationPopup extends HTMLElement {
  private notification: Notification | null = null;
  private timeoutId: number | null = null;

  connectedCallback() {
    console.log('🔌 NotificationPopup connected to DOM');
    // Don't set positioning here, let CSS handle it
  }

  show(notification: Notification, duration: number = 5000) {
    console.log('🎪 NotificationPopup.show called:', notification);
    this.notification = notification;
    this.render();
    
    // Test if element has content
    console.log('📄 Popup innerHTML length:', this.innerHTML.length);
    console.log('📄 Popup innerHTML preview:', this.innerHTML.substring(0, 200));
    
    this.animateShow();
    
    // Auto hide after duration
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = window.setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    const popup = this.querySelector('.notification-popup');
    if (popup) {
      popup.classList.add('hiding');
      setTimeout(() => {
        this.innerHTML = '';
        this.style.pointerEvents = 'none';
      }, 300);
    }
  }

  private render() {
    if (!this.notification) {
      console.log('❌ No notification to render');
      return;
    }

    console.log('🎨 Rendering notification popup:', this.notification.title);
    
    // Apply basic styles directly to element
    this.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 99999 !important;
      width: 400px !important;
      height: auto !important;
      background: #2d3748 !important;
      border: 3px solid white !important;
      border-radius: 16px !important;
      padding: 20px !important;
      color: white !important;
      font-family: Arial, sans-serif !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      transform: translateX(0) !important;
      transition: transform 0.3s ease !important;
      max-width: 90vw !important;
    `;

    this.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="font-size: 32px; background: white; color: black; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          ${this.notification.icon}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
            ${this.notification.title}
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            ${this.notification.message}
          </div>
        </div>
        <button onclick="this.closest('notification-popup').hide()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 5px;">
          ×
        </button>
      </div>
    `;
  }

  private animateShow() {
    console.log('🎬 Starting animation for popup');
    setTimeout(() => {
      this.style.transform = 'translateX(0)';
    }, 50);
  }
}

customElements.define('notification-popup', NotificationPopup);
