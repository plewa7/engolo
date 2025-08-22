import "./dashboard-home";
import "../quiz/quiz-list";
import "../quiz/challenges-tabs";
import '../chat/chat-box';
import "../ui/dictionary";
import "./student-statistics";

export class StudentDashboard extends HTMLElement {
  static get observedAttributes() {
    return ["section"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const section = this.getAttribute("section") || "dashboard";
    
    if (section === "dashboard") {
      this.innerHTML = `<dashboard-home></dashboard-home>`;
    } else if (section === "challenges") {
      this.innerHTML = `<challenges-tabs></challenges-tabs>`;
    } else if (section === "chat") {
      this.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h2>💬 Czat Ucznia</h2>
            <p>Rozmawiaj z nauczycielem lub innymi uczniami</p>
          </div>
          <div class="section-content">
            <chat-box></chat-box>
          </div>
        </div>
        <style>
          .dashboard-section {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .section-header {
            text-align: center;
            margin-bottom: 30px;
            opacity: 0;
            animation: fadeInUp 0.6s ease forwards;
          }
          
          .section-header h2 {
            color: var(--text-primary);
            margin-bottom: 10px;
            font-size: 28px;
            font-weight: 600;
          }
          
          .section-header p {
            color: var(--text-secondary);
            margin: 0;
            font-size: 16px;
          }
          
          .section-content {
            opacity: 0;
            animation: fadeInUp 0.6s ease 0.2s forwards;
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
        </style>
      `;
    } else if (section === "stats") {
      this.innerHTML = `<student-statistics></student-statistics>`;
    } else if (section === "dictionary") {
      this.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h2>📚 Słownik</h2>
            <p>Sprawdzaj znaczenia słów i poszerzaj słownictwo</p>
          </div>
          <div class="section-content">
            <dictionary-component></dictionary-component>
          </div>
        </div>
        <style>
          .dashboard-section {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .section-header {
            text-align: center;
            margin-bottom: 30px;
            opacity: 0;
            animation: fadeInUp 0.6s ease forwards;
          }
          
          .section-header h2 {
            color: var(--text-primary);
            margin-bottom: 10px;
            font-size: 28px;
            font-weight: 600;
          }
          
          .section-header p {
            color: #666;
            margin: 0;
            font-size: 16px;
          }
          
          .section-content {
            opacity: 0;
            animation: fadeInUp 0.6s ease 0.2s forwards;
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
        </style>
      `;
    } else if (section === "notifications") {
      this.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h2>🔔 Powiadomienia</h2>
            <p>Automatyczne powiadomienia motywacyjne</p>
          </div>
          <div class="section-content">
            <div class="notification-card">
              <div class="notification-icon">🎯</div>
              <div class="notification-content">
                <h3>Wkrótce dostępne!</h3>
                <p>Funkcja powiadomień jest w trakcie rozwoju. Będziesz otrzymywać przypomnienia o nauce, gratulacje za osiągnięcia i motywacyjne wiadomości.</p>
              </div>
            </div>
          </div>
        </div>
        <style>
          .dashboard-section {
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .section-header {
            text-align: center;
            margin-bottom: 30px;
            opacity: 0;
            animation: fadeInUp 0.6s ease forwards;
          }
          
          .section-header h2 {
            color: var(--text-primary);
            margin-bottom: 10px;
            font-size: 28px;
            font-weight: 600;
          }
          
          .section-header p {
            color: #666;
            margin: 0;
            font-size: 16px;
          }
          
          .section-content {
            opacity: 0;
            animation: fadeInUp 0.6s ease 0.2s forwards;
          }
          
          .notification-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 20px;
            border-left: 4px solid #4caf50;
          }
          
          .notification-icon {
            font-size: 48px;
            background: #e8f5e8;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .notification-content h3 {
            margin: 0 0 8px 0;
            color: var(--text-primary);
            font-size: 20px;
          }
          
          .notification-content p {
            margin: 0;
            color: #666;
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
        </style>
      `;
    } else {
      this.innerHTML = `<div><h2>Panel</h2></div>`;
    }
  }
}
customElements.define("student-dashboard", StudentDashboard);
