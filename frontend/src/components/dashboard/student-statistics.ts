interface StatisticData {
  totalExercises: number;
  correctAnswers: number;
  averageTime: number;
  moduleStats: ModuleStats[];
  recentActivity: ExerciseStatistic[];
  recentQuizzes: QuizStatistic[];
}

interface ModuleStats {
  module: number;
  category: string;
  completed: number;
  total: number;
  accuracy: number;
  averageTime: number;
}

interface ExerciseStatistic {
  id: string;
  exerciseType: string;
  question: string;
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
  completedAt: string;
}

interface QuizStatistic {
  id: string;
  quizId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  attempts: number;
  timeSpent: number;
  completedAt: string;
  category?: string;
}

class StudentStatistics extends HTMLElement {
  shadow: ShadowRoot;
  statistics: StatisticData | null = null;
  loading: boolean = true;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.loadStatistics();
    this.render();
  }

  async loadStatistics() {
    try {
      const userId = this.getCurrentUserId();
      console.log('Student statistics - current user ID:', userId);
      
      if (userId === "anon") {
        console.log('User not logged in, showing login required');
        this.showLoginRequired();
        return;
      }

      const token = localStorage.getItem("strapi_jwt");
      console.log('JWT token exists:', !!token);
      let statisticsData: any[] = [];

      // Spróbuj pobrać z backend'u
      if (token) {
        try {
          // Pobierz exercise statistics
          const exerciseResponse = await fetch(`http://localhost:1337/api/exercise-statistics?filters[user][id][$eq]=${userId}&sort=completedAt:desc`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          // Pobierz quiz statistics
          const quizResponse = await fetch(`http://localhost:1337/api/quiz-statistics?filters[user][id][$eq]=${userId}&sort=completedAt:desc`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          let exerciseData: any[] = [];
          let quizData: any[] = [];

          if (exerciseResponse.ok) {
            const data = await exerciseResponse.json();
            exerciseData = data.data || [];
            console.log('✅ Exercise statistics loaded from backend:', exerciseData.length);
          } else if (exerciseResponse.status === 403) {
            console.log('⚠️ Exercise stats permissions not ready, using localStorage');
            exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
          } else {
            console.log('⚠️ Exercise stats backend error, using localStorage');
            exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
          }

          if (quizResponse.ok) {
            const data = await quizResponse.json();
            quizData = data.data || [];
            console.log('✅ Quiz statistics loaded from backend:', quizData.length);
          } else if (quizResponse.status === 403) {
            console.log('⚠️ Quiz stats permissions not ready, using localStorage');
            quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
          } else {
            console.log('⚠️ Quiz stats backend error, using localStorage');
            quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
          }

          // Combine both types of statistics
          statisticsData = [...exerciseData, ...quizData];
          console.log('✅ Combined statistics loaded:', {
            exercises: exerciseData.length,
            quizzes: quizData.length,
            total: statisticsData.length
          });

        } catch (error) {
          console.log('⚠️ Network error, using localStorage');
          const exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
          const quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
          statisticsData = [...exerciseData, ...quizData];
        }
      } else {
        console.log('ℹ️ No token, using localStorage only');
        const exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
        const quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
        statisticsData = [...exerciseData, ...quizData];
      }

      this.processStatistics(statisticsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.showError("Błąd połączenia");
    } finally {
      this.loading = false;
      this.render();
    }
  }

  loadStatisticsFromLocalStorage(userId: string, type: string) {
    const storageKey = `${type}_${userId}`;
    const localStats = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Convert local format to backend format
    return localStats.map((stat: any) => ({
      attributes: stat
    }));
  }

  processStatistics(rawData: any[]) {
    console.log('Processing statistics, raw data:', rawData);
    
    if (!rawData || rawData.length === 0) {
      this.statistics = {
        totalExercises: 0,
        correctAnswers: 0,
        averageTime: 0,
        moduleStats: [],
        recentActivity: [],
        recentQuizzes: []
      };
      return;
    }

    // Konwertuj dane do jednolitego formatu
    const allStats = rawData.map(item => {
      // Obsługuj zarówno format backend (item.attributes) jak i localStorage (bezpośrednio)
      const data = item.attributes || item;
      console.log('Statistic data:', data);
      return data;
    }).filter(stat => stat && typeof stat === 'object'); // Odfiltruj nieprawidłowe dane

    console.log('Processed statistics:', allStats);
    
    // Rozdziel na ćwiczenia językowe i quizy nauczyciela
    const exercises = allStats.filter(stat => stat.exerciseType && !stat.quizId);
    const quizzes = allStats.filter(stat => stat.quizId);
    
    console.log('Separated data:', { exercises: exercises.length, quizzes: quizzes.length });
    
    if (allStats.length === 0) {
      this.statistics = {
        totalExercises: 0,
        correctAnswers: 0,
        averageTime: 0,
        moduleStats: [],
        recentActivity: [],
        recentQuizzes: []
      };
      return;
    }
    
    // Podstawowe statystyki (łącznie ćwiczenia + quizy)
    const totalExercises = allStats.length;
    const correctAnswers = allStats.filter(stat => stat && stat.isCorrect === true).length;
    const timeValues = allStats.filter(stat => stat && typeof stat.timeSpent === 'number').map(stat => stat.timeSpent);
    const averageTime = timeValues.length > 0 ? Math.round(timeValues.reduce((sum, time) => sum + time, 0) / timeValues.length) : 0;

    // Statystyki modułów
    const moduleGroups = this.groupBy(exercises.filter(ex => ex && ex.module), 'module');
    const moduleStats: ModuleStats[] = Object.entries(moduleGroups).map(([module, exs]) => {
      const exerciseList = (exs as any[]).filter(ex => ex && typeof ex === 'object');
      const completed = exerciseList.filter(ex => ex.isCorrect === true).length;
      const accuracy = exerciseList.length > 0 ? Math.round((completed / exerciseList.length) * 100) : 0;
      const validTimes = exerciseList.filter(ex => typeof ex.timeSpent === 'number').map(ex => ex.timeSpent);
      const avgTime = validTimes.length > 0 ? Math.round(validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length) : 0;
      
      return {
        module: parseInt(module) || 0,
        category: (exerciseList[0] && exerciseList[0].category) || 'Różne',
        completed,
        total: exerciseList.length,
        accuracy,
        averageTime: avgTime
      };
    }).filter(stat => stat.total > 0).sort((a, b) => a.module - b.module);

    // Ostatnia aktywność (10 najnowszych ćwiczeń językowych)
    const recentActivity = exercises
      .filter(ex => ex && ex.exerciseId && ex.question)
      .slice(0, 10)
      .map(ex => ({
        id: ex.exerciseId || 'unknown',
        exerciseType: ex.exerciseType || 'unknown',
        question: (ex.question || '').substring(0, 50) + '...',
        isCorrect: ex.isCorrect === true,
        attempts: ex.attempts || 1,
        timeSpent: ex.timeSpent || 0,
        completedAt: ex.completedAt || new Date().toISOString()
      }));

    // Ostatnie quizy od nauczyciela (10 najnowszych)
    const recentQuizzes = quizzes
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
      .slice(0, 10)
      .map(quiz => ({
        id: quiz.id || 'unknown',
        quizId: quiz.quizId || 'unknown',
        question: (quiz.question || '').substring(0, 50) + '...',
        userAnswer: quiz.userAnswer || '',
        correctAnswer: quiz.correctAnswer || '',
        isCorrect: quiz.isCorrect === true,
        attempts: quiz.attempts || 1,
        timeSpent: quiz.timeSpent || 0,
        completedAt: quiz.completedAt || new Date().toISOString(),
        category: quiz.category || 'Quiz'
      }));

    this.statistics = {
      totalExercises,
      correctAnswers,
      averageTime,
      moduleStats,
      recentActivity,
      recentQuizzes
    };
  }

  groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  getTypeLabel(type: string): string {
    const labels = {
      'translation': 'Tłumaczenia',
      'vocabulary': 'Słownictwo',
      'grammar': 'Gramatyka',
      'listening': 'Słuchanie'
    };
    return labels[type as keyof typeof labels] || type;
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

  showLoginRequired() {
    this.statistics = null;
    this.loading = false;
  }

  showError(_message: string) {
    this.statistics = null;
    this.loading = false;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  render() {
    if (this.loading) {
      this.shadow.innerHTML = `
        ${this.getStyles()}
        <div class="stats-container">
          <div class="loading">⏳ Ładowanie statystyk...</div>
        </div>
      `;
      return;
    }

    if (!this.statistics) {
      this.shadow.innerHTML = `
        ${this.getStyles()}
        <div class="stats-container">
          <div class="no-data">
            <h3>📊 Brak danych</h3>
            <p>Musisz być zalogowany i rozwiązać kilka zadań, żeby zobaczyć statystyki.</p>
          </div>
        </div>
      `;
      return;
    }

    const stats = this.statistics;
    const accuracy = stats.totalExercises > 0 ? Math.round((stats.correctAnswers / stats.totalExercises) * 100) : 0;

    this.shadow.innerHTML = `
      ${this.getStyles()}
      <div class="stats-container">
        <div class="section-header">
          <h2>📊 Statystyki Studenta</h2>
          <p>Przegląd Twojego postępu w nauce języka angielskiego</p>
        </div>

        <!-- Podstawowe statystyki -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <h3>${stats.totalExercises}</h3>
              <p>Zadań ukończonych</p>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>${accuracy}%</h3>
              <p>Skuteczność</p>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <h3>${this.formatTime(stats.averageTime)}</h3>
              <p>Średni czas</p>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <h3>${stats.correctAnswers}</h3>
              <p>Poprawnych odpowiedzi</p>
            </div>
          </div>
        </div>

        <!-- Statystyki modułów -->
        <div class="section">
          <h3>📚 Postęp w modułach</h3>
          <div class="modules-grid">
            ${stats.moduleStats.map(module => `
              <div class="module-card">
                <div class="module-header">
                  <h4>Moduł ${module.module}</h4>
                  <span class="accuracy ${module.accuracy >= 80 ? 'high' : module.accuracy >= 60 ? 'medium' : 'low'}">
                    ${module.accuracy}%
                  </span>
                </div>
                <p class="module-category">${module.category}</p>
                <div class="module-progress">
                  <div class="progress-bar">
                    <div class="progress" style="width: ${(module.completed / module.total) * 100}%"></div>
                  </div>
                  <span>${module.completed}/${module.total}</span>
                </div>
                <div class="module-stats">
                  <span>⏱️ ${this.formatTime(module.averageTime)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Ostatnia aktywność -->
        <div class="section">
          <h3>📝 Ostatnia aktywność - Ćwiczenia językowe</h3>
          <div class="activity-list">
            ${stats.recentActivity.length > 0 ? stats.recentActivity.map(activity => `
              <div class="activity-item">
                <div class="activity-icon ${activity.isCorrect ? 'correct' : 'incorrect'}">
                  ${activity.isCorrect ? '✅' : '❌'}
                </div>
                <div class="activity-content">
                  <div class="activity-question">${activity.question}</div>
                  <div class="activity-meta">
                    <span class="activity-type">${this.getTypeLabel(activity.exerciseType)}</span>
                    <span class="activity-time">${this.formatTime(activity.timeSpent)}</span>
                    ${activity.attempts > 1 ? `<span class="activity-attempts">${activity.attempts} próby</span>` : ''}
                    <span class="activity-date">${this.formatDate(activity.completedAt)}</span>
                  </div>
                </div>
              </div>
            `).join('') : '<p class="no-data-small">Brak rozwiązanych ćwiczeń językowych</p>'}
          </div>
        </div>

        <!-- Quizy od nauczyciela -->
        <div class="section">
          <h3>🎓 Ostatnie quizy od nauczyciela</h3>
          <div class="activity-list">
            ${stats.recentQuizzes.length > 0 ? stats.recentQuizzes.map(quiz => `
              <div class="activity-item quiz-item">
                <div class="activity-icon ${quiz.isCorrect ? 'correct' : 'incorrect'}">
                  ${quiz.isCorrect ? '✅' : '❌'}
                </div>
                <div class="activity-content">
                  <div class="activity-question">${quiz.question}</div>
                  <div class="quiz-answers">
                    <div class="user-answer">
                      <strong>Twoja odpowiedź:</strong> ${quiz.userAnswer}
                    </div>
                    ${!quiz.isCorrect ? `
                      <div class="correct-answer">
                        <strong>Poprawna odpowiedź:</strong> ${quiz.correctAnswer}
                      </div>
                    ` : ''}
                  </div>
                  <div class="activity-meta">
                    <span class="activity-type">${quiz.category}</span>
                    <span class="activity-time">${this.formatTime(quiz.timeSpent)}</span>
                    ${quiz.attempts > 1 ? `<span class="activity-attempts">${quiz.attempts} próby</span>` : ''}
                    <span class="activity-date">${this.formatDate(quiz.completedAt)}</span>
                  </div>
                </div>
              </div>
            `).join('') : '<p class="no-data-small">Brak rozwiązanych quizów od nauczyciela</p>'}
          </div>
        </div>
      </div>
    `;
  }

  getStyles() {
    return `
      <style>
        .stats-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 30px;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
          flex-wrap: wrap;
        }

        .section-header h2 {
          color: var(--text-primary);
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }

        .section-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 16px;
        }

        .loading, .no-data {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-left: 4px solid;
        }

        .stat-card.primary { border-left-color: #2196F3; }
        .stat-card.success { border-left-color: #4CAF50; }
        .stat-card.info { border-left-color: #FF9800; }
        .stat-card.warning { border-left-color: #F44336; }

        .stat-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--bg-tertiary);
        }

        .stat-content h3 {
          margin: 0;
          font-size: 24px;
          color: var(--text-primary);
        }

        .stat-content p {
          margin: 5px 0 0 0;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .section {
          margin-bottom: 40px;
        }

        .section h3 {
          color: var(--text-primary);
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .module-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .module-header h4 {
          margin: 0;
          color: var(--text-primary);
        }

        .accuracy {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .accuracy.high { background: var(--success-bg); color: #2e7d32; }
        .accuracy.medium { background: var(--warning-bg); color: #f57c00; }
        .accuracy.low { background: var(--error-bg); color: #d32f2f; }

        .module-category {
          color: var(--text-secondary);
          font-size: 14px;
          margin: 0 0 15px 0;
        }

        .module-progress {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--border-color);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #45a049);
          transition: width 0.3s ease;
        }

        .module-stats {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .strengths-weaknesses {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .strengths h4, .weaknesses h4 {
          margin: 0 0 15px 0;
          color: var(--text-primary);
        }

        .tag {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          margin: 5px 5px 5px 0;
        }

        .tag.positive {
          background: var(--success-bg);
          color: #2e7d32;
        }

        .tag.negative {
          background: var(--error-bg);
          color: #d32f2f;
        }

        .no-data-small {
          color: var(--text-muted);
          font-size: 14px;
          margin: 0;
        }

        .activity-list {
          space-y: 15px;
        }

        .activity-item {
          display: flex;
          gap: 15px;
          padding: 15px;
          background: var(--card-bg);
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          margin-bottom: 10px;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .activity-icon.correct {
          background: var(--success-bg);
        }

        .activity-icon.incorrect {
          background: var(--error-bg);
        }

        .activity-content {
          flex: 1;
        }

        .activity-question {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 5px;
        }

        .activity-meta {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .activity-meta span {
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .quiz-item {
          border-left: 3px solid #2196F3;
        }

        .quiz-answers {
          margin: 8px 0;
          font-size: 13px;
        }

        .user-answer {
          margin-bottom: 4px;
          color: var(--text-primary);
        }

        .correct-answer {
          color: #4CAF50;
        }

        .no-data-small {
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
          padding: 20px;
        }

        @media (max-width: 768px) {
          .stats-container {
            padding: 15px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .modules-grid {
            grid-template-columns: 1fr;
          }
          
          .strengths-weaknesses {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .activity-meta {
            flex-direction: column;
            gap: 5px;
          }
        }

        /* Animacje */
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

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      </style>
    `;
  }
}

customElements.define('student-statistics', StudentStatistics);
