import "../../styles/globals.css";
import "./quiz-list";
import "./language-exercises";
import "./quiz-competition";

class ChallengesTabs extends HTMLElement {
  shadow: ShadowRoot;
  activeTab: string = 'language-exercises';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.render();
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        .challenges-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .tabs {
          display: flex;
          background: var(--card-bg);
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
          overflow: hidden;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.2s forwards;
        }

        .tab-button {
          flex: 1;
          padding: 18px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          color: #666;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tab-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }

        .tab-button:hover::before {
          left: 100%;
        }

        .tab-button:hover {
          background: #f8f9fa;
          color: var(--text-primary);
          transform: translateY(-2px);
        }

        .tab-button.active {
          color: #2196F3;
          background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
          border-bottom: 3px solid #2196F3;
        }

        .tab-icon {
          font-size: 20px;
        }

        .tab-content {
          min-height: 400px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.4s forwards;
        }

        .tab-pane {
          display: none;
          animation: slideIn 0.3s ease;
        }

        .tab-pane.active {
          display: block;
        }

        .tab-description {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .tab-description h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 700;
        }

        .tab-description p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
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

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .tab-button {
            flex-direction: column;
            padding: 12px 8px;
            font-size: 12px;
          }
          
          .tab-icon {
            font-size: 18px;
            margin-bottom: 4px;
          }
        }
      </style>

      <div class="challenges-container">
        <div class="tabs">
          <button 
            class="tab-button ${this.activeTab === 'language-exercises' ? 'active' : ''}"
            data-tab="language-exercises"
          >
            <span class="tab-icon">🗣️</span>
            Moduły
          </button>
          <button 
            class="tab-button ${this.activeTab === 'teacher-quizzes' ? 'active' : ''}"
            data-tab="teacher-quizzes"
          >
            <span class="tab-icon">📝</span>
            Zadania
          </button>
          <button 
            class="tab-button ${this.activeTab === 'daily-challenge' ? 'active' : ''}"
            data-tab="daily-challenge"
          >
            <span class="tab-icon">🏆</span>
            Ranking
          </button>
        </div>

        <div class="tab-content">
          <div class="tab-pane ${this.activeTab === 'language-exercises' ? 'active' : ''}" id="language-exercises">
            <div class="tab-description">
              <h2>🗣️ Moduły</h2>
              <p>Ćwicz słownictwo, gramatykę i wymowę w interaktywnych ćwiczeniach</p>
            </div>
            <language-exercises></language-exercises>
          </div>
          
          <div class="tab-pane ${this.activeTab === 'teacher-quizzes' ? 'active' : ''}" id="teacher-quizzes">
            <div class="tab-description">
              <h2>📝 Zadania</h2>
              <p>Rozwiązuj zadania przygotowane specjalnie dla Ciebie przez nauczyciela</p>
            </div>
            <quiz-list></quiz-list>
          </div>
          
          <div class="tab-pane ${this.activeTab === 'daily-challenge' ? 'active' : ''}" id="daily-challenge">
            <div class="tab-description">
              <h2>🏆 Ranking</h2>
              <p>Zobacz ranking najlepszych uczniów i śledź swoje postępy!</p>
            </div>
            <quiz-competition></quiz-competition>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const tabButtons = this.shadow.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab;
        if (tab) {
          this.setActiveTab(tab);
        }
      });
    });
  }
}

customElements.define('challenges-tabs', ChallengesTabs);
