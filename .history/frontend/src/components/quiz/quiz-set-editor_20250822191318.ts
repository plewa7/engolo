// @ts-ignore
import "../../styles/globals.css";

interface QuizData {
  question: string;
  correctAnswer: string;
  options: string[];
  type: 'multiple-choice' | 'text-input';
  points: number;
}

interface QuizSet {
  title: string;
  description: string;
  questions: QuizData[];
  timeLimit: number;
  isDaily: boolean;
}

class QuizSetEditor extends HTMLElement {
  shadow: ShadowRoot;
  currentQuizSet: Partial<QuizSet> = {
    title: '',
    description: '',
    questions: [],
    timeLimit: 300, // 5 minut na cały zestaw
    isDaily: false
  };
  currentQuestion: Partial<QuizData> = {
    type: 'multiple-choice',
    points: 10
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

  resetTypeSelector() {
    const typeOptions = this.shadow.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-type') === 'multiple-choice') {
        option.classList.add('active');
      }
    });
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
          <div class="option-controls">
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

  addQuestionToSet() {
    const questionForm = this.shadow.querySelector('#question-form') as HTMLFormElement;
    if (!questionForm) return;

    const formData = new FormData(questionForm);
    const question = formData.get('question') as string;
    const points = parseInt(formData.get('points') as string) || 10;

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
      correctAnswer = (formData.get('correctAnswer') as string)?.trim() || '';
    }

    if (!question || !correctAnswer) {
      this.showStatus('Wypełnij wszystkie wymagane pola', 'error');
      return;
    }

    const newQuestion: QuizData = {
      question,
      correctAnswer,
      options,
      type: this.currentQuestion.type || 'multiple-choice',
      points
    };

    if (this.editingQuestionIndex >= 0) {
      // Editing existing question
      this.currentQuizSet.questions![this.editingQuestionIndex] = newQuestion;
      this.editingQuestionIndex = -1;
      this.showStatus('Pytanie zostało zaktualizowane', 'success');
    } else {
      // Adding new question
      this.currentQuizSet.questions!.push(newQuestion);
      this.showStatus('Pytanie zostało dodane do zestawu', 'success');
    }

    // Reset form
    questionForm.reset();
    this.currentQuestion = {
      type: 'multiple-choice',
      points: 10
    };
    this.optionsCount = 4;
    this.resetTypeSelector();
    this.renderQuestionsList();
    this.renderQuestionSection();
  }

  editQuestion(index: number) {
    const question = this.currentQuizSet.questions![index];
    this.currentQuestion = { ...question };
    this.editingQuestionIndex = index;
    
    // Fill form with question data
    const questionInput = this.shadow.querySelector('textarea[name="question"]') as HTMLTextAreaElement;
    const pointsInput = this.shadow.querySelector('input[name="points"]') as HTMLInputElement;
    
    if (questionInput) questionInput.value = question.question;
    if (pointsInput) pointsInput.value = question.points.toString();

    // Set type
    const typeOptions = this.shadow.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-type') === question.type) {
        option.classList.add('active');
      }
    });

    this.renderQuestionSection();
    this.showStatus('Edytujesz pytanie. Kliknij "Dodaj pytanie" aby zapisać zmiany.', 'info');
  }

  removeQuestion(index: number) {
    if (confirm('Czy na pewno chcesz usunąć to pytanie?')) {
      this.currentQuizSet.questions!.splice(index, 1);
      this.renderQuestionsList();
      this.showStatus('Pytanie zostało usunięte', 'success');
    }
  }

  renderQuestionsList() {
    const questionsContainer = this.shadow.querySelector('#questions-list');
    if (!questionsContainer) return;

    if (!this.currentQuizSet.questions || this.currentQuizSet.questions.length === 0) {
      questionsContainer.innerHTML = `
        <div class="no-questions">
          <p>Brak pytań w zestawie</p>
          <small>Dodaj pierwsze pytanie używając formularza powyżej</small>
        </div>
      `;
      return;
    }

    questionsContainer.innerHTML = `
      <h3>Pytania w zestawie (${this.currentQuizSet.questions.length})</h3>
      <div class="questions-grid">
        ${this.currentQuizSet.questions.map((q, index) => `
          <div class="question-card">
            <div class="question-header">
              <span class="question-number">${index + 1}</span>
              <span class="question-type ${q.type}">${q.type === 'multiple-choice' ? 'Wybór' : 'Tekst'}</span>
            </div>
            <div class="question-text">${q.question}</div>
            <div class="question-footer">
              <span class="question-points">${q.points} pkt</span>
              <div class="question-actions">
                <button type="button" class="btn-edit" onclick="this.getRootNode().host.editQuestion(${index})">
                  ✏️ Edytuj
                </button>
                <button type="button" class="btn-remove" onclick="this.getRootNode().host.removeQuestion(${index})">
                  🗑️ Usuń
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  async saveQuizSet() {
    if (!this.currentQuizSet.title || !this.currentQuizSet.description) {
      this.showStatus('Wypełnij tytuł i opis zestawu', 'error');
      return;
    }

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
        this.showStatus(`Zestaw quizów "${this.currentQuizSet.title}" został utworzony! 🎉`, 'success');
        this.resetForm();
      } else if (res.status === 403) {
        this.showStatus('Brak uprawnień do tworzenia zestawów quizów.', 'error');
      } else if (res.status === 404) {
        this.showStatus('Nie można połączyć z serwerem. Sprawdź czy backend działa.', 'error');
      } else {
        this.showStatus('Wystąpił błąd podczas tworzenia zestawu.', 'error');
      }
    } catch (err) {
      this.showStatus('Błąd połączenia z serwerem.', 'error');
    }
  }

  resetForm() {
    this.currentQuizSet = {
      title: '',
      description: '',
      questions: [],
      timeLimit: 300,
      isDaily: false
    };
    this.currentQuestion = {
      type: 'multiple-choice',
      points: 10
    };
    this.editingQuestionIndex = -1;
    this.optionsCount = 4;
    this.render();
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        .quiz-set-editor {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .editor-sections {
          display: grid;
          gap: 30px;
        }

        .editor-section {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
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

        .questions-grid {
          display: grid;
          gap: 15px;
          margin-top: 20px;
        }

        .question-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--border-color);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border-left: 4px solid #2196F3;
        }

        .question-header {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
        }

        .question-number {
          background: #2196F3;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .question-type {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .question-type.multiple-choice {
          background: var(--primary-bg);
          color: var(--primary-color);
        }

        .question-type.text-input {
          background: var(--secondary-bg);
          color: var(--secondary-color);
        }

        .question-text {
          margin: 10px 0;
          font-weight: 500;
          line-height: 1.4;
          color: var(--text-primary);
        }

        .question-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
        }

        .question-points {
          font-weight: 600;
          color: #2196F3;
        }

        .question-actions {
          display: flex;
          gap: 8px;
        }

        .btn-edit, .btn-remove {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-edit {
          background: var(--primary-color);
          color: white;
        }

        .btn-remove {
          background: var(--danger-color);
          color: white;
        }

        .btn-edit:hover, .btn-remove:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .no-questions {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .form-row-two {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .add-question-btn {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
        }

        .add-question-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
        }

        .save-set-btn {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          border: none;
          padding: 18px 40px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 30px;
        }

        .save-set-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3);
        }

        .save-set-btn:disabled {
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
          animation: slideDown 0.3s ease;
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

        .status-info {
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #bbdefb;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Global Form Styles */
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 12px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-input:focus, .form-textarea:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row-two {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        /* Button Styles */
        .add-question-btn, .save-set-btn {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2);
        }

        .add-question-btn:hover, .save-set-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
        }

        /* Small Button Styles for + and - */
        .btn-small {
          background: linear-gradient(135deg, #4CAF50 0%, #45A049 100%);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
          min-width: 40px;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
        }

        .btn-small:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
          background: linear-gradient(135deg, #45A049 0%, #388E3C 100%);
        }

        .option-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding: 10px;
          background: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .option-controls span {
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Option Input Styles */
        .option-input-group {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 12px;
          padding: 12px;
          background: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .option-input-group:hover {
          border-color: #2196F3;
          box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
        }

        .option-input {
          flex: 1;
          margin: 0 !important;
        }

        .correct-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          white-space: nowrap;
        }

        .correct-checkbox input[type="radio"] {
          margin: 0;
        }

        .checkmark {
          color: #4CAF50;
          font-weight: bold;
        }

        /* Type Selector Styles */
        .type-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 10px;
        }

        .type-option {
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .type-option:hover {
          border-color: #2196F3;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(33, 150, 243, 0.2);
        }

        .type-option.active {
          border-color: #2196F3;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          transform: scale(1.02);
          box-shadow: 0 6px 25px rgba(33, 150, 243, 0.3);
        }

        .type-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .type-title {
          font-size: 14px;
          font-weight: 600;
          color: inherit;
        }
      </style>

      <div class="quiz-set-editor">
        <div class="editor-sections">
          <!-- Ustawienia zestawu -->
          <div class="editor-section">
            <h3 class="section-title">📋 Informacje o zestawie</h3>
            <div class="form-group">
              <label class="form-label">Tytuł zestawu</label>
              <input 
                type="text" 
                name="setTitle" 
                placeholder="np. Quiz z angielskiego - Unit 1"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label class="form-label">Opis zestawu</label>
              <textarea 
                name="setDescription" 
                placeholder="Opisz czego dotyczy ten zestaw pytań..."
                class="form-input form-textarea"
                required
              ></textarea>
            </div>
            <div class="form-row-two">
              <div class="form-group">
                <label class="form-label">Limit czasu (minuty)</label>
                <input 
                  type="number" 
                  name="timeLimit" 
                  value="5" 
                  min="1" 
                  max="60"
                  class="form-input"
                >
              </div>
            </div>
            <div class="form-group">
              <label class="toggle-switch">
                <input type="checkbox" name="isDaily">
                <span class="toggle-slider"></span>
                <span>Ustaw jako dzienny challenge</span>
              </label>
            </div>
          </div>

          <!-- Dodawanie pytań -->
          <div class="editor-section">
            <h3 class="section-title">➕ Dodaj pytanie</h3>
            <form id="question-form">
              <!-- Typ pytania -->
              <div class="form-group">
                <label class="form-label">Typ pytania</label>
                <div class="type-selector">
                  <div class="type-option active" data-type="multiple-choice">
                    <div class="type-icon">☑️</div>
                    <div class="type-title">Wielokrotny wybór</div>
                  </div>
                  <div class="type-option" data-type="text-input">
                    <div class="type-icon">✏️</div>
                    <div class="type-title">Odpowiedź tekstowa</div>
                  </div>
                </div>
              </div>

              <!-- Pytanie -->
              <div class="form-group">
                <label class="form-label">Treść pytania</label>
                <textarea 
                  name="question" 
                  placeholder="Wpisz swoje pytanie..."
                  class="form-input form-textarea"
                  required
                ></textarea>
              </div>

              <!-- Odpowiedzi -->
              <div id="question-section">
                <div id="options-container"></div>
              </div>

              <!-- Ustawienia pytania -->
              <div class="form-row-two">
                <div class="form-group">
                  <label class="form-label">Punkty</label>
                  <input 
                    type="number" 
                    name="points" 
                    value="10" 
                    min="1" 
                    max="50"
                    class="form-input"
                  >
                </div>
              </div>

              <button type="button" class="add-question-btn" onclick="this.getRootNode().host.addQuestionToSet()">
                ➕ Dodaj pytanie do zestawu
              </button>
            </form>
          </div>

          <!-- Lista pytań -->
          <div class="editor-section">
            <h3 class="section-title">📝 Pytania w zestawie</h3>
            <div id="questions-list">
              <div class="no-questions">
                <p>Brak pytań w zestawie</p>
                <small>Dodaj pierwsze pytanie używając formularza powyżej</small>
              </div>
            </div>
          </div>

          <!-- Zapisz zestaw -->
          <div class="editor-section">
            <button class="save-set-btn" onclick="this.getRootNode().host.saveQuizSet()">
              🚀 Zapisz zestaw quizów
            </button>
            <div id="status"></div>
          </div>
        </div>
      </div>
    `;
    
    this.renderQuestionSection();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Type selector
    const typeOptions = this.shadow.querySelectorAll('.type-option');
    typeOptions.forEach(option => {
      option.addEventListener('click', () => {
        typeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const type = option.getAttribute('data-type') as 'multiple-choice' | 'text-input';
        this.updateQuestionData('type', type);
        this.renderQuestionSection();
      });
    });

    // Form inputs
    const setTitleInput = this.shadow.querySelector('input[name="setTitle"]') as HTMLInputElement;
    const setDescInput = this.shadow.querySelector('textarea[name="setDescription"]') as HTMLTextAreaElement;
    const timeLimitInput = this.shadow.querySelector('input[name="timeLimit"]') as HTMLInputElement;
    const dailyToggle = this.shadow.querySelector('input[name="isDaily"]') as HTMLInputElement;

    if (setTitleInput) {
      setTitleInput.addEventListener('input', (e) => {
        this.updateQuizSetData('title', (e.target as HTMLInputElement).value);
      });
    }

    if (setDescInput) {
      setDescInput.addEventListener('input', (e) => {
        this.updateQuizSetData('description', (e.target as HTMLTextAreaElement).value);
      });
    }

    if (timeLimitInput) {
      timeLimitInput.addEventListener('input', (e) => {
        this.updateQuizSetData('timeLimit', parseInt((e.target as HTMLInputElement).value) * 60 || 300);
      });
    }

    if (dailyToggle) {
      dailyToggle.addEventListener('change', (e) => {
        this.updateQuizSetData('isDaily', (e.target as HTMLInputElement).checked);
      });
    }
  }

  showStatus(message: string, type: 'success' | 'error' | 'info') {
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
