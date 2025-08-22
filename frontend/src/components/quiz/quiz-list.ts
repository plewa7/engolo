import "./quiz-viewer";
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
    // Dla SPA: nasłuchuj na zmianę usera w localStorage (np. po login/logout)
    this._userCheckInterval = setInterval(() => {
      const userIdNow = this.getCurrentUserId();
      if (userIdNow !== this._lastUserId) {
        this._lastUserId = userIdNow;
        this.refreshSolved();
        this.render();
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
    // Spróbuj z JWT
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

  async fetchQuizzes() {
    try {
      const API_URL = "http://localhost:1337/api/quizzes";
      const token = localStorage.getItem("strapi_jwt");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(API_URL, { headers });
      if (res.ok) {
        const data = await res.json();
        this.quizzes = data.data ? data.data : [];
        this.render();
      } else {
        this.renderError("Nie znaleziono quizów.");
      }
    } catch (err) {
      this.renderError("Błąd sieci.");
    }
  }

  render() {
    // Obsługa quizów w formacie Strapi: { id, attributes: { ... } } lub płaskim
    const unsolved = this.quizzes.filter(
      (q) => !this.solvedIds.includes(String(q.id))
    );
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
          gap: 20px;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
        
        .quiz-list-header {
          text-align: center;
          margin-bottom: 20px;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.2s forwards;
        }
        
        .quiz-list-header h3 {
          color: var(--text-primary);
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .quiz-list-header p {
          color: #666;
          margin: 0;
          font-size: 14px;
        }
        
        .quiz-count {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
          margin-left: 8px;
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
      <div class="quiz-list-header">
        <h3>👩‍🏫 Quizy od Nauczyciela<span class="quiz-count">${unsolved.length}</span></h3>
        <p>Rozwiąż quizy przygotowane specjalnie przez Twojego nauczyciela</p>
      </div>
      <div class="quiz-list">
        ${unsolved
          .map((q) => {
            // Jeśli quiz ma atrybuty, przekazujemy id i quiz-attributes
            if (q.attributes) {
              const attrs = JSON.stringify(q.attributes).replace(
                /"/g,
                "&quot;"
              );
              return `<quiz-viewer quiz-id="${q.id}" quiz-attributes="${attrs}"></quiz-viewer>`;
            } else {
              // quiz w formacie płaskim (np. z custom API lub pluginu)
              const attrs = JSON.stringify(q).replace(/"/g, "&quot;");
              return `<quiz-viewer quiz-id="${q.id}" quiz-attributes="${attrs}"></quiz-viewer>`;
            }
          })
          .join("")}
      </div>
    `;
  }

  renderError(msg: string) {
    this.shadow.innerHTML = `<div style='color:red;'>${msg}</div>`;
  }
}
customElements.define("quiz-list", QuizList);
