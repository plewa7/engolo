// @ts-ignore
import quizEditorCss from "../../styles/quiz-editor.css?inline";

interface QuizData {
  question: string;
  correctAnswer: string;
  options: string[];
  type: 'multiple-choice' | 'text-input';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizSet {
  title: string;
  description: string;
  questions: QuizData[];
  timeLimit: number;
  isDaily: boolean;
  category: string;
}

class QuizSetEditor extends HTMLElement {
  shadow: ShadowRoot;
  currentQuizSet: Partial<QuizSet> = {
    title: '',
    description: '',
    questions: [],
    timeLimit: 300, // 5 minut na cały zestaw
    isDaily: false,
    category: 'Ogólny'
  };
  currentQuestion: Partial<QuizData> = {
    type: 'multiple-choice',
    points: 10,
    difficulty: 'medium'
  };
  optionsCount: number = 4;
  editingQuestionIndex: number = -1; // -1 = nowe pytanie, >= 0 = edycja istniejącego

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  updateQuizSetData(field: keyof QuizSet, value: any) {
    this.currentQuizSet[field] = value;
  }

  updateQuestionData(field: keyof QuizData, value: any) {
    this.currentQuestion[field] = value;
    if (field === 'type') {
      this.renderQuestionSection();
    }
  }

  addOption() {
    this.optionsCount++;
    this.renderOptionsSection();
  }

  removeOption() {
    if (this.optionsCount > 2) {
      this.optionsCount--;
      this.renderOptionsSection();
    }
  }

  renderOptionsSection() {
    const optionsContainer = this.shadow.querySelector('#options-container');
    if (optionsContainer && this.currentQuestion.type === 'multiple-choice') {
      optionsContainer.innerHTML = `
        <div class="options-header">
          <label class="form-label">Opcje odpowiedzi</label>
          <div class="options-controls">
            <button type="button" class="btn-small" onclick="this.getRootNode().host.removeOption()">-</button>
            <span>${this.optionsCount} opcji</span>
            <button type="button" class="btn-small" onclick="this.getRootNode().host.addOption()">+</button>
          </div>
        </div>
        ${Array.from({length: this.optionsCount}, (_, i) => `
          <div class="option-input-group">
            <input 
              type="text" 
              name="option-${i}" 
              placeholder="Opcja ${i + 1}"
              class="form-input option-input"
              data-option-index="${i}"
            >
            <label class="correct-checkbox">
              <input 
                type="radio" 
                name="correct-option" 
                value="${i}"
                ${i === 0 ? 'checked' : ''}
              >
              <span class="checkmark">✓</span>
              Poprawna
            </label>
          </div>
        `).join('')}
      `;
    }
  }

  renderQuestionSection() {
    const questionSection = this.shadow.querySelector('#question-section');
    if (questionSection) {
      if (this.currentQuestion.type === 'multiple-choice') {
        questionSection.innerHTML = `
          <div id="options-container"></div>
        `;
        this.renderOptionsSection();
      } else {
        questionSection.innerHTML = `
          <div class="form-group">
            <label class="form-label">Poprawna odpowiedź</label>
            <input 
              type="text" 
              name="correctAnswer" 
              placeholder="Wpisz poprawną odpowiedź"
              class="form-input"
              required
            >
            <small class="form-hint">Studenci będą wpisywać odpowiedź w polu tekstowym</small>
          </div>
        `;
      }
    }
  }

