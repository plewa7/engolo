interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  type: 'multiple-choice' | 'text-input';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizSet {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number;
  isDaily: boolean;
  category: string;
}

class QuizSetViewer extends HTMLElement {
  shadow: ShadowRoot;
  quizSetId: string | null = null;
  quizSet: QuizSet | null = null;
  quizSetData: any = null; // Dodajemy właściwość dla danych
  currentQuestionIndex: number = 0;
  userAnswers: string[] = [];
  startTime: number = 0;
  timer: number | null = null;
  timeRemaining: number = 0;
  isActive: boolean = false;
  totalPoints: number = 0;
  earnedPoints: number = 0;
  resultSubmitted: boolean = false; // Zabezpieczenie przed wielokrotnym wysyłaniem
  isFinishing: boolean = false; // Dodatkowe zabezpieczenie przed wielokrotnym finishem
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["quiz-set-id", "quiz-set-attributes"];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (
      (name === "quiz-set-id" || name === "quiz-set-attributes") &&
      newValue !== oldValue
    ) {
      this.quizSetId = this.getAttribute("quiz-set-id");
      this.loadQuizSet();
    }
  }

  connectedCallback() {
    this.quizSetId = this.getAttribute("quiz-set-id");
    this.loadQuizSet();
  }

  disconnectedCallback() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async loadQuizSet() {
    if (this.quizSetData) {
      try {
        this.quizSet = {
          id: this.quizSetId || this.quizSetData.id || "unknown",
          title: this.quizSetData.title || "Quiz Set",
          description: this.quizSetData.description || "",
          questions: this.quizSetData.questions || [],
          timeLimit: this.quizSetData.timeLimit || 300,
          isDaily: this.quizSetData.isDaily || false,
          category: this.quizSetData.category || "Ogólny"
        };
        this.totalPoints = this.quizSet.questions.reduce((sum, q) => sum + (q.points || 10), 0);
        
        const isCompleted = await this.checkIfCompleted();
        if (isCompleted) {
          this.renderCompleted();
        } else {
          this.render();
        }
        return;
      } catch (e) {
      }
    }
    
    const attrs = this.getAttribute("quiz-set-attributes");
    if (attrs) {
      try {
        const data = JSON.parse(attrs);
        this.quizSet = {
          id: this.quizSetId || data.id || "unknown",
          title: data.title || "Quiz Set",
          description: data.description || "",
          questions: data.questions || [],
          timeLimit: data.timeLimit || 300,
          isDaily: data.isDaily || false,
          category: data.category || "Ogólny"
        };
        this.totalPoints = this.quizSet.questions.reduce((sum, q) => sum + (q.points || 10), 0);
        
        const isCompleted = await this.checkIfCompleted();
        if (isCompleted) {
          this.renderCompleted();
        } else {
          this.render();
        }
        return;
      } catch (e) {
        this.renderError("Błąd danych zestawu quizów: " + (e as Error).message);
        return;
      }
    } else {
      console.error("💥 No quiz-set-attributes found and no direct data");
      this.renderError("Brak atrybutów zestawu quizów");
    }
  }

  async checkIfCompleted() {
    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) return false;

      // Pobierz current user ID tak samo jak w quiz-list
      const user = localStorage.getItem("user");
      const currentUserId = user ? JSON.parse(user).id : null;
      if (!currentUserId) return false;

      const API_URL = `http://localhost:1337/api/quiz-statistics?filters[quizSetId][$eq]=${this.quizSet!.id}&populate=user`;
      
      const response = await fetch(API_URL, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const userStats = data.data.filter((stat: any) => {
          const user = stat.attributes?.user?.data;
          return user && String(user.id) === String(currentUserId);
        });

        const isCompleted = userStats.length > 0;
        return isCompleted;
      }
    } catch (err) {
    }
    return false;
  }

  renderCompleted() {
    this.shadow.innerHTML = `
      <style></style>
      <div class="quiz-container">
        <div class="quiz-header">
          <h1>${this.quizSet!.title}</h1>
          <div class="quiz-info">
            <span class="category">${this.quizSet!.category}</span>
            ${this.quizSet!.isDaily ? '<span class="daily-badge">Dzienny Challenge</span>' : ''}
          </div>
        </div>
        
        <div class="completed-notice">
          <div class="completed-icon">✅</div>
          <h2>Quiz Set Ukończony!</h2>
          <p>Ten zestaw quizów został już przez Ciebie rozwiązany.</p>
          <p>Spróbuj innych quiz-setów lub wróć jutro po nowe wyzwania!</p>
          
          <button class="back-btn" onclick="history.back()">
            ← Powrót do listy quiz-setów
          </button>
        </div>
      </div>
    `;
  }

  startQuizSet() {
    if (!this.quizSet || this.quizSet.questions.length === 0) return;
    
    this.isActive = true;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.earnedPoints = 0;
    this.startTime = Date.now();
    this.timeRemaining = this.quizSet.timeLimit;
    this.resultSubmitted = false; // Reset flagi przed rozpoczęciem nowego quizu
    this.isFinishing = false; // Reset flagi finishing
    
    this.startTimer();
    this.render();
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      
      if (this.timeRemaining <= 0) {
        this.finishQuizSet();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = this.shadow.querySelector('.timer-display');
    if (timerEl) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (this.timeRemaining <= 60) {
        timerEl.classList.add('timer-warning');
      }
    }
  }

  nextQuestion() {
    // Sprawdź czy quiz jest już nieaktywny (zabezpieczenie przed wielokrotnym kliknięciem)
    if (!this.isActive) return;
    
    const form = this.shadow.querySelector('.quiz-form') as HTMLFormElement;
    if (!form) return;

    // Zablokuj przycisk od razu i ustaw flagę processing
    const nextBtn = this.shadow.getElementById('next-btn') as HTMLButtonElement;
    if (nextBtn) {
      if (nextBtn.disabled) return; // Jeśli przycisk już zablokowany, nie rób nic więcej
      nextBtn.disabled = true;
      nextBtn.textContent = '⏳ Przetwarzanie...';
    }

    const formData = new FormData(form);
    const answer = formData.get('answer') as string;
    
    if (!answer) {
      this.showStatus('Wybierz odpowiedź przed przejściem dalej!', 'error');
      // Odblokuj przycisk przy błędzie
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = this.currentQuestionIndex === this.quizSet!.questions.length - 1 ? '🏁 Zakończ' : '▶️ Następne';
      }
      return;
    }

    this.userAnswers.push(answer);
    
    // Check if answer is correct
    const currentQuestion = this.quizSet!.questions[this.currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      this.earnedPoints += currentQuestion.points;
      this.showStatus('Poprawna odpowiedź! +' + currentQuestion.points + ' pkt', 'success');
    } else {
      this.showStatus('Niepoprawna odpowiedź. Poprawna: ' + currentQuestion.correctAnswer, 'error');
    }

    setTimeout(() => {
      // Sprawdź ponownie czy quiz jest nadal aktywny
      if (!this.isActive) return;
      
      this.currentQuestionIndex++;
      
      if (this.currentQuestionIndex >= this.quizSet!.questions.length) {
        this.finishQuizSet();
      } else {
        this.render();
      }
    }, 1500);
  }

  async finishQuizSet() {
    if (!this.isActive || this.isFinishing) return;
    
    this.isFinishing = true;
    this.isActive = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    const percentage = Math.round((this.earnedPoints / this.totalPoints) * 100);

    // Save result to localStorage
    this.saveResult();

    // Send result to backend
    await this.submitResult(timeSpent, percentage);

    this.renderResults(timeSpent, percentage);
  }

  saveResult() {
    const userId = this.getCurrentUserId();
    const solvedKey = `solved_quizzes_${userId}`;
    const solved = JSON.parse(localStorage.getItem(solvedKey) || "[]");
    
    if (!solved.includes(this.quizSet!.id)) {
      solved.push(this.quizSet!.id);
      localStorage.setItem(solvedKey, JSON.stringify(solved));
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

  async submitResult(timeSpent: number, percentage: number) {
    if (this.resultSubmitted) {
      return;
    }
    
    try {
      const API_URL = "http://localhost:1337/api/quiz-statistics";
      const token = localStorage.getItem("strapi_jwt");
      
      if (!token) {
        return;
      }

      this.resultSubmitted = true;

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const result = {
        data: {
          quizSetId: String(this.quizSet!.id),
          score: this.earnedPoints,
          totalPoints: this.totalPoints,
          timeSpent: timeSpent,
          percentage: percentage,
          completedAt: new Date().toISOString(),
          answers: this.userAnswers.length > 0 ? this.userAnswers : ["no answers"]
        }
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(result)
      });

      let responseJson = null;
      let responseText = null;
      try {
        responseText = await response.text();
        try {
          responseJson = JSON.parse(responseText);
        } catch (e) {}
      } catch (e) {
        responseText = "(brak odpowiedzi)";
      }

      if (response.ok) {
        if (response.status === 200 && responseJson && responseJson.data) {
          this.resultSubmitted = true;
          this.renderCompleted();
          this.dispatchEvent(new CustomEvent('quiz-completed', {
            bubbles: true,
            detail: { quizSetId: this.quizSet!.id }
          }));
          return;
        }
        this.dispatchEvent(new CustomEvent('quiz-completed', {
          bubbles: true,
          detail: { quizSetId: this.quizSet!.id }
        }));
      } else {
      }
    } catch (err) {
    }
  }

  showStatus(message: string, type: 'success' | 'error') {
    const statusEl = this.shadow.querySelector('.status-message');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `status-message ${type}`;
      statusEl.classList.add('show');
      
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, 3000);
    }
  }

  render() {
    if (!this.quizSet) {
      this.renderError("Brak danych zestawu quizów.");
      return;
    }

    if (!this.isActive) {
      this.renderPreview();
    } else {
      this.renderQuestion();
    }
  }

  renderPreview() {
    if (!this.quizSet) return;

    const difficultyColors = {
      easy: '#4CAF50',
      medium: '#FF9800', 
      hard: '#f44336'
    };

    // Calculate average difficulty
    const difficulties = this.quizSet.questions.map(q => q.difficulty);
    const avgDifficulty = difficulties.includes('hard') ? 'hard' : 
                         difficulties.includes('medium') ? 'medium' : 'easy';

    this.shadow.innerHTML = `
      <style>
        
        .quiz-set-preview {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 20px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border-left: 5px solid #2196F3;
          animation: slideInUp 0.5s ease;
        }

        .quiz-set-preview:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(0,0,0,0.15);
        }

        .quiz-set-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .quiz-set-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 10px;
        }

        .quiz-set-description {
          color: #666;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .quiz-set-meta {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 25px;
        }

        .meta-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .questions-badge {
          background: #2196F3;
        }

        .points-badge {
          background: #4CAF50;
        }

        .time-badge {
          background: #FF9800;
        }

        .difficulty-badge {
          background: ${difficultyColors[avgDifficulty]};
        }

        .start-button {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
          display: block;
          margin: 0 auto;
        }

        .start-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
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
      </style>

      <div class="quiz-set-preview">
        <div class="quiz-set-header">
          <h2 class="quiz-set-title">${this.quizSet.title}</h2>
          <p class="quiz-set-description">${this.quizSet.description}</p>
        </div>

        <div class="quiz-set-meta">
          <span class="meta-badge questions-badge">
            📝 ${this.quizSet.questions.length} pytań
          </span>
          <span class="meta-badge points-badge">
            🏆 ${this.totalPoints} pkt
          </span>
          <span class="meta-badge time-badge">
            ⏱️ ${Math.ceil(this.quizSet.timeLimit / 60)} min
          </span>
          <span class="meta-badge difficulty-badge">
            📊 ${avgDifficulty === 'easy' ? 'Łatwy' : avgDifficulty === 'medium' ? 'Średni' : 'Trudny'}
          </span>
        </div>

        <button class="start-button" id="start-btn">
          🚀 Rozpocznij Quiz Set
        </button>
      </div>
    `;

    const startBtn = this.shadow.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuizSet());
    }
  }

  renderQuestion() {
    if (!this.quizSet || !this.isActive) return;

    const currentQuestion = this.quizSet.questions[this.currentQuestionIndex];
    const progress = ((this.currentQuestionIndex + 1) / this.quizSet.questions.length) * 100;

    let answerInput = '';
    
    if (currentQuestion.type === 'multiple-choice') {
      answerInput = `
        <div class="answer-options">
          ${currentQuestion.options.map((opt: string, idx: number) => `
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

    this.shadow.innerHTML = `
      <style>
        
        .quiz-container {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          animation: slideInUp 0.5s ease;
        }

        .quiz-progress {
          background: #f0f0f0;
          border-radius: 10px;
          height: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .progress-bar {
          background: linear-gradient(90deg, #2196F3, #21CBF3);
          height: 100%;
          transition: width 0.3s ease;
          width: ${progress}%;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .question-counter {
          font-weight: 600;
          color: #666;
        }

        .timer-display {
          background: #FF9800;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 16px;
        }

        .timer-warning {
          background: #f44336 !important;
          animation: pulse 1s infinite;
        }

        .points-display {
          background: #4CAF50;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
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
          gap: 12px;
          padding: 15px 20px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .option-label:hover {
          border-color: #2196F3;
          background: #f8f9ff;
        }

        .option-label input[type="radio"] {
          display: none;
        }

        .option-label input[type="radio"]:checked + .option-marker {
          background: #2196F3;
          color: white;
        }

        .option-label input[type="radio"]:checked ~ .option-text {
          color: #2196F3;
          font-weight: 600;
        }

        .option-marker {
          min-width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #e0e0e0;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .option-text {
          flex: 1;
          font-size: 16px;
        }

        .text-input {
          width: 100%;
          padding: 15px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          margin-bottom: 25px;
        }

        .text-input:focus {
          border-color: #2196F3;
          outline: none;
        }

        .next-button {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .next-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
        }

        .status-message {
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .status-message.show {
          opacity: 1;
          transform: translateY(0);
        }

        .status-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
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
      </style>

      <div class="quiz-container">
        <div class="quiz-progress">
          <div class="progress-bar"></div>
        </div>

        <div class="quiz-header">
          <span class="question-counter">
            Pytanie ${this.currentQuestionIndex + 1} z ${this.quizSet.questions.length}
          </span>
          <div class="timer-display">${Math.floor(this.timeRemaining / 60)}:${(this.timeRemaining % 60).toString().padStart(2, '0')}</div>
          <span class="points-display">
            ${this.earnedPoints} / ${this.totalPoints} pkt
          </span>
        </div>

        <div class="status-message"></div>

        <div class="quiz-question">
          ${currentQuestion.question}
        </div>

        <form class="quiz-form">
          ${answerInput}
          <button type="button" class="next-button" id="next-btn">
            ${this.currentQuestionIndex === this.quizSet.questions.length - 1 ? '🏁 Zakończ' : '▶️ Następne'}
          </button>
        </form>
      </div>
    `;

    const nextBtn = this.shadow.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // Start timer display update
    setTimeout(() => this.updateTimerDisplay(), 100);
  }

  renderResults(timeSpent: number, percentage: number) {
    if (!this.quizSet) return;

    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : 
                  percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    
    const gradeColor = percentage >= 80 ? '#4CAF50' : percentage >= 60 ? '#FF9800' : '#f44336';

    this.shadow.innerHTML = `
      <style>
        
        .results-container {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          animation: slideInUp 0.5s ease;
        }

        .results-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .grade-display {
          font-size: 72px;
          font-weight: 900;
          color: ${gradeColor};
          margin: 20px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .score-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }

        .score-item {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #2196F3;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .score-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .results-message {
          font-size: 18px;
          color: #666;
          margin: 20px 0;
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
      </style>

      <div class="results-container">
        <h2 class="results-title">🎉 Quiz Set Ukończony!</h2>
        
        <div class="grade-display">${grade}</div>
        
        <div class="score-details">
          <div class="score-item">
            <div class="score-value">${this.earnedPoints}</div>
            <div class="score-label">Zdobyte punkty</div>
          </div>
          <div class="score-item">
            <div class="score-value">${percentage}%</div>
            <div class="score-label">Procent poprawnych</div>
          </div>
          <div class="score-item">
            <div class="score-value">${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}</div>
            <div class="score-label">Czas rozwiązania</div>
          </div>
          <div class="score-item">
            <div class="score-value">${this.userAnswers.filter((answer, idx) => 
              answer === this.quizSet!.questions[idx].correctAnswer).length}</div>
            <div class="score-label">Poprawne odpowiedzi</div>
          </div>
        </div>

        <p class="results-message">
          ${percentage >= 80 ? 'Świetna robota! Doskonały wynik!' : 
            percentage >= 60 ? 'Dobra robota! Możesz jeszcze lepiej!' : 
            'Spróbuj ponownie, aby poprawić wynik!'}
        </p>
      </div>
    `;
  }

  renderError(msg: string) {
    this.shadow.innerHTML = `
      <div style="color: red; padding: 20px; text-align: center; background: #ffebee; border-radius: 8px;">
        ${msg}
      </div>
    `;
  }
}

customElements.define("quiz-set-viewer", QuizSetViewer);
