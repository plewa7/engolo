import "./quiz-set-viewer";
class QuizList extends HTMLElement {
  shadow: ShadowRoot;
  quizzes: any[] = [];
  solvedIds: string[] = [];
  _userCheckInterval: any;
  _lastUserId: string = "";
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.handleStorage = this.handleStorage.bind(this);
  }

  connectedCallback() {
    this.refreshSolved();
    this.fetchQuizzes();
    window.addEventListener("storage", this.handleStorage);
    
    document.addEventListener('quiz-completed', (e: any) => {
      const quizSetId = e?.detail?.quizSetId;
      if (quizSetId) {
        const userId = this.getCurrentUserId();
        const solvedKey = `solved_quizzes_${userId}`;
        let solved = JSON.parse(localStorage.getItem(solvedKey) || "[]");
        if (!solved.includes(quizSetId)) {
          solved.push(quizSetId);
          localStorage.setItem(solvedKey, JSON.stringify(solved));
        }
        this.solvedIds = solved;
      } else {
        this.refreshSolved();
      }
      this.render();
      setTimeout(() => {
        this.fetchQuizzes();
      }, 1000);
      const modal = document.querySelector('div[style*="position: fixed"]');
      if (modal) {
        modal.remove();
      }
    });
    
    this._userCheckInterval = setInterval(() => {
      const userIdNow = this.getCurrentUserId();
      if (userIdNow !== this._lastUserId) {
        this._lastUserId = userIdNow;
        this.solvedIds = [];
        this.render();
        this.refreshSolvedFromBackend().then(() => {
          this.render();
        });
        this.fetchQuizzes();
      }
    }, 1000);
  }
  disconnectedCallback() {
    window.removeEventListener("storage", this.handleStorage);
    if (this._userCheckInterval) clearInterval(this._userCheckInterval);
  }

  handleStorage(e: StorageEvent) {
    if (!e.key) return;
    if (e.key.startsWith("solved_quizzes_") || e.key === "user") {
      this.refreshSolved();
      this.render();
    }
  }

  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user.id) return String(user.id);
    const jwt = localStorage.getItem("strapi_jwt");
    if (jwt) {
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1]));
        if (payload && payload.id) return String(payload.id);
      } catch (e) {}
    }
    return "anon";
  }

  refreshSolved() {
    const userId = this.getCurrentUserId();
    this._lastUserId = userId;
    const solvedKey = `solved_quizzes_${userId}`;
    const solved = localStorage.getItem(solvedKey);
    this.solvedIds = solved ? JSON.parse(solved) : [];
  }

  async refreshSolvedFromBackend() {
    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) return;

      const API_URL_ALL = "http://localhost:1337/api/quiz-statistics?populate=user";
      
      const response = await fetch(API_URL_ALL, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const currentUserId = this.getCurrentUserId();
        
        const userStats = data.data.filter((stat: any) => {
          const user = stat.user || stat.attributes?.user?.data;
          return user && String(user.id) === String(currentUserId);
        });

        const solvedQuizSetIds = userStats
          .map((stat: any) => stat.quizSetId || stat.attributes?.quizSetId)
          .filter((id: any) => id != null)
          .map((id: any) => String(id));

        this.solvedIds = [...new Set(solvedQuizSetIds)] as string[];
        this.saveSolvedIds();
      }
    } catch (err) {
    }
  }

  saveSolvedIds() {
    const userId = this.getCurrentUserId();
    const solvedKey = `solved_quizzes_${userId}`;
    localStorage.setItem(solvedKey, JSON.stringify(this.solvedIds));
  }

  async fetchQuizzes() {
    try {
      await this.refreshSolvedFromBackend();

      const localQuizSets = this.getLocalQuizSets();

      const QUIZ_SETS_URL = "http://localhost:1337/api/quiz-sets";
      const token = localStorage.getItem("strapi_jwt");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res = await fetch(QUIZ_SETS_URL, { headers });

      if (res.ok) {
        const data = await res.json();
        const apiQuizSets = data.data ? data.data : [];
        this.quizzes = [...apiQuizSets, ...localQuizSets];
        this.render();
        return;
      } else {
        if (localQuizSets.length > 0) {
          this.quizzes = localQuizSets;
          this.render();
          return;
        }
        this.quizzes = [];
        this.render();
        return;
      }
    } catch (err) {
      const localQuizSets = this.getLocalQuizSets();
      this.quizzes = localQuizSets;
      this.render();
    }
  }

  getLocalQuizSets() {
    try {
      const stored = localStorage.getItem('created_quiz_sets');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
    }
    return [];
  }

  render() {
    const unsolved = this.quizzes.filter(
      (q) => {
        const isSolved = this.solvedIds.includes(String(q.id));
        return !isSolved;
      }
    );
    
    const dailyChallenges = unsolved.filter((q) => {
      const attrs = q.attributes || q;
      return attrs.isDaily === true;
    });
    
    const regularQuizzes = unsolved.filter((q) => {
      const attrs = q.attributes || q;
      return attrs.isDaily !== true;
    });
    
    if (unsolved.length === 0) {
      this.shadow.innerHTML = `
        <style>
          .no-quizzes {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 40px 32px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #ff9800;
            animation: fadeInUp 0.6s ease forwards;
          }
          
          .no-quizzes-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .no-quizzes h3 {
            color: var(--text-primary);
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
          }
          
          .no-quizzes p {
            color: #666;
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
        </style>
        <div class="no-quizzes">
          <div class="no-quizzes-icon">🎉</div>
          <h3>Gratulacje!</h3>
          <p>Ukończyłeś wszystkie dostępne quizy od nauczyciela. Świetna robota!</p>
        </div>
      `;
      return;
    }
    
    this.shadow.innerHTML = `
      <style>
        .quiz-list { 
          display: flex; 
          flex-direction: column; 
          gap: 24px;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          border-radius: 12px;
          font-weight: 600;
          font-size: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }
        
        .daily-section {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
        }
        
        .section-icon {
          font-size: 24px;
        }
        
        .quiz-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .quiz-card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 2px solid transparent;
          transition: all 0.3s ease;
          opacity: 0;
          animation: slideInUp 0.6s ease forwards;
        }
        
        .quiz-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          border-color: var(--primary);
        }
        
        .daily-card {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border: 2px solid #ff9800;
        }
        
        .daily-card:hover {
          border-color: #f57c00;
          box-shadow: 0 8px 25px rgba(255, 152, 0, 0.2);
        }
        
        .quiz-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }
        
        .quiz-description {
          color: #666;
          margin: 0 0 16px 0;
          line-height: 1.5;
          font-size: 14px;
        }
        
        .quiz-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .meta-badge {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .questions-badge {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .time-badge {
          background: #f3e5f5;
          color: #7b1fa2;
        }
        
        .category-badge {
          background: #e8f5e8;
          color: #2e7d32;
        }
        
        .daily-badge {
          background: #fff3e0;
          color: #f57c00;
          font-weight: 600;
        }
        
        .quiz-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }
        
        .total-points {
          color: var(--primary);
          font-weight: 600;
          font-size: 14px;
        }
        
        .start-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .start-btn:hover {
          background: var(--primary-dark);
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
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
      
      <div class="quiz-list">
        ${dailyChallenges.length > 0 ? `
          <div class="section-header daily-section">
            <span class="section-icon">🏆</span>
            <span>Dzienne Challenge (${dailyChallenges.length})</span>
          </div>
          <div class="quiz-container">
            ${dailyChallenges.map((quiz, index) => this.renderQuizCard(quiz, index, true)).join('')}
          </div>
        ` : ''}
        
        ${regularQuizzes.length > 0 ? `
          <div class="section-header">
            <span class="section-icon">📚</span>
            <span>Quiz Sets od Nauczyciela (${regularQuizzes.length})</span>
          </div>
          <div class="quiz-container">
            ${regularQuizzes.map((quiz, index) => this.renderQuizCard(quiz, index + dailyChallenges.length, false)).join('')}
          </div>
        ` : ''}
      </div>
    `;

    this.attachEventListeners();
  }

  renderQuizCard(quiz: any, index: number, isDaily: boolean) {
    const attrs = quiz.attributes || quiz;
    const totalPoints = attrs.questions ? attrs.questions.reduce((sum: number, q: any) => sum + (q.points || 10), 0) : 0;
    const timeInMinutes = Math.floor((attrs.timeLimit || 300) / 60);
    
    return `
      <div class="quiz-card ${isDaily ? 'daily-card' : ''}" data-quiz-id="${quiz.id}" style="animation-delay: ${index * 0.1}s">
        <h4 class="quiz-title">${attrs.title || 'Quiz Set'}</h4>
        <p class="quiz-description">${attrs.description || 'Brak opisu'}</p>
        
        <div class="quiz-meta">
          <span class="meta-badge questions-badge">
            ${attrs.questions?.length || 0} pytań
          </span>
          <span class="meta-badge time-badge">
            ${timeInMinutes} min
          </span>
          <span class="meta-badge category-badge">
            ${attrs.category || 'Ogólny'}
          </span>
          ${isDaily ? '<span class="meta-badge daily-badge">✨ Daily</span>' : ''}
        </div>
        
        <div class="quiz-stats">
          <span class="total-points">🎯 ${totalPoints} pkt</span>
          <button class="start-btn">Rozpocznij →</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const quizCards = this.shadow.querySelectorAll('.quiz-card');
    quizCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const quizId = card.getAttribute('data-quiz-id');
        const quiz = this.quizzes.find(q => String(q.id) === quizId);
        if (quiz) {
          this.openQuizSet(quiz);
        }
      });
    });
  }

  openQuizSet(quiz: any) {
    const quizData = quiz.attributes || quiz;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      z-index: 1001;
    `;
    closeBtn.onclick = () => modal.remove();
    
    const quizViewer = document.createElement('quiz-set-viewer');
    quizViewer.setAttribute('quiz-set-id', quiz.id);
    
    (quizViewer as any).quizSetData = quizData;
    
    container.appendChild(closeBtn);
    container.appendChild(quizViewer);
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}
customElements.define("quiz-list", QuizList);
