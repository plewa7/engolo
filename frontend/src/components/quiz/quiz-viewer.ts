// @ts-ignore
import quizViewerCss from "../../styles/quiz-viewer.css?inline";

interface QuizData {
  id: string;
  question: string;
  correctAnswer: string;
  options?: string[];
  type?: 'multiple-choice' | 'text-input';
  points?: number;
  timeLimit?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  isDaily?: boolean;
}

class QuizViewer extends HTMLElement {
  shadow: ShadowRoot;
  quizId: string | null = null;
  quiz: QuizData | null = null;
  startTime: number = 0;
  timer: number | null = null;
  timeRemaining: number = 0;
  isCompetitionMode: boolean = false;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["quiz-id", "quiz-attributes", "competition-mode"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "competition-mode") {
      this.isCompetitionMode = newValue === "true";
    }
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
    this.isCompetitionMode = this.getAttribute("competition-mode") === "true";
    this.loadQuiz();
  }

  disconnectedCallback() {
    if (this.timer) {
      clearInterval(this.timer);
    }
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
    
    // Get quiz data (compatible with our QuizData interface)
    const question = this.quiz.question || "Brak pytania";
    const optionsArr = this.quiz.options || [];
    const quizType = this.quiz.type || 'multiple-choice';
    const points = this.quiz.points || 10;
    const timeLimit = this.quiz.timeLimit || 30;
    const difficulty = this.quiz.difficulty || 'medium';

    let answerInput = '';
    
    if (quizType === 'multiple-choice' && optionsArr.length > 0) {
      answerInput = `
        <div class="answer-options">
          ${optionsArr.map((opt: string, idx: number) => `
            <label class="option-label">
              <input type="radio" name="answer" value="${opt}" required />
              <span class="option-marker">${String.fromCharCode(65 + idx)}</span>
              <span class="option-text">${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else {
      answerInput = `
        <div class="text-answer">
          <input type="text" name="answer" placeholder="Wpisz swoją odpowiedź..." class="text-input" required />
        </div>
      `;
    }

    const difficultyColor = difficulty === 'easy' ? '#4CAF50' : 
                           difficulty === 'hard' ? '#f44336' : '#FF9800';

    this.shadow.innerHTML = `
      <style data-quiz-style>
        ${quizViewerCss}
        
        .quiz-card {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 20px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border-left: 5px solid #2196F3;
          animation: slideInUp 0.5s ease;
        }

        .quiz-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .quiz-meta {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .quiz-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .difficulty-badge {
          background: ${difficultyColor};
        }

        .points-badge {
          background: #2196F3;
        }

        .time-badge {
          background: #FF9800;
        }

        .quiz-question {
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 25px;
          color: var(--text-primary);
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 4px solid #2196F3;
        }

        .answer-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .option-label:hover {
          border-color: #2196F3;
          background: #f8f9ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
        }

        .option-label input[type="radio"] {
          display: none;
        }

        .option-marker {
          width: 30px;
          height: 30px;
          border: 2px solid #e0e0e0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          color: #666;
          transition: all 0.3s ease;
        }

        .option-label input[type="radio"]:checked + .option-marker {
          background: #2196F3;
          border-color: #2196F3;
          color: white;
        }

        .option-text {
          flex: 1;
          font-size: 16px;
          color: var(--text-primary);
        }

        .text-answer {
          margin-bottom: 25px;
        }

        .text-input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .text-input:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .timer {
          background: #fff3e0;
          border: 2px solid #ff9800;
          border-radius: 25px;
          padding: 8px 16px;
          font-weight: 600;
          color: #f57c00;
          font-size: 14px;
        }

        .timer.warning {
          background: #ffebee;
          border-color: #f44336;
          color: #c62828;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-card {
          text-align: center;
          padding: 30px;
          border-radius: 16px;
          margin-top: 20px;
          animation: slideInUp 0.5s ease;
        }

        .result-correct {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
        }

        .result-incorrect {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
          color: white;
        }

        .result-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .result-text {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .correct-answer {
          font-size: 16px;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .quiz-card {
            padding: 20px;
          }
          
          .quiz-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .quiz-meta {
            justify-content: center;
          }
        }
      </style>
      
      <div class="quiz-card">
        <div class="quiz-header">
          <div class="quiz-meta">
            <span class="quiz-badge difficulty-badge">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
            <span class="quiz-badge points-badge">${points} pkt</span>
            <span class="quiz-badge time-badge">⏱️ ${timeLimit}s</span>
          </div>
          <div class="timer" id="timer">${timeLimit}s</div>
        </div>
        
        <div class="quiz-question">${question}</div>
        
        <form id="quiz-form">
          ${answerInput}
          <button type="submit" class="submit-btn">Wyślij odpowiedź</button>
        </form>
        
        <div id="result"></div>
      </div>
    `;
    
    // Start timer when quiz is rendered
    this.startTime = Date.now();
    this.startTimer();
    
    const form = this.shadow.querySelector<HTMLFormElement>("#quiz-form");
    if (form) {
      form.onsubmit = this.handleSubmit.bind(this);
    }
  }

  startTimer() {
    if (!this.quiz) return;
    
    const timeLimit = this.quiz.timeLimit || 30;
    this.timeRemaining = timeLimit;
    
    const timerElement = this.shadow.querySelector('#timer');
    if (!timerElement) return;
    
    this.timer = setInterval(() => {
      this.timeRemaining--;
      timerElement.textContent = `${this.timeRemaining}s`;
      
      if (this.timeRemaining <= 10) {
        timerElement.classList.add('warning');
      }
      
      if (this.timeRemaining <= 0) {
        if (this.timer) clearInterval(this.timer);
        this.timeUp();
      }
    }, 1000);
  }

  timeUp() {
    const form = this.shadow.querySelector<HTMLFormElement>("#quiz-form");
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Czas minął!";
      }
      
      // Auto-submit with current answer if any
      const answer = this.getCurrentAnswer();
      this.submitTimeUp(answer);
    }
  }

  getCurrentAnswer(): string {
    const form = this.shadow.querySelector<HTMLFormElement>("#quiz-form");
    if (!form) return '';
    
    const radioAnswer = (form.elements.namedItem("answer") as RadioNodeList)?.value;
    if (radioAnswer) return radioAnswer;
    
    const textAnswer = (form.querySelector('input[type="text"]') as HTMLInputElement)?.value;
    return textAnswer || '';
  }

  // loadStylesheet już nie jest potrzebne

  renderError(msg: string) {
    this.shadow.innerHTML = `<div style="color:red;">${msg}</div>`;
  }

  async handleSubmit(e: SubmitEvent, providedAnswer?: string) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    let answer = providedAnswer;
    if (!answer) {
      const radioAnswer = (form.elements.namedItem("answer") as RadioNodeList)?.value;
      const textAnswer = (form.querySelector('input[type="text"]') as HTMLInputElement)?.value;
      answer = radioAnswer || textAnswer || '';
    }
    
    await this.processAnswer(answer);
  }

  async submitTimeUp(answer: string) {
    await this.processAnswer(answer, true);
  }

  async processAnswer(answer: string, isTimeUp: boolean = false) {
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
    const correctAnswer = this.quiz?.correctAnswer || "";
    const isCorrect = answer === correctAnswer;
    
    // Get question text
    const question = this.quiz?.question || "Unknown question";

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

    // Show result with enhanced UI
    this.showResult(isCorrect, timeSpent, isTimeUp, correctAnswer);
  }

  showResult(isCorrect: boolean, timeSpent: number, isTimeUp: boolean = false, correctAnswer: string) {
    const resultElement = this.shadow.querySelector('#result');
    if (!resultElement) return;

    const points = this.quiz?.points || 10;
    const earnedPoints = isCorrect ? Math.max(1, points - Math.floor(timeSpent / 10)) : 0;

    const resultClass = isCorrect ? 'result-correct' : 'result-incorrect';
    const icon = isCorrect ? '🎉' : (isTimeUp ? '⏰' : '😔');
    const title = isCorrect ? 'Brawo!' : (isTimeUp ? 'Czas minął!' : 'Nie tym razem');
    
    resultElement.innerHTML = `
      <div class="result-card ${resultClass}">
        <div class="result-icon">${icon}</div>
        <div class="result-text">${title}</div>
        ${isCorrect ? `
          <div class="correct-answer">
            Zdobyłeś ${earnedPoints} punktów w ${timeSpent} sekund!
          </div>
        ` : `
          <div class="correct-answer">
            Poprawna odpowiedź: <strong>${correctAnswer}</strong>
            <br>Czas: ${timeSpent} sekund
          </div>
        `}
      </div>
    `;

    // Hide the form
    const form = this.shadow.querySelector('#quiz-form');
    if (form) {
      (form as HTMLElement).style.display = 'none';
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
