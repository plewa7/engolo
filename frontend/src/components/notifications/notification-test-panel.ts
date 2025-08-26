import { notificationHelper } from '../../features/notifications/notification-helper';

export class NotificationTestPanel extends HTMLElement {
  connectedCallback() {
    // Only show in development
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      return;
    }

    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="test-panel">
        <h3>🧪 Test Powiadomień</h3>
        <div class="test-buttons">
          <button id="test-quiz" class="test-btn">📝 Test Quiz</button>
          <button id="test-module" class="test-btn">📚 Test Moduł</button>
          <button id="test-achievement" class="test-btn">🏆 Test Osiągnięcie</button>
          <button id="test-streak" class="test-btn">🔥 Test Streak</button>
          <button id="test-ranking" class="test-btn">📈 Test Ranking</button>
          <button id="test-all" class="test-btn">🎉 Test Wszystkie</button>
          <button id="clear-all" class="test-btn clear">🗑️ Wyczyść</button>
        </div>
      </div>

      <style>
        .test-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 250px;
        }

        .test-panel h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          text-align: center;
        }

        .test-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .test-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .test-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .test-btn.clear {
          background: rgba(255, 107, 107, 0.3);
          grid-column: span 2;
        }

        .test-btn.clear:hover {
          background: rgba(255, 107, 107, 0.5);
        }

        #test-all {
          grid-column: span 2;
          background: rgba(255, 255, 255, 0.3);
        }
      </style>
    `;
  }

  setupEventListeners() {
    this.querySelector('#test-quiz')?.addEventListener('click', () => {
      notificationHelper.triggerQuizCompleted('Quiz Testowy', 95);
    });

    this.querySelector('#test-module')?.addEventListener('click', () => {
      notificationHelper.triggerModuleCompleted('Moduł Testowy');
    });

    this.querySelector('#test-achievement')?.addEventListener('click', () => {
      notificationHelper.triggerAchievement('🎯 Test Achievement!');
    });

    this.querySelector('#test-streak')?.addEventListener('click', () => {
      const days = Math.floor(Math.random() * 30) + 1;
      notificationHelper.triggerStreak(days);
    });

    this.querySelector('#test-ranking')?.addEventListener('click', () => {
      notificationHelper.triggerRankingAdvance(15, 8);
    });

    this.querySelector('#test-all')?.addEventListener('click', () => {
      // Trigger multiple notifications with delays
      notificationHelper.triggerQuizCompleted('Quiz Testowy', 95);
      setTimeout(() => notificationHelper.triggerModuleCompleted('Moduł Testowy'), 1000);
      setTimeout(() => notificationHelper.triggerAchievement('🎯 Test Achievement!'), 2000);
      setTimeout(() => notificationHelper.triggerStreak(7), 3000);
      setTimeout(() => notificationHelper.triggerRankingAdvance(15, 8), 4000);
    });

    this.querySelector('#clear-all')?.addEventListener('click', () => {
      import('../../features/notifications/notification.service').then(({ notificationService }) => {
        notificationService.clearAll();
      });
    });
  }
}

customElements.define('notification-test-panel', NotificationTestPanel);
