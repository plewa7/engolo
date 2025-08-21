import "./quiz-viewer.ts";
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
      this.shadow.innerHTML = `<div>Brak nierozwiązanych quizów!</div>`;
      return;
    }
    this.shadow.innerHTML = `
      <style>
        .quiz-list { display: flex; flex-direction: column; gap: 16px; }
      </style>
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
