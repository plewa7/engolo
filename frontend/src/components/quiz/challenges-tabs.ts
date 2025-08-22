import "./quiz-list";
import "./language-exercises";

class ChallengesTabs extends HTMLElement {
  shadow: ShadowRoot;
  activeTab: string = 'teacher-quizzes';

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

        .challenges-header {
          text-align: center;
          margin-bottom: 30px;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }

        .challenges-header h2 {
          color: var(--text-primary);
          margin-bottom: 10px;
          font-size: 28px;
          font-weight: 600;
        }

        .challenges-header p {
          color: #666;
          margin: 0;
          font-size: 16px;
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
          background: var(--card-bg);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          border-left: 4px solid #2196F3;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          opacity: 0;
          animation: fadeInLeft 0.6s ease forwards;
        }

        .tab-description h3 {
          margin: 0 0 10px 0;
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
        }

        .tab-description p {
          margin: 0;
          color: #666;
          line-height: 1.6;
          font-size: 14px;
        }

        /* Animacje */
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

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsywność */
        @media (max-width: 600px) {
          .challenges-container {
            padding: 15px;
          }
          
          .tab-button {
            padding: 12px 15px;
            font-size: 14px;
          }
          
          .challenges-header h2 {
            font-size: 24px;
          }
        }
      </style>

      <div class="challenges-container">
        <div class="challenges-header">
          <h2>🎓 Wyzwania i Zadania</h2>
          <p>Rozwijaj swoje umiejętności językowe poprzez różnorodne ćwiczenia</p>
        </div>

        <div class="tabs">
          <button class="tab-button ${this.activeTab === 'teacher-quizzes' ? 'active' : ''}" 
                  data-tab="teacher-quizzes"
                  onclick="this.getRootNode().host.setActiveTab('teacher-quizzes')">
            Quizy od nauczyciela
          </button>
          <button class="tab-button ${this.activeTab === 'language-exercises' ? 'active' : ''}" 
                  data-tab="language-exercises"
                  onclick="this.getRootNode().host.setActiveTab('language-exercises')">
            Zadania językowe
          </button>
        </div>

        <div class="tab-content">
          <div class="tab-pane ${this.activeTab === 'teacher-quizzes' ? 'active' : ''}">
            <div class="tab-description">
              <h3>📝 Quizy od nauczyciela</h3>
              <p>Rozwiązuj zadania przygotowane specjalnie dla Ciebie przez nauczyciela. Każdy quiz jest dostosowany do Twojego poziomu i aktualnego programu nauczania.</p>
            </div>
            <quiz-list></quiz-list>
          </div>

          <div class="tab-pane ${this.activeTab === 'language-exercises' ? 'active' : ''}">
            <div class="tab-description">
              <h3>🎯 Interaktywne zadania językowe</h3>
              <p>Ćwicz język angielski poprzez różnorodne zadania: tłumaczenia, słownictwo i gramatykę. Zadania są automatycznie generowane i dostosowane do Twojego poziomu.</p>
            </div>
            <language-exercises></language-exercises>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('challenges-tabs', ChallengesTabs);
