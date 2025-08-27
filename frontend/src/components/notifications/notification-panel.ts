import { Notification, notificationService } from '../../features/notifications/notification.service';

export class NotificationPanel extends HTMLElement {
  private notifications: Notification[] = [];
  private filter: 'all' | 'unread' = 'all';

  connectedCallback() {
    this.subscribeToNotifications();
    this.render();
  }

  disconnectedCallback() {
    notificationService.unsubscribe(this.handleNotificationsUpdate.bind(this));
  }

  private subscribeToNotifications() {
    notificationService.subscribe(this.handleNotificationsUpdate.bind(this));
  }

  private handleNotificationsUpdate(notifications: Notification[]) {
    this.notifications = notifications;
    this.render();
  }

  private setFilterInternal(filter: 'all' | 'unread') {
    this.filter = filter;
    this.render();
  }

  // Public methods for HTML onclick handlers
  setFilter(filter: 'all' | 'unread') {
    this.setFilterInternal(filter);
  }

  private getFilteredNotifications(): Notification[] {
    if (this.filter === 'unread') {
      return this.notifications.filter(n => !n.read);
    }
    return this.notifications;
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  markAsRead(notificationId: string) {
    notificationService.markAsRead(notificationId);
  }

  markAllAsRead() {
    notificationService.markAllAsRead();
  }

  deleteNotification(notificationId: string) {
    notificationService.deleteNotification(notificationId);
  }

  clearAll() {
    if (confirm('Czy na pewno chcesz usunąć wszystkie powiadomienia?')) {
      notificationService.clearAll();
    }
  }

  render() {
    const filteredNotifications = this.getFilteredNotifications();
    const unreadCount = notificationService.getUnreadCount();

    this.innerHTML = `
      <div class="notification-panel">
        <div class="notification-header">
          <div class="notification-title">
            <h2>🔔 Powiadomienia</h2>
            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
          </div>
          <p class="notification-subtitle">Twoje osiągnięcia i motywacyjne wiadomości</p>
        </div>

        <div class="notification-controls">
          <div class="filter-buttons">
            <button 
              class="filter-btn ${this.filter === 'all' ? 'active' : ''}"
              onclick="this.closest('notification-panel').setFilter('all')"
            >
              Wszystkie (${this.notifications.length})
            </button>
            <button 
              class="filter-btn ${this.filter === 'unread' ? 'active' : ''}"
              onclick="this.closest('notification-panel').setFilter('unread')"
            >
              Nieprzeczytane (${unreadCount})
            </button>
          </div>
          
          <div class="action-buttons">
            ${unreadCount > 0 ? `
              <button class="action-btn mark-all" onclick="this.closest('notification-panel').markAllAsRead()">
                📖 Oznacz wszystkie jako przeczytane
              </button>
            ` : ''}
            ${this.notifications.length > 0 ? `
              <button class="action-btn clear-all" onclick="this.closest('notification-panel').clearAll()">
                🗑️ Wyczyść wszystkie
              </button>
            ` : ''}
          </div>
        </div>

        <div class="notification-list">
          ${filteredNotifications.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🔔</div>
              <h3>Brak powiadomień</h3>
              <p>${this.filter === 'unread' ? 'Wszystkie powiadomienia zostały przeczytane!' : 'Nowe powiadomienia pojawią się tutaj po Twoich osiągnięciach.'}</p>
            </div>
          ` : filteredNotifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-type="${notification.type}">
              <div class="notification-icon">${notification.icon}</div>
              <div class="notification-content">
                <div class="notification-item-header">
                  <h4 class="notification-item-title">${notification.title}</h4>
                  <span class="notification-time">${this.formatDate(notification.timestamp)}</span>
                </div>
                <p class="notification-message">${notification.message}</p>
                ${this.renderNotificationData(notification)}
              </div>
              <div class="notification-actions">
                ${!notification.read ? `
                  <button 
                    class="action-icon read-btn" 
                    onclick="this.closest('notification-panel').markAsRead('${notification.id}')"
                    title="Oznacz jako przeczytane"
                  >
                    ✓
                  </button>
                ` : ''}
                <button 
                  class="action-icon delete-btn" 
                  onclick="this.closest('notification-panel').deleteNotification('${notification.id}')"
                  title="Usuń powiadomienie"
                >
                  ×
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <style>
        .notification-panel {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .notification-header {
          text-align: center;
          margin-bottom: 30px;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }

        .notification-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .notification-title h2 {
          color: var(--text-primary);
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }

        .unread-badge {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .notification-subtitle {
          color: var(--text-secondary);
          margin: 0;
          font-size: 16px;
        }

        .notification-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background: var(--card-bg);
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.1s forwards;
        }

        .filter-buttons {
          display: flex;
          gap: 10px;
        }

        .filter-btn {
          padding: 10px 20px;
          border: 2px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .filter-btn:hover:not(.active) {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .action-btn.mark-all {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: white;
        }

        .action-btn.clear-all {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .notification-item {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: flex;
          gap: 15px;
          transition: all 0.3s ease;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
          position: relative;
          overflow: hidden;
        }

        .notification-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: var(--accent-color);
        }

        .notification-item.unread {
          border-left: 4px solid #4facfe;
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.05), rgba(0, 242, 254, 0.05));
        }

        .notification-item.read {
          opacity: 0.8;
        }

        .notification-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .notification-icon {
          font-size: 40px;
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .notification-item[data-type="quiz_completed"] .notification-icon {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }

        .notification-item[data-type="module_completed"] .notification-icon {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
        }

        .notification-item[data-type="ranking_advance"] .notification-icon {
          background: linear-gradient(135deg, #fa709a, #fee140);
        }

        .notification-item[data-type="streak"] .notification-icon {
          background: linear-gradient(135deg, #ff9a9e, #fecfef);
        }

        .notification-item[data-type="login"] .notification-icon {
          background: linear-gradient(135deg, #a8edea, #fed6e3);
        }

        .notification-item[data-type="achievement"] .notification-icon {
          background: linear-gradient(135deg, #ffecd2, #fcb69f);
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 10px;
        }

        .notification-item-title {
          margin: 0;
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.3;
        }

        .notification-time {
          color: var(--text-secondary);
          font-size: 12px;
          flex-shrink: 0;
        }

        .notification-message {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.5;
          font-size: 14px;
        }

        .notification-data {
          margin-top: 10px;
          padding: 10px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .notification-actions {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex-shrink: 0;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .read-btn {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: white;
        }

        .delete-btn {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          color: white;
        }

        .action-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 80px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
          color: var(--text-primary);
        }

        .empty-state p {
          margin: 0;
          line-height: 1.6;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .notification-panel {
            padding: 15px;
          }

          .notification-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-buttons,
          .action-buttons {
            justify-content: center;
          }

          .notification-item {
            padding: 15px;
          }

          .notification-icon {
            width: 50px;
            height: 50px;
            font-size: 32px;
          }

          .notification-item-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .notification-actions {
            flex-direction: row;
          }
        }
      </style>
    `;
  }

  private renderNotificationData(notification: Notification): string {
    if (!notification.data) return '';

    let dataHtml = '';
    
    if (notification.type === 'quiz_completed' && notification.data.score !== undefined) {
      dataHtml = `<div class="notification-data">Wynik: ${notification.data.score}%</div>`;
    } else if (notification.type === 'ranking_advance' && notification.data.improvement) {
      dataHtml = `<div class="notification-data">Awans o ${notification.data.improvement} pozycję (${notification.data.previousPosition} → ${notification.data.currentPosition})</div>`;
    }

    return dataHtml;
  }
}

customElements.define('notification-panel', NotificationPanel);
