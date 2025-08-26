import "../../styles/globals.css";
import "./dashboard-home";
import "../quiz/quiz-set-editor";
import '../chat/chat-box';
import "../ui/dictionary";
import "./teacher-statistics";

export class TeacherDashboard extends HTMLElement {
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
      this.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h2>📝 Kreator Zadań</h2>
            <p>Twórz zadania i quizy dla swoich uczniów</p>
          </div>
          <div class="section-content">
            <quiz-set-editor></quiz-set-editor>
          </div>
        </div>
        <style>
          .dashboard-section {
            max-width: 1200px;
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
          
          .challenges-management {
            background: var(--card-bg);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
          
          .management-tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
          }
          
          .management-tab {
            flex: 1;
            padding: 20px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            color: #666;
            transition: all 0.3s ease;
          }
          
          .management-tab:hover {
            background: #e3f2fd;
            color: #2196F3;
          }
          
          .management-tab.active {
            background: var(--card-bg);
            color: #2196F3;
            border-bottom: 3px solid #2196F3;
          }
          
          .management-content {
            padding: 30px;
          }
          
          .tab-panel {
            display: none;
          }
          
          .tab-panel.active {
            display: block;
            animation: fadeInUp 0.4s ease;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          }
          
          .stat-icon {
            font-size: 40px;
            background: rgba(255,255,255,0.2);
            width: 70px;
            height: 70px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .stat-info h3 {
            margin: 0 0 8px 0;
            font-size: 16px;
            opacity: 0.9;
          }
          
          .stat-number {
            font-size: 32px;
            font-weight: 700;
            margin: 0;
          }
          
          .daily-challenge-manager {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 16px;
            border-left: 4px solid #FF9800;
          }
          
          .daily-challenge-manager h3 {
            margin: 0 0 20px 0;
            color: var(--text-primary);
          }
          
          .challenge-actions {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }
          
          .action-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .action-btn.primary {
            background: #4CAF50;
            color: white;
          }
          
          .action-btn.secondary {
            background: #2196F3;
            color: white;
          }
          
          .action-btn:not(.primary):not(.secondary) {
            background: #f44336;
            color: white;
          }
          
          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          
          .progress-overview {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 16px;
          }
          
          .progress-overview h3 {
            margin: 0 0 20px 0;
            color: var(--text-primary);
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
          
          @media (max-width: 768px) {
            .management-tabs {
              flex-direction: column;
            }
            
            .stats-grid {
              grid-template-columns: 1fr;
            }
            
            .challenge-actions {
              flex-direction: column;
            }
          }
        </style>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const tabs = document.querySelectorAll('.management-tab');
            const panels = document.querySelectorAll('.tab-panel');
            
            tabs.forEach(tab => {
              tab.addEventListener('click', function() {
                const targetPanel = this.dataset.tab + '-panel';
                
                // Remove active class from all tabs and panels
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                this.classList.add('active');
                document.getElementById(targetPanel).classList.add('active');
              });
            });
            
            // Load initial data
            loadCompetitionStats();
          });
          
          function loadCompetitionStats() {
            // This would be implemented to load real data from the backend
            document.getElementById('active-quizzes').textContent = '5';
            document.getElementById('active-students').textContent = '23';
            document.getElementById('daily-participants').textContent = '18';
          }
          
          function setDailyChallenge() {
            alert('Funkcja będzie zaimplementowana - pozwoli wybrać quiz jako dzienny challenge');
          }
          
          function viewLeaderboard() {
            alert('Otworzy się ranking uczniów');
          }
          
          function resetDailyChallenge() {
            if(confirm('Czy na pewno chcesz zresetować dzienny challenge?')) {
              alert('Challenge został zresetowany');
            }
          }
        </script>
      `;
    } else if (section === "chat") {
      this.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h2>💬 Czat Nauczyciela</h2>
            <p>Komunikuj się z uczniami i innymi nauczycielami</p>
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
      this.innerHTML = `<teacher-statistics></teacher-statistics>`;
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
    } else if (section === "notifications") {
      this.innerHTML = `
        <div class="dashboard-section">
          <div class="section-header">
            <h2>🔔 Powiadomienia</h2>
            <p>Automatyczne powiadomienia motywacyjne</p>
          </div>
          <div class="section-content">
            <div class="notification-card">
              <div class="notification-icon">📢</div>
              <div class="notification-content">
                <h3>Wkrótce dostępne!</h3>
                <p>Funkcja powiadomień jest w trakcie rozwoju. Będziesz otrzymywać automatyczne przypomnienia o nauce i osiągnięciach uczniów.</p>
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
            color: var(--text-secondary);
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
            border-left: 4px solid #ff9800;
          }
          
          .notification-icon {
            font-size: 48px;
            background: #fff3e0;
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
            color: var(--text-secondary);
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
customElements.define("teacher-dashboard", TeacherDashboard);
