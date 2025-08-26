export interface LanguageExercise {
  id: string;
  type: 'translation' | 'vocabulary' | 'grammar' | 'listening';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  category: string;
}

class LanguageExercises extends HTMLElement {
  shadow: ShadowRoot;
  exercises: LanguageExercise[] = [];
  currentExercise: LanguageExercise | null = null;
  currentIndex: number = 0;
  score: number = 0;
  completed: string[] = [];
  selectedAnswer: string = '';
  initialExerciseCount: number = 0;
  currentModule: number = 1;
  exercisesPerModule: number = 5;
  incorrectExercises: LanguageExercise[] = []; // Zadania do powtórzenia
  exerciseStartTime: number = 0; // Czas rozpoczęcia zadania
  attemptCount: number = 1; // Liczba prób dla bieżącego zadania

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await this.loadCompletedExercises();
    this.calculateCurrentModule();
    await this.generateExercises();
    this.render();
  }

  calculateCurrentModule() {
    // Każdy moduł ma 5 zadań, oblicz aktualny moduł na podstawie ukończonych zadań
    const completedCount = this.completed.length;
    this.currentModule = Math.floor(completedCount / this.exercisesPerModule) + 1;
  }

  async loadCompletedExercises() {
    const userId = this.getCurrentUserId();
    
    // Zawsze ładuj z localStorage jako backup
    this.loadProgressFromLocalStorage(userId);
    
    // Spróbuj załadować z backend'u jeśli użytkownik jest zalogowany
    if (userId !== "anon") {
      try {
        await this.loadProgressFromBackend(userId);
      } catch (error) {
        // localStorage już załadowany wyżej
      }
    }
  }

  async loadProgressFromBackend(userId: string) {
    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) {
        return;
      }

      const response = await fetch(`http://localhost:1337/api/user-progress?filters[user][id][$eq]=${userId}&filters[type][$eq]=language_exercise`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const backendCompleted = data.data
          .map((item: any) => {
            const attrs = item.attributes || item;
            return attrs ? attrs.exerciseId : null;
          })
          .filter((id: any) => id != null) || [];
        
        // Merge z localStorage - zawsze preferuj więcej ukończonych zadań
        const localCompleted = this.completed || [];
        const mergedCompleted = [...new Set([...localCompleted, ...backendCompleted])];
        
        if (mergedCompleted.length > this.completed.length) {
          this.completed = mergedCompleted;
          // Update localStorage with merged progress
          localStorage.setItem(`language_exercises_progress_${userId}`, JSON.stringify({
            userId,
            completed: this.completed,
            lastUpdated: new Date().toISOString()
          }));
          // Backend sync successful
        } else {
          // Local progress is up to date
        }
      } else if (response.status === 403) {
        // Backend permissions not set up yet, using localStorage only
      } else {
        // Backend response not ok
      }
    } catch (error: any) {
      // Backend sync failed, continuing with localStorage
    }
  }

  loadProgressFromLocalStorage(userId: string) {
    const completed = localStorage.getItem(`completed_exercises_${userId}`);
    this.completed = completed ? JSON.parse(completed) : [];
  }

  async saveCompletedExercise(exerciseId: string) {
    const userId = this.getCurrentUserId();
    if (!this.completed.includes(exerciseId)) {
      this.completed.push(exerciseId);
      
      // Zapisz w localStorage jako backup
      localStorage.setItem(`completed_exercises_${userId}`, JSON.stringify(this.completed));
      
      // Zapisz w backend jeśli użytkownik jest zalogowany
      if (userId !== "anon") {
        try {
          await this.saveProgressToBackend(userId, exerciseId);
        } catch (error) {
          // Error saving to backend, saved locally only
        }
      }
    }
  }

  async saveExerciseStatistic(isCorrect: boolean) {
    const userId = this.getCurrentUserId();
    if (!this.currentExercise || userId === "anon") return;

    const statisticData = {
      user: parseInt(userId), // Konwertuj na integer dla relacji Strapi
      exerciseId: this.currentExercise.id,
      exerciseType: this.currentExercise.type,
      module: this.currentModule,
      category: this.currentExercise.category,
      question: this.currentExercise.question,
      userAnswer: this.selectedAnswer,
      correctAnswer: this.currentExercise.correctAnswer,
      isCorrect: isCorrect,
      attempts: this.attemptCount,
      timeSpent: this.getTimeSpent(),
      difficulty: this.currentExercise.difficulty,
      completedAt: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) {
        this.saveStatisticLocally(statisticData);
        return;
      }

      const response = await fetch('http://localhost:1337/api/exercise-statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: statisticData })
      });

      
      if (response.ok) {
        await response.json();
      } else if (response.status === 403) {
        this.saveStatisticLocally(statisticData);
      } else {
        await response.text();
        this.saveStatisticLocally(statisticData);
      }
    } catch (error: any) {
      this.saveStatisticLocally(statisticData);
    }
  }

  saveStatisticLocally(statisticData: any) {
    const storageKey = `exercise_statistics_${statisticData.user}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.push(statisticData);
    
    // Keep only last 100 statistics to avoid storage bloat
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existing));
  }

  async saveProgressToBackend(userId: string, exerciseId: string) {
    try {
      const token = localStorage.getItem("strapi_jwt");
      if (!token) {
        return;
      }

      const response = await fetch('http://localhost:1337/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: {
            user: userId,
            type: 'language_exercise',
            exerciseId: exerciseId,
            completedAt: new Date().toISOString(),
            score: 1 // 1 za poprawne rozwiązanie
          }
        })
      });

      if (response.ok) {
        // Progress saved to backend successfully
      } else if (response.status === 403) {
        // Backend permissions not ready for progress sync
      } else {
        // Error saving progress to backend
      }
    } catch (error: any) {
      // Network error saving progress
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

  // Generuje zadania z darmowego API i lokalnych danych
  async generateExercises() {
    try {
      // Pobierz wszystkie lokalne zadania
      const allLocalExercises = this.getLocalExercises();
      
      // Pobierz zadania z API tylko dla bieżącego modułu
      const apiExercises = await this.fetchExercisesFromAPI();
      
      // Filtruj zadania dla aktualnego modułu
      const moduleStart = (this.currentModule - 1) * this.exercisesPerModule;
      const moduleEnd = moduleStart + this.exercisesPerModule;
      
      // Weź zadania lokalne dla aktualnego modułu
      const moduleExercises = allLocalExercises.slice(moduleStart, moduleEnd);
      
      // Jeśli nie ma wystarczająco zadań lokalnych, dodaj z API
      const remainingSlots = this.exercisesPerModule - moduleExercises.length;
      if (remainingSlots > 0) {
        moduleExercises.push(...apiExercises.slice(0, remainingSlots));
      }
      
      this.initialExerciseCount = moduleExercises.length;
      
      // Filtruj już ukończone zadania z tego modułu
      this.exercises = moduleExercises.filter(ex => !this.completed.includes(ex.id));
      
      if (this.exercises.length > 0) {
        this.currentExercise = this.exercises[0];
        this.startExerciseTimer();
      }
      
      this.render();
    } catch (error) {
      this.generateLocalExercises();
    }
  }

  async fetchExercisesFromAPI() {
    const exercises: LanguageExercise[] = [];
    
    try {
      // Lista słów do sprawdzenia
      const words = ['learn', 'study', 'language', 'speak', 'write'];
      
      // Pobierz definicje dla każdego słowa osobno
      for (let i = 0; i < Math.min(words.length, 3); i++) {
        const word = words[i];
        try {
          const wordsResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
          if (wordsResponse.ok) {
            const wordsData = await wordsResponse.json();
            
            if (wordsData && wordsData[0] && wordsData[0].meanings && wordsData[0].meanings[0] && wordsData[0].meanings[0].definitions) {
              const definition = wordsData[0].meanings[0].definitions[0].definition;
              exercises.push({
                id: `api_vocab_${i}`,
                type: 'vocabulary',
                question: `Co oznacza słowo "${word}"?`,
                options: [
                  definition,
                  'szybki ruch',
                  'duży przedmiot',
                  'stary budynek'
                ].sort(() => Math.random() - 0.5),
                correctAnswer: definition,
                explanation: `"${word}" oznacza: ${definition}`,
                difficulty: 'beginner',
                language: 'en',
                category: 'słownictwo'
              });
            }
          }
        } catch (wordError) {
          // Error fetching word, skip it
        }
      }
    } catch (error) {
      // Dictionary API error
    }

    // Dodaj zadania z lokalnego źródła jeśli API nie działa
    if (exercises.length === 0) {
      return this.getAPIFallbackExercises();
    }

    return exercises;
  }

  getAPIFallbackExercises(): LanguageExercise[] {
    return [
      {
        id: 'api_fallback_1',
        type: 'vocabulary',
        question: 'Co oznacza słowo "knowledge"?',
        options: ['wiedza', 'szybkość', 'wysokość', 'szerokość'],
        correctAnswer: 'wiedza',
        explanation: '"Knowledge" oznacza wiedzę, informacje które posiadamy',
        difficulty: 'intermediate',
        language: 'en',
        category: 'słownictwo'
      },
      {
        id: 'api_fallback_2',
        type: 'grammar',
        question: 'Wybierz poprawną formę: I ___ English every day.',
        options: ['study', 'studies', 'studying', 'studied'],
        correctAnswer: 'study',
        explanation: 'Pierwsza osoba liczby pojedynczej w czasie teraźniejszym nie ma końcówki -s',
        difficulty: 'beginner',
        language: 'en',
        category: 'gramatyka'
      }
    ];
  }

  getLocalExercises(): LanguageExercise[] {
    // Moduł 1: Podstawy - Przedstawienie się
    const module1 = [
      {
        id: 'mod1_1',
        type: 'translation' as const,
        question: 'Przetłumacz: "Jak masz na imię?"',
        correctAnswer: 'What is your name?',
        explanation: 'Podstawowe pytanie o imię w języku angielskim',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 1: Podstawy'
      },
      {
        id: 'mod1_2',
        type: 'vocabulary' as const,
        question: 'Co oznacza "Hello"?',
        options: ['Cześć', 'Do widzenia', 'Dziękuję', 'Przepraszam'],
        correctAnswer: 'Cześć',
        explanation: '"Hello" to podstawowe powitanie w języku angielskim',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 1: Podstawy'
      },
      {
        id: 'mod1_3',
        type: 'grammar' as const,
        question: 'Uzupełnij: "I ___ a student"',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'am',
        explanation: 'Z pierwszą osobą liczby pojedynczej używamy "am"',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 1: Podstawy'
      },
      {
        id: 'mod1_4',
        type: 'translation' as const,
        question: 'Przetłumacz: "Miło Cię poznać"',
        correctAnswer: 'Nice to meet you',
        explanation: 'Standardowe wyrażenie przy pierwszym spotkaniu',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 1: Podstawy'
      },
      {
        id: 'mod1_5',
        type: 'vocabulary' as const,
        question: 'Wybierz poprawną odpowiedź na "How are you?"',
        options: ['I am fine', 'I am student', 'I am work', 'I am house'],
        correctAnswer: 'I am fine',
        explanation: '"I am fine" to standardowa odpowiedź na pytanie o samopoczucie',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 1: Podstawy'
      }
    ];

    // Moduł 2: Rodzina i dom
    const module2 = [
      {
        id: 'mod2_1',
        type: 'vocabulary' as const,
        question: 'Co oznacza "family"?',
        options: ['rodzina', 'przyjaciele', 'sąsiedzi', 'koledzy'],
        correctAnswer: 'rodzina',
        explanation: '"Family" oznacza rodzinę',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 2: Rodzina'
      },
      {
        id: 'mod2_2',
        type: 'translation' as const,
        question: 'Przetłumacz: "To jest mój brat"',
        correctAnswer: 'This is my brother',
        explanation: 'Przedstawianie członków rodziny',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 2: Rodzina'
      },
      {
        id: 'mod2_3',
        type: 'vocabulary' as const,
        question: 'Jak po angielsku "matka"?',
        options: ['mother', 'father', 'sister', 'brother'],
        correctAnswer: 'mother',
        explanation: '"Mother" oznacza matkę',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 2: Rodzina'
      },
      {
        id: 'mod2_4',
        type: 'grammar' as const,
        question: 'Uzupełnij: "She ___ my sister"',
        options: ['is', 'am', 'are', 'be'],
        correctAnswer: 'is',
        explanation: 'Z trzecią osobą liczby pojedynczej używamy "is"',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 2: Rodzina'
      },
      {
        id: 'mod2_5',
        type: 'translation' as const,
        question: 'Przetłumacz: "Mieszkam z rodziną"',
        correctAnswer: 'I live with my family',
        explanation: 'Opisywanie sytuacji mieszkaniowej',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 2: Rodzina'
      }
    ];

    // Moduł 3: Szkoła i nauka
    const module3 = [
      {
        id: 'mod3_1',
        type: 'vocabulary' as const,
        question: 'Co oznacza "teacher"?',
        options: ['nauczyciel', 'uczeń', 'dyrektor', 'sprzątacz'],
        correctAnswer: 'nauczyciel',
        explanation: '"Teacher" oznacza nauczyciela',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 3: Szkoła'
      },
      {
        id: 'mod3_2',
        type: 'translation' as const,
        question: 'Przetłumacz: "Idę do szkoły"',
        correctAnswer: 'I go to school',
        explanation: 'Opisywanie codziennych aktywności',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 3: Szkoła'
      },
      {
        id: 'mod3_3',
        type: 'vocabulary' as const,
        question: 'Jak po angielsku "książka"?',
        options: ['book', 'pen', 'desk', 'chair'],
        correctAnswer: 'book',
        explanation: '"Book" oznacza książkę',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 3: Szkoła'
      },
      {
        id: 'mod3_4',
        type: 'grammar' as const,
        question: 'Uzupełnij: "Students ___ in the classroom"',
        options: ['are', 'is', 'am', 'be'],
        correctAnswer: 'are',
        explanation: 'Z liczbą mnogą używamy "are"',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 3: Szkoła'
      },
      {
        id: 'mod3_5',
        type: 'translation' as const,
        question: 'Przetłumacz: "Lubię się uczyć"',
        correctAnswer: 'I like to learn',
        explanation: 'Wyrażanie preferencji dotyczących nauki',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 3: Szkoła'
      }
    ];

    // Moduł 4: Kolory i liczby
    const module4 = [
      {
        id: 'mod4_1',
        type: 'vocabulary' as const,
        question: 'Jak po angielsku "czerwony"?',
        options: ['red', 'blue', 'green', 'yellow'],
        correctAnswer: 'red',
        explanation: '"Red" oznacza czerwony',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 4: Kolory i liczby'
      },
      {
        id: 'mod4_2',
        type: 'vocabulary' as const,
        question: 'Co oznacza "ten"?',
        options: ['dziesięć', 'jeden', 'dwa', 'pięć'],
        correctAnswer: 'dziesięć',
        explanation: '"Ten" oznacza liczbę dziesięć',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 4: Kolory i liczby'
      },
      {
        id: 'mod4_3',
        type: 'translation' as const,
        question: 'Przetłumacz: "Mam pięć książek"',
        correctAnswer: 'I have five books',
        explanation: 'Opisywanie ilości rzeczy',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 4: Kolory i liczby'
      },
      {
        id: 'mod4_4',
        type: 'vocabulary' as const,
        question: 'Jak po angielsku "zielony"?',
        options: ['green', 'blue', 'red', 'black'],
        correctAnswer: 'green',
        explanation: '"Green" oznacza zielony',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 4: Kolory i liczby'
      },
      {
        id: 'mod4_5',
        type: 'grammar' as const,
        question: 'Uzupełnij: "There ___ three cats"',
        options: ['are', 'is', 'am', 'be'],
        correctAnswer: 'are',
        explanation: 'Z liczbą większą niż jeden używamy "are"',
        difficulty: 'beginner' as const,
        language: 'en',
        category: 'Moduł 4: Kolory i liczby'
      }
    ];

    return [...module1, ...module2, ...module3, ...module4];
  }

  generateLocalExercises() {
    const allExercises = this.getLocalExercises();
    
    // Weź zadania tylko dla aktualnego modułu
    const moduleStart = (this.currentModule - 1) * this.exercisesPerModule;
    const moduleEnd = moduleStart + this.exercisesPerModule;
    const moduleExercises = allExercises.slice(moduleStart, moduleEnd);
    
    this.initialExerciseCount = moduleExercises.length;
    
    // Filtruj ukończone zadania
    this.exercises = moduleExercises.filter(ex => !this.completed.includes(ex.id));
    
    if (this.exercises.length > 0) {
      this.currentExercise = this.exercises[0];
    }
    
    this.render();
  }

  selectAnswer(answer: string) {
    this.selectedAnswer = answer;
    this.renderCurrentExercise();
  }

  startExerciseTimer() {
    this.exerciseStartTime = Date.now();
    this.attemptCount = 1;
  }

  getTimeSpent(): number {
    return Math.floor((Date.now() - this.exerciseStartTime) / 1000);
  }

  updateCheckButton() {
    // Usunięto logikę disabled - przycisk zawsze jest aktywny
  }

  checkAnswer() {
    if (!this.currentExercise) return;
    
    // Pobierz aktualną wartość z inputa jeśli to pytanie otwarte
    if (!this.currentExercise.options) {
      const input = this.shadow.querySelector('#answer-input') as HTMLInputElement;
      if (input) {
        this.selectedAnswer = input.value;
      }
    }
    
    if (!this.selectedAnswer.trim()) {
      alert('Proszę wpisać odpowiedź!');
      return;
    }

    const isCorrect = this.selectedAnswer.toLowerCase().trim() === 
                     this.currentExercise.correctAnswer.toLowerCase().trim();
    
    // Zapisz statystyki
    this.saveExerciseStatistic(isCorrect);
    
    if (isCorrect) {
      this.score++;
      this.saveCompletedExercise(this.currentExercise.id);
    } else {
      // Jeśli źle odpowiedziano, dodaj zadanie na koniec kolejki
      this.incorrectExercises.push({...this.currentExercise});
      this.attemptCount++;
    }

    this.showResult(isCorrect);
  }

  showResult(isCorrect: boolean) {
    if (!this.currentExercise) return;

    // Aktualizuj pasek postępu jeśli odpowiedź była poprawna
    if (isCorrect) {
      this.updateProgressBar();
    }

    const resultDiv = this.shadow.querySelector('.result') as HTMLElement;
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-content ${isCorrect ? 'correct' : 'incorrect'}">
          <h3>${isCorrect ? '✅ Poprawnie!' : '❌ Niepoprawnie'}</h3>
          <p><strong>Poprawna odpowiedź:</strong> ${this.currentExercise.correctAnswer}</p>
          ${this.currentExercise.explanation ? `<p><strong>Wyjaśnienie:</strong> ${this.currentExercise.explanation}</p>` : ''}
          <button onclick="this.getRootNode().host.nextExercise()">
            ${this.currentIndex < this.exercises.length - 1 || this.incorrectExercises.length > 0 ? 'Następne zadanie' : 'Ukończ moduł'}
          </button>
        </div>
      `;
      resultDiv.style.display = 'block';
    }
  }

  updateProgressBar() {
    const completedInModule = this.completed.filter(id => {
      const moduleStart = (this.currentModule - 1) * this.exercisesPerModule;
      const moduleEnd = moduleStart + this.exercisesPerModule;
      const allExercises = this.getLocalExercises();
      const moduleExercises = allExercises.slice(moduleStart, moduleEnd);
      return moduleExercises.some(ex => ex.id === id);
    }).length;
    
    const progressPercentage = this.exercisesPerModule > 0 ? (completedInModule / this.exercisesPerModule) * 100 : 0;
    
    const progressBar = this.shadow.querySelector('.progress') as HTMLElement;
    const exerciseScore = this.shadow.querySelector('.exercise-score') as HTMLElement;
    
    if (progressBar) {
      progressBar.style.width = `${progressPercentage}%`;
    }
    
    if (exerciseScore) {
      exerciseScore.textContent = `Ukończone: ${completedInModule}/${this.exercisesPerModule}`;
    }
  }

  nextExercise() {
    this.currentIndex++;
    this.selectedAnswer = '';
    
    // Sprawdź czy są jeszcze zadania w głównej kolejce
    if (this.currentIndex < this.exercises.length) {
      this.currentExercise = this.exercises[this.currentIndex];
      this.startExerciseTimer();
      this.renderCurrentExercise();
    } else if (this.incorrectExercises.length > 0) {
      // Jeśli skończyły się zadania z głównej kolejki, ale są niepoprawne do powtórzenia
      this.exercises = [...this.incorrectExercises];
      this.incorrectExercises = [];
      this.currentIndex = 0;
      this.currentExercise = this.exercises[0];
      this.startExerciseTimer();
      this.renderCurrentExercise();
      
      // Pokaż komunikat o powtarzaniu
      const resultDiv = this.shadow.querySelector('.result') as HTMLElement;
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="result-content" style="background: #fff3cd; border: 2px solid #ffeaa7;">
            <h3>🔄 Powtarzamy zadania</h3>
            <p>Teraz powtórzysz zadania, na które odpowiedziałeś niepoprawnie.</p>
            <p>Musisz odpowiedzieć poprawnie na wszystkie zadania, żeby ukończyć moduł!</p>
            <button onclick="this.getRootNode().host.hideResult()">Kontynuuj</button>
          </div>
        `;
        resultDiv.style.display = 'block';
      }
    } else {
      // Wszystkie zadania ukończone poprawnie
      this.showFinalScore();
    }
  }

  hideResult() {
    const resultDiv = this.shadow.querySelector('.result') as HTMLElement;
    if (resultDiv) {
      resultDiv.style.display = 'none';
    }
  }

  showFinalScore() {
    const totalCompleted = this.completed.length;
    
    this.shadow.innerHTML = `
      ${this.getStyles()}
      <div class="exercise-container">
        <div class="final-score">
          <h2>🎉 Ukończyłeś Moduł ${this.currentModule}!</h2>
          <p>Świetna robota! Odpowiedziałeś poprawnie na wszystkie zadania w tym module.</p>
          <div class="score-summary">
            <p><strong>Łącznie ukończone zadania: ${totalCompleted}</strong></p>
            <div class="module-complete">
              <div class="checkmark">✅</div>
              <p>Moduł ${this.currentModule} ukończony!</p>
            </div>
          </div>
          <button onclick="this.getRootNode().host.nextModule()">Przejdź do Modułu ${this.currentModule + 1}</button>
        </div>
      </div>
    `;
  }

  restart() {
    this.currentIndex = 0;
    this.score = 0;
    this.selectedAnswer = '';
    this.incorrectExercises = [];
    this.calculateCurrentModule();
    this.generateExercises();
  }

  nextModule() {
    this.currentModule++;
    this.currentIndex = 0;
    this.score = 0;
    this.selectedAnswer = '';
    this.incorrectExercises = [];
    this.generateExercises();
  }

  render() {
    if (this.exercises.length === 0) {
      // Sprawdź czy są więcej modułów
      const totalModules = Math.ceil(this.getLocalExercises().length / this.exercisesPerModule);
      const canProgress = this.currentModule < totalModules;
      
      this.shadow.innerHTML = `
        ${this.getStyles()}
        <div class="exercise-container">
          <div class="no-exercises">
            <h3>� Ukończyłeś Moduł ${this.currentModule}!</h3>
            <p><strong>Łącznie ukończone: ${this.completed.length} zadań</strong></p>
            ${canProgress ? 
              `<p>Przejdź do następnego modułu, aby kontynuować naukę!</p>
               <button onclick="this.getRootNode().host.nextModule()">Moduł ${this.currentModule + 1}</button>` :
              `<p>Gratulacje! Ukończyłeś wszystkie dostępne moduły!</p>
               <p>Wróć jutro po nowe wyzwania lub sprawdź quizy od nauczyciela.</p>`
            }
          </div>
        </div>
      `;
      return;
    }

    const completedInModule = this.completed.filter(id => {
      const moduleStart = (this.currentModule - 1) * this.exercisesPerModule;
      const moduleEnd = moduleStart + this.exercisesPerModule;
      const allExercises = this.getLocalExercises();
      const moduleExercises = allExercises.slice(moduleStart, moduleEnd);
      return moduleExercises.some(ex => ex.id === id);
    }).length;
    
    const progressPercentage = this.exercisesPerModule > 0 ? (completedInModule / this.exercisesPerModule) * 100 : 0;

    this.shadow.innerHTML = `
      ${this.getStyles()}
      <div class="exercise-container">
        <div class="module-header">
          <h3>📚 Moduł ${this.currentModule}</h3>
          <p>${this.currentExercise?.category || 'Ćwiczenia językowe'}</p>
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="exercise-header">
          <span class="exercise-counter">Zadanie ${this.currentIndex + 1}/${this.exercises.length + this.incorrectExercises.length}</span>
          <span class="exercise-score">Ukończone: ${completedInModule}/${this.exercisesPerModule}</span>
        </div>
        <div class="exercise-content">
          ${this.renderCurrentExercise()}
        </div>
        <div class="result" style="display: none;"></div>
      </div>
    `;
  }

  renderCurrentExercise() {
    if (!this.currentExercise) return '';

    const exercise = this.currentExercise;
    let content = `
      <div class="exercise-question">
        <div class="exercise-type">${this.getTypeLabel(exercise.type)}</div>
        <div class="exercise-category">${exercise.category} • ${exercise.difficulty}</div>
        <h3>${exercise.question}</h3>
      </div>
    `;

    if (exercise.options) {
      // Pytanie wielokrotnego wyboru
      content += `
        <div class="exercise-options">
          ${exercise.options.map(option => `
            <button class="option-btn ${this.selectedAnswer === option ? 'selected' : ''}" 
                    onclick="this.getRootNode().host.selectAnswer('${option}')">
              ${option}
            </button>
          `).join('')}
        </div>
      `;
    } else {
      // Pytanie otwarte - dodaj event listener po renderowaniu
      content += `
        <div class="exercise-input">
          <input type="text" 
                 id="answer-input"
                 placeholder="Wpisz swoją odpowiedź..." 
                 value="${this.selectedAnswer}">
        </div>
      `;
    }

    content += `
      <div class="exercise-actions">
        <button class="check-btn" 
                onclick="this.getRootNode().host.checkAnswer()">
          Sprawdź odpowiedź
        </button>
      </div>
    `;

    const exerciseContent = this.shadow.querySelector('.exercise-content');
    if (exerciseContent) {
      exerciseContent.innerHTML = content;
      
      // Dodaj event listener dla input po renderowaniu
      if (!exercise.options) {
        const input = exerciseContent.querySelector('#answer-input') as HTMLInputElement;
        if (input) {
          input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            this.selectedAnswer = target.value;
            this.updateCheckButton();
          });
          
          // Dodaj obsługę klawisza Enter
          input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.selectedAnswer.trim()) {
              this.checkAnswer();
            }
          });
          
          input.focus();
        }
      }
    }

    // Ukryj rezultat poprzedniego zadania
    const resultDiv = this.shadow.querySelector('.result') as HTMLElement;
    if (resultDiv) {
      resultDiv.style.display = 'none';
    }

    return content;
  }

  getTypeLabel(type: string): string {
    const labels = {
      'translation': '🔄 Tłumaczenie',
      'vocabulary': '📚 Słownictwo',
      'grammar': '📝 Gramatyka',
      'listening': '🎧 Słuchanie'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getStyles() {
    return `
      <style>
        .exercise-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .module-header {
          text-align: center;
          margin-bottom: 20px;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .module-header h3 {
          margin: 0 0 5px 0;
          font-size: 20px;
        }

        .module-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .progress {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #45a049);
          transition: width 0.6s ease-in-out;
          border-radius: 4px;
        }

        .exercise-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 10px 0;
          border-bottom: 2px solid #f0f0f0;
        }

        .exercise-counter {
          font-weight: bold;
          color: #666;
        }

        .exercise-score {
          background: #4CAF50;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
        }

        .exercise-question {
          margin-bottom: 20px;
        }

        .exercise-type {
          display: inline-block;
          background: #2196F3;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .exercise-category {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .exercise-question h3 {
          margin: 0;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .exercise-options {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
        }

        .option-btn {
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--card-bg);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .option-btn:hover {
          border-color: var(--primary);
          background: var(--bg-tertiary);
        }

        .option-btn.selected {
          border-color: var(--primary);
          background: var(--bg-tertiary);
          color: var(--primary);
        }

        .exercise-input {
          margin-bottom: 20px;
        }

        .exercise-input input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          box-sizing: border-box;
        }

        .exercise-input input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .exercise-actions {
          text-align: center;
        }

        .check-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .check-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .check-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .result {
          margin-top: 20px;
        }

        .result-content {
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          color: var(--text-primary);
        }

        .result-content.correct {
          background: var(--success-bg, #e8f5e8);
          border: 2px solid var(--success, #4CAF50);
        }

        .result-content.incorrect {
          background: var(--error-bg, #ffeaea);
          border: 2px solid var(--error, #f44336);
        }

        .result-content h3 {
          margin: 0 0 10px 0;
          color: var(--text-primary);
        }

        .result-content p {
          color: var(--text-primary);
          margin: 8px 0;
        }

        .result-content button {
          background: var(--primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 15px;
        }

        .result-content button:hover {
          background: var(--primary-dark);
        }

        .final-score, .no-exercises {
          text-align: center;
          padding: 40px 20px;
        }

        .final-score h2, .no-exercises h3 {
          color: #4CAF50;
          margin-bottom: 20px;
        }

        .score-summary {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #4CAF50;
        }

        .score-summary p {
          margin: 8px 0;
          font-size: 16px;
        }

        .module-complete {
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background: #e8f5e8;
          border-radius: 12px;
          border: 2px solid #4CAF50;
        }

        .checkmark {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .module-complete p {
          margin: 0;
          font-weight: bold;
          color: #2e7d32;
          font-size: 18px;
        }

        .final-progress {
          max-width: 300px;
          margin: 20px auto;
        }

        .final-score button, .no-exercises button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 20px;
          font-size: 16px;
        }

        .final-score button:hover, .no-exercises button:hover {
          background: #45a049;
        }
      </style>
    `;
  }
}

customElements.define('language-exercises', LanguageExercises);
