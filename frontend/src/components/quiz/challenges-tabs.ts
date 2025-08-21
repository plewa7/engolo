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
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .challenges-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .challenges-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .challenges-header p {
          color: #666;
          margin: 0;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #e0e0e0;
          margin-bottom: 30px;
          gap: 0;
        }

        .tab-button {
          flex: 1;
          padding: 15px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
          position: relative;
        }

        .tab-button:hover {
          background: #f8f9fa;
          color: #333;
        }

        .tab-button.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
          background: #f8f9ff;
        }

        .tab-content {
          min-height: 400px;
        }

        .tab-pane {
          display: none;
        }

        .tab-pane.active {
          display: block;
        }

        .tab-description {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #2196F3;
        }

        .tab-description h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 18px;
        }

        .tab-description p {
          margin: 0;
          color: #666;
          line-height: 1.4;
        }

        /* Ikony dla zakładek */
        .tab-button::before {
          content: "";
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 8px;
          vertical-align: middle;
        }

        .tab-button[data-tab="teacher-quizzes"]::before {
          content: "👨‍🏫";
        }

        .tab-button[data-tab="language-exercises"]::before {
          content: "🎯";
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
          
          .tab-button::before {
            width: 16px;
            height: 16px;
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
