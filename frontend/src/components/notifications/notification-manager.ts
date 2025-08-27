import { notificationService } from '../../features/notifications/notification.service';
import './notification-popup';

export class NotificationManager extends HTMLElement {
  private popupContainer!: HTMLElement;

  connectedCallback() {
    console.log('🔧 NotificationManager connected to DOM');
    this.setupPopupContainer();
    this.subscribeToNotifications();
    
    // Initialize notifications on app start
    this.initializeNotifications();
  }

  private setupPopupContainer() {
    // Create a container for popups
    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'notification-popup-container';
    this.popupContainer.style.position = 'fixed';
    this.popupContainer.style.top = '0';
    this.popupContainer.style.right = '0';
    this.popupContainer.style.zIndex = '99999';
    this.popupContainer.style.pointerEvents = 'none';
    this.popupContainer.style.width = 'auto';
    this.popupContainer.style.height = 'auto';
    // Add a visible background for debugging
    this.popupContainer.style.background = 'rgba(255, 0, 0, 0.1)';
    document.body.appendChild(this.popupContainer);
    console.log('📦 Popup container created and added to body:', this.popupContainer);
  }

  private subscribeToNotifications() {
    console.log('📢 Subscribing to popup notifications');
    notificationService.subscribeToPopups((notification) => {
      console.log('📬 Received notification for popup:', notification);
      this.showPopup(notification);
    });
  }

  private showPopup(notification: any) {
    console.log('🎯 Showing popup for notification:', notification.title);
    const popup = document.createElement('notification-popup') as any;
    console.log('📦 Created popup element:', popup);
    
    // Add directly to body instead of container
    document.body.appendChild(popup);
    console.log('📍 Added popup directly to body. Body children count:', document.body.children.length);
    
    // Show the popup
    popup.show(notification, 5000);
    
    // Debug popup visibility
    setTimeout(() => {
      const popupRect = popup.getBoundingClientRect();
      console.log('👁️ Popup bounds after show:', popupRect);
      console.log('📱 Screen dimensions:', { width: window.innerWidth, height: window.innerHeight });
      console.log('🎨 Popup computed styles:', {
        display: getComputedStyle(popup).display,
        visibility: getComputedStyle(popup).visibility,
        opacity: getComputedStyle(popup).opacity,
        zIndex: getComputedStyle(popup).zIndex,
        position: getComputedStyle(popup).position,
        transform: getComputedStyle(popup).transform,
        width: getComputedStyle(popup).width,
        height: getComputedStyle(popup).height,
        right: getComputedStyle(popup).right,
        top: getComputedStyle(popup).top
      });
      
      // Check if popup is visible on screen
      const isVisible = popupRect.right <= window.innerWidth && 
                       popupRect.left >= 0 && 
                       popupRect.bottom <= window.innerHeight && 
                       popupRect.top >= 0;
      console.log('👀 Is popup visible on screen?', isVisible);
      
      if (!isVisible) {
        console.warn('⚠️ Popup is off-screen! Adjusting position...');
        // Adjust position if needed
        if (popupRect.right > window.innerWidth) {
          popup.style.right = '10px';
          popup.style.left = 'auto';
        }
      }
    }, 100);
    
    // Remove from DOM after hiding
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 6000);
  }

  private initializeNotifications() {
    // Check if user just logged in
    const user = this.getUserFromStorage();
    if (user) {
      // Trigger login notification
      setTimeout(() => {
        notificationService.onUserLogin(user.id);
      }, 1000);
    }
  }

  private getUserFromStorage() {
    try {
      const user = localStorage.getItem('engolo_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  // Public methods to trigger notifications from other components
  triggerQuizCompleted(quizName: string, score: number) {
    notificationService.onQuizCompleted(quizName, score);
  }

  triggerModuleCompleted(moduleName: string) {
    notificationService.onModuleCompleted(moduleName);
  }

  triggerRankingChanged(previousPosition: number, currentPosition: number) {
    notificationService.onRankingChanged(previousPosition, currentPosition);
  }

  triggerAchievement(achievementName: string) {
    notificationService.triggerNotification('achievement', { achievement: achievementName });
  }
}

// Make it globally available
declare global {
  interface Window {
    notificationManager: NotificationManager;
  }
}

customElements.define('notification-manager', NotificationManager);