  render() {
    this.shadow.innerHTML = `
      <style data-quiz-editor-style>
        ${quizEditorCss}
        
        .quiz-editor-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .editor-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .editor-header h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          font-weight: 700;
        }

        .editor-header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }

        .quiz-form {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .form-section {
          margin-bottom: 35px;
          padding-bottom: 30px;
          border-bottom: 2px solid #f0f0f0;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .form-hint {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 5px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-row-three {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        .select-group {
          position: relative;
        }

        .form-select {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .form-select:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .type-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        .type-option {
          padding: 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .type-option:hover {
          border-color: #2196F3;
          background: #f8f9ff;
        }

        .type-option.active {
          border-color: #2196F3;
          background: #e3f2fd;
          color: #1976D2;
        }

        .type-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .type-title {
          font-weight: 600;
          margin-bottom: 5px;
        }

        .type-description {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .options-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-small {
          width: 30px;
          height: 30px;
          border: 2px solid #e0e0e0;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-small:hover {
          border-color: #2196F3;
          background: #f8f9ff;
        }

        .option-input-group {
          display: flex;
          gap: 15px;
          align-items: center;
          margin-bottom: 12px;
        }

        .option-input {
          flex: 1;
        }

        .correct-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .correct-checkbox input[type="radio"] {
          display: none;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #e0e0e0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          color: transparent;
          font-size: 12px;
        }

        .correct-checkbox input[type="radio"]:checked + .checkmark {
          background: #4CAF50;
          border-color: #4CAF50;
          color: white;
        }

        .difficulty-selector {
          display: flex;
          gap: 10px;
        }

        .difficulty-option {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .difficulty-option.easy {
          color: #4CAF50;
        }

        .difficulty-option.medium {
          color: #FF9800;
        }

        .difficulty-option.hard {
          color: #f44336;
        }

        .difficulty-option.active {
          border-color: currentColor;
          background: currentColor;
          color: white;
        }

        .toggle-switch {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .toggle-switch input {
          display: none;
        }

        .toggle-slider {
          width: 50px;
          height: 26px;
          background: #e0e0e0;
          border-radius: 13px;
          position: relative;
          transition: all 0.3s ease;
        }

        .toggle-slider::after {
          content: '';
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .toggle-switch input:checked + .toggle-slider {
          background: #2196F3;
        }

        .toggle-switch input:checked + .toggle-slider::after {
          left: 26px;
        }

        .submit-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 30px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .status-message {
          margin-top: 20px;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
        }

        .status-success {
          background: #e8f5e8;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }

        .status-error {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }

        .preview-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
        }

        .preview-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
          color: var(--text-primary);
        }

        .preview-question {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          border-left: 4px solid #2196F3;
        }

        @media (max-width: 768px) {
          .form-row,
          .form-row-three {
            grid-template-columns: 1fr;
          }
          
          .type-selector {
            grid-template-columns: 1fr;
          }

          .option-input-group {
            flex-direction: column;
            align-items: stretch;
          }
        }
      </style>

      <div class="quiz-editor-container">
        <div class="editor-header">
          <h1>🎯 Kreator Quizów</h1>
          <p>Twórz angażujące quizy dla swoich uczniów</p>
        </div>

        <form id="quiz-form" class="quiz-form">
          <!-- Typ pytania -->
          <div class="form-section">
            <h3 class="section-title">📝 Typ pytania</h3>
            <div class="type-selector">
              <div class="type-option active" data-type="multiple-choice">
                <div class="type-icon">☑️</div>
                <div class="type-title">Wielokrotny wybór</div>
                <div class="type-description">Pytanie z opcjami do wyboru</div>
              </div>
              <div class="type-option" data-type="text-input">
                <div class="type-icon">✏️</div>
                <div class="type-title">Odpowiedź tekstowa</div>
                <div class="type-description">Student wpisuje odpowiedź</div>
              </div>
            </div>
          </div>

          <!-- Pytanie -->
          <div class="form-section">
            <h3 class="section-title">❓ Pytanie</h3>
            <div class="form-group">
              <label class="form-label">Treść pytania</label>
              <textarea 
                name="question" 
                placeholder="Wpisz swoje pytanie..."
                class="form-input form-textarea"
                required
              ></textarea>
              <small class="form-hint">Napisz jasne i zrozumiałe pytanie</small>
            </div>
          </div>

          <!-- Odpowiedzi -->
          <div class="form-section">
            <h3 class="section-title">✅ Odpowiedzi</h3>
            <div id="question-section">
              <div id="options-container"></div>
            </div>
          </div>

          <!-- Ustawienia -->
          <div class="form-section">
            <h3 class="section-title">⚙️ Ustawienia</h3>
            <div class="form-row-three">
              <div class="form-group">
                <label class="form-label">Punkty za poprawną odpowiedź</label>
                <input 
                  type="number" 
                  name="points" 
                  value="10" 
                  min="1" 
                  max="100"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label class="form-label">Limit czasu (sekundy)</label>
                <input 
                  type="number" 
                  name="timeLimit" 
                  value="30" 
                  min="10" 
                  max="300"
                  class="form-input"
                >
              </div>
              <div class="form-group">
                <label class="form-label">Poziom trudności</label>
                <div class="difficulty-selector">
                  <div class="difficulty-option easy" data-difficulty="easy">Łatwy</div>
                  <div class="difficulty-option medium active" data-difficulty="medium">Średni</div>
                  <div class="difficulty-option hard" data-difficulty="hard">Trudny</div>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="toggle-switch">
                <input type="checkbox" name="isDaily">
                <span class="toggle-slider"></span>
                <span>Ustaw jako dzienny challenge</span>
              </label>
              <small class="form-hint">Dzienny challenge będzie dostępny dla wszystkich studentów</small>
            </div>
          </div>

          <button type="submit" class="submit-btn">
            🚀 Utwórz Quiz
          </button>
        </form>

        <div id="status"></div>
      </div>
    `;
    
    this.renderQuestionSection();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = this.shadow.querySelector<HTMLFormElement>("#quiz-form");
    if (form) {
      form.onsubmit = this.handleSubmit.bind(this);
    }

    // Type selector
    const typeOptions = this.shadow.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        typeOptions.forEach(opt => opt.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        const type = (e.target as HTMLElement).dataset.type as 'multiple-choice' | 'text-input';
        this.currentQuestion.type = type;
        this.renderQuestionSection();
      });
    });

    // Difficulty selector
    const difficultyOptions = this.shadow.querySelectorAll('.difficulty-option');
    difficultyOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        difficultyOptions.forEach(opt => opt.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        const difficulty = (e.target as HTMLElement).dataset.difficulty;
        this.currentQuestion.difficulty = difficulty as 'easy' | 'medium' | 'hard';
      });
    });

    // Form inputs
    const questionInput = this.shadow.querySelector('textarea[name="question"]') as HTMLTextAreaElement;
    const pointsInput = this.shadow.querySelector('input[name="points"]') as HTMLInputElement;
    const dailyToggle = this.shadow.querySelector('input[name="isDaily"]') as HTMLInputElement;

    if (questionInput) {
      questionInput.addEventListener('input', (e) => {
        this.currentQuestion.question = (e.target as HTMLInputElement).value;
      });
    }

    if (pointsInput) {
      pointsInput.addEventListener('input', (e) => {
        this.currentQuestion.points = parseInt((e.target as HTMLInputElement).value) || 10;
      });
    }

    if (dailyToggle) {
      dailyToggle.addEventListener('change', (e) => {
        this.currentQuizSet.isDaily = (e.target as HTMLInputElement).checked;
      });
    }
  }

  resetCurrentQuestion() {
    this.currentQuestion = {
      type: 'multiple-choice',
      points: 10,
      difficulty: 'medium'
    };
    this.optionsCount = 4;
    this.editingQuestionIndex = -1;
  }

  async handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    // Collect current question data
    const question = (form.elements.namedItem("question") as HTMLTextAreaElement)?.value;
    const points = parseInt((form.elements.namedItem("points") as HTMLInputElement)?.value) || 10;
    const isDaily = (form.elements.namedItem("isDaily") as HTMLInputElement)?.checked || false;

    let correctAnswer = '';
    let options: string[] = [];

    if (this.currentQuestion.type === 'multiple-choice') {
      // Collect options and correct answer for multiple choice
      const optionInputs = this.shadow.querySelectorAll('.option-input') as NodeListOf<HTMLInputElement>;
      const correctRadio = this.shadow.querySelector('input[name="correct-option"]:checked') as HTMLInputElement;
      
      options = Array.from(optionInputs).map(input => input.value.trim()).filter(value => value);
      const correctIndex = correctRadio ? parseInt(correctRadio.value) : 0;
      correctAnswer = options[correctIndex] || '';

      if (options.length < 2) {
        this.showStatus('Dodaj przynajmniej 2 opcje odpowiedzi', 'error');
        return;
      }
    } else {
      // For text input questions
      correctAnswer = (form.elements.namedItem("correctAnswer") as HTMLInputElement)?.value?.trim() || '';
    }

    if (!question || !correctAnswer) {
      this.showStatus('Wypełnij wszystkie wymagane pola', 'error');
      return;
    }

    // Validate required fields
    if (!question || !correctAnswer || !options.every(opt => opt.trim())) {
      this.showStatus('Wszystkie pola są wymagane', 'error');
      return;
    }

    // Create complete question object
    const completeQuestion: QuizData = {
      question: question,
      correctAnswer: correctAnswer,
      options: options,
      type: this.currentQuestion.type || 'multiple-choice',
      points: points,
      difficulty: this.currentQuestion.difficulty || 'medium'
    };

    if (!this.currentQuizSet.questions) {
      this.currentQuizSet.questions = [];
    }
    this.currentQuizSet.questions.push(completeQuestion);

    // Update quiz set data
    this.currentQuizSet.isDaily = isDaily;

    // Show success and allow adding more questions
    this.showStatus(`Pytanie ${this.currentQuizSet.questions.length} dodane! Dodaj kolejne lub zapisz zestaw.`, 'success');
    
    // Reset form for next question
    form.reset();
    this.resetCurrentQuestion();
    this.render();
  }

  async saveQuizSet() {
    if (!this.currentQuizSet.questions || this.currentQuizSet.questions.length === 0) {
      this.showStatus('Dodaj przynajmniej jedno pytanie do zestawu', 'error');
      return;
    }

    try {
      const API_URL = "http://localhost:1337/api/quiz-sets";
      const token = localStorage.getItem("strapi_jwt");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: this.currentQuizSet }),
      });

      if (res.ok) {
        this.showStatus(`Zestaw z ${this.currentQuizSet.questions.length} pytaniami został zapisany! 🎉`, 'success');
        // Reset everything
        this.currentQuizSet = {
          title: '',
          description: '',
          questions: [],
          timeLimit: 300,
          isDaily: false,
          category: 'Ogólny'
        };
        this.resetCurrentQuestion();
        this.render();
      } else if (res.status === 403) {
        this.showStatus('Brak uprawnień do tworzenia zestawów quizów. Skontaktuj się z administratorem.', 'error');
      } else if (res.status === 404) {
        this.showStatus('Nie można połączyć z serwerem. Sprawdź czy backend działa.', 'error');
      } else {
        this.showStatus('Wystąpił błąd podczas tworzenia zestawu.', 'error');
      }
    } catch (err) {
      this.showStatus('Błąd połączenia z serwerem.', 'error');
    }
  }

  showStatus(message: string, type: 'success' | 'error') {
    const statusDiv = this.shadow.querySelector<HTMLDivElement>("#status");
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="status-message status-${type}">
          ${message}
        </div>
      `;
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        if (statusDiv) {
          statusDiv.innerHTML = '';
        }
      }, 5000);
    }
  }
}
customElements.define("quiz-set-editor", QuizSetEditor);
