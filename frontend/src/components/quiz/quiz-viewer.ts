// @ts-ignore
import quizViewerCss from "../../styles/quiz-viewer.css?inline";
class QuizViewer extends HTMLElement {
  shadow: ShadowRoot;
  quizId: string | null = null;
  quiz: any = null;
  startTime: number = 0;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["quiz-id", "quiz-attributes"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "quiz-id" || name === "quiz-attributes") &&
      newValue !== oldValue
    ) {
      this.quizId = this.getAttribute("quiz-id");
      this.loadQuiz();
    }
  }

  connectedCallback() {
    this.quizId = this.getAttribute("quiz-id");
    this.loadQuiz();
  }

  loadQuiz() {
    const attrs = this.getAttribute("quiz-attributes");
    if (attrs) {
      try {
        this.quiz = JSON.parse(attrs);
        this.render();
        return;
      } catch (e) {
        this.renderError("Błąd danych quizu.");
        return;
      }
    }
    // NIE pobieraj quizu z API jeśli quiz-attributes już jest
    // if (this.quizId) {
    //   this.fetchQuiz();
    // }
  }

  async fetchQuiz() {
    if (!this.quizId) return;
    try {
      const API_URL = `http://localhost:1337/api/quizzes/${this.quizId}`;
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        this.quiz = data.data ? data.data.attributes : data;
        this.render();
      } else {
        this.renderError("Nie znaleziono quizu.");
      }
    } catch (err) {
      this.renderError("Błąd sieci.");
    }
  }

  render() {
    if (!this.quiz) {
      this.renderError("Brak danych quizu.");
      return;
    }
    // Obsługa quizów z atrybutami (Strapi)
    const question =
      this.quiz.question ||
      (this.quiz.attributes && this.quiz.attributes.question) ||
      "Brak pytania";
    const optionsArr =
      this.quiz.options ||
      (this.quiz.attributes && this.quiz.attributes.options) ||
      [];
    const options = (optionsArr || [])
      .map(
        (opt: string, idx: number) =>
          `<label class="option-label"><input type="radio" name="answer" value="${opt}" required /> <span class="option-text">${String.fromCharCode(
            65 + idx
          )}. ${opt}</span></label>`
      )
      .join("");
    this.shadow.innerHTML = `<style data-quiz-style>\n${quizViewerCss}\n</style>
      <div class="quiz">
        <div class="quiz-title">${question}</div>
        <form id="quiz-form">
          <div>${options}</div>
          <button type="submit">Wyślij odpowiedź</button>
        </form>
        <div id="result"></div>
      </div>
    `;
    
    // Start timer when quiz is rendered
    this.startTime = Date.now();
    
    const form = this.shadow.querySelector<HTMLFormElement>("#quiz-form");
    if (form) {
      form.onsubmit = this.handleSubmit.bind(this);
    }
  }

  // loadStylesheet już nie jest potrzebne

  renderError(msg: string) {
    this.shadow.innerHTML = `<div style="color:red;">${msg}</div>`;
  }

  async handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const answer = (form.elements.namedItem("answer") as RadioNodeList)?.value;
    const quizId = String(this.getAttribute("quiz-id"));
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000); // seconds
    
    // Get user ID
    let userId = "anon";
    const strapiUser = JSON.parse(localStorage.getItem("user") || "null");
    if (strapiUser && strapiUser.id) {
      userId = String(strapiUser.id);
    } else {
      const jwt = localStorage.getItem("strapi_jwt");
      if (jwt) {
        try {
          const payload = JSON.parse(atob(jwt.split(".")[1]));
          if (payload && payload.id) userId = String(payload.id);
        } catch (e) {}
      }
    }

    // Check if correct
    const correctAnswer = this.quiz.correctAnswer || 
                         (this.quiz.attributes && this.quiz.attributes.correctAnswer) || "";
    const isCorrect = answer === correctAnswer;
    
    // Get question text
    const question = this.quiz.question ||
                    (this.quiz.attributes && this.quiz.attributes.question) || 
                    "Unknown question";

    // Save detailed statistics
    await this.saveQuizStatistic({
      user: userId,
      quizId: quizId,
      question: question,
      userAnswer: answer || '',
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      attempts: 1,
      timeSpent: timeSpent,
      completedAt: new Date().toISOString(),
      exerciseType: 'teacher_quiz',
      category: 'Quiz nauczyciela'
    });

    // Legacy localStorage tracking (keep for compatibility)
    const solvedKey = `solved_quizzes_${userId}`;
    const solved = localStorage.getItem(solvedKey);
    let solvedIds: string[] = solved ? JSON.parse(solved) : [];
    if (!solvedIds.includes(quizId)) {
      solvedIds.push(quizId);
      localStorage.setItem(solvedKey, JSON.stringify(solvedIds));
    }

    // Show result
    if (isCorrect) {
      this.shadow.innerHTML = `<div style="color:green;">✅ Dobra odpowiedź!</div>`;
    } else {
      this.shadow.innerHTML = `<div style="color:red;">❌ Niestety, zła odpowiedź. Poprawna odpowiedź to: ${correctAnswer}</div>`;
    }
  }

  async saveQuizStatistic(statisticData: any) {
    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) {
        this.saveQuizStatisticLocally(statisticData);
        return;
      }

      const response = await fetch('http://localhost:1337/api/quiz-statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: statisticData })
      });

      if (response.ok) {
        // Quiz statistic saved successfully
      } else if (response.status === 403) {
        this.saveQuizStatisticLocally(statisticData);
      } else {
        this.saveQuizStatisticLocally(statisticData);
      }
    } catch (error: any) {
      this.saveQuizStatisticLocally(statisticData);
    }
  }

  saveQuizStatisticLocally(statisticData: any) {
    const storageKey = `quiz_statistics_${statisticData.user}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(statisticData);
    
    // Keep only last 100 statistics to avoid storage bloat
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existing));
  }
}
customElements.define("quiz-viewer", QuizViewer);
