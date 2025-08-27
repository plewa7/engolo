import "../../styles/globals.css";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  DoughnutController,
  BarController,
  LineController,
  ScatterController
} from 'chart.js';

// Rejestracja kontrolerów Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  LineController,
  ScatterController
);

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
  score?: number;
  totalPoints?: number;
  percentage?: number;
}

class StudentStatistics extends HTMLElement {
  shadow: ShadowRoot;
  statistics: StatisticData | null = null;
  loading: boolean = true;
  charts: { [key: string]: Chart } = {};

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
      
      if (userId === "anon") {
        this.showLoginRequired();
        return;
      }

      const token = localStorage.getItem("strapi_jwt");
      let statisticsData: any[] = [];
      let quizSetsData: any[] = [];

      // Spróbuj pobrać z backend'u
      if (token) {
        try {
          // Pobierz exercise statistics
          const exerciseResponse = await fetch(`http://localhost:1337/api/exercise-statistics?filters[user][id][$eq]=${userId}&sort=completedAt:desc`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          // Pobierz quiz statistics
          const quizResponse = await fetch(`http://localhost:1337/api/quiz-statistics?filters[user][id][$eq]=${userId}&sort=completedAt:desc&populate=user`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          // Pobierz quiz-sets żeby mieć tytuły
          const quizSetsResponse = await fetch(`http://localhost:1337/api/quiz-sets`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          let exerciseData: any[] = [];
          let quizData: any[] = [];

          if (exerciseResponse.ok) {
            const data = await exerciseResponse.json();
            exerciseData = data.data || [];
          } else {
            exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
          }

          if (quizResponse.ok) {
            const data = await quizResponse.json();
            quizData = data.data || [];
          } else {
            quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
          }

          if (quizSetsResponse.ok) {
            const data = await quizSetsResponse.json();
            quizSetsData = data.data || [];
            console.log('Quiz Sets Data:', quizSetsData); // Debug
          }

          // Combine both types of statistics
          statisticsData = [...exerciseData, ...quizData];

        } catch (error) {
          const exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
          const quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
          statisticsData = [...exerciseData, ...quizData];
        }
      } else {
        const exerciseData = this.loadStatisticsFromLocalStorage(userId, 'exercise_statistics');
        const quizData = this.loadStatisticsFromLocalStorage(userId, 'quiz_statistics');
        statisticsData = [...exerciseData, ...quizData];
      }

      // Przekaż dane wraz z quiz-setami do processStatistics
      this.processStatistics(statisticsData, quizSetsData);
    } catch (error) {
      this.showError("Błąd połączenia");
    } finally {
      this.loading = false;
      this.render();
      // Utwórz wykresy po renderowaniu
      setTimeout(() => this.createCharts(), 100);
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

  processStatistics(rawData: any[], quizSetsData: any[] = []) {
    
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
      return data;
    }).filter(stat => stat && typeof stat === 'object'); // Odfiltruj nieprawidłowe dane
    
    // Rozdziel na ćwiczenia językowe i quizy nauczyciela
    const exercises = allStats.filter(stat => stat.exerciseType && !stat.quizSetId);
    const quizzes = allStats.filter(stat => stat.quizSetId);
    
    console.log('All Stats:', allStats); // Debug
    console.log('Quizzes:', quizzes); // Debug
    console.log('Quiz Sets Data in processStatistics:', quizSetsData); // Debug
    
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
      .map(quiz => {
        // Znajdź tytuł quiz-setu na podstawie ID (konwertuj na number dla porównania)
        const quizSetId = parseInt(quiz.quizSetId);
        const quizSet = quizSetsData.find(qs => qs.id === quizSetId);
        const quizTitle = quizSet?.attributes?.title || quizSet?.title || `Quiz Set (ID: ${quiz.quizSetId})`;
        
        console.log(`Quiz ${quiz.quizSetId}: Found quizSet:`, quizSet, 'Title:', quizTitle); // Debug
        
        return {
          id: quiz.id || 'unknown',
          quizId: quiz.quizSetId || 'unknown',
          question: `${quizTitle} - ${quiz.score || 0}/${quiz.totalPoints || 0} pkt`,
          userAnswer: `${quiz.score || 0} punktów`,
          correctAnswer: `${quiz.totalPoints || 0} punktów (max)`,
          isCorrect: (quiz.percentage || 0) >= 50,
          attempts: 1,
          timeSpent: quiz.timeSpent || 0,
          completedAt: quiz.completedAt || new Date().toISOString(),
          category: `${quizTitle} (${Math.round(quiz.percentage || 0)}%)`
        };
      });

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
            `).join('') : `
              <div class="no-data-small">
                <p>Brak rozwiązanych quizów od nauczyciela</p>
              </div>
            `}
          </div>
        </div>

        <!-- Sekcja wykresów -->
        <div class="section">
          <h3>📊 Analiza statystyk</h3>
          <div class="charts-grid">
            <div class="chart-card">
              <h4>Skuteczność w modułach</h4>
              <canvas id="moduleAccuracyChart"></canvas>
            </div>
            <div class="chart-card">
              <h4>Postęp w czasie</h4>
              <canvas id="progressTimeChart"></canvas>
            </div>
            <div class="chart-card">
              <h4>Rozkład typów ćwiczeń</h4>
              <canvas id="exerciseTypesChart"></canvas>
            </div>
            <div class="chart-card">
              <h4>Analiza czasu</h4>
              <canvas id="timeChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getStyles() {
    return `
      <style>
        /* Global section-header styles */
        .section-header {
          text-align: center;
          margin-bottom: 30px;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }

        .section-header h2 {
          color: var(--text-primary);
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 600;
          line-height: 1.2;
        }

        .section-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
        }

        .stats-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

        /* Styles for charts */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-top: 30px;
        }

        .chart-card {
          background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.08);
          backdrop-filter: blur(10px);
          height: 420px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }

        .chart-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          border-radius: 16px 16px 0 0;
        }

        .chart-card:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 12px 40px rgba(0,0,0,0.15),
            0 4px 12px rgba(0,0,0,0.1);
        }

        .chart-card h4 {
          margin: 0 0 20px 0;
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--text-primary) 0%, #667eea 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .chart-card canvas {
          flex: 1;
          max-width: 100% !important;
          max-height: 340px !important;
          width: 380px !important;
          height: 320px !important;
          object-fit: contain;
          border-radius: 8px;
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

          .charts-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .chart-card {
            height: 380px;
            padding: 20px;
          }
          
          .chart-card canvas {
            max-height: 300px !important;
            height: 280px !important;
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

  // Funkcje wykresów
  private createCharts() {
    this.createModuleAccuracyChart();
    this.createProgressTimeChart();
    this.createExerciseTypesChart();
    this.createTimeChart();
  }

  private createModuleAccuracyChart() {
    const canvas = this.shadow.querySelector('#moduleAccuracyChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const moduleData = this.statistics.moduleStats.map(module => ({
      label: `Moduł ${module.module}`,
      accuracy: module.accuracy,
      completed: module.completed,
      total: module.total
    }));

    this.charts.moduleAccuracy = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: moduleData.map(m => m.label),
        datasets: [{
          label: 'Skuteczność (%)',
          data: moduleData.map(m => m.accuracy),
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)', 
            'rgba(240, 147, 251, 0.8)',
            'rgba(129, 140, 248, 0.8)',
            'rgba(167, 139, 250, 0.8)'
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(118, 75, 162, 1)',
            'rgba(240, 147, 251, 1)',
            'rgba(129, 140, 248, 1)',
            'rgba(167, 139, 250, 1)'
          ],
          borderWidth: 2,
          borderRadius: 12,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 12,
            caretPadding: 10,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 12 },
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 12 }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  private createProgressTimeChart() {
    const canvas = this.shadow.querySelector('#progressTimeChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const last10Activities = this.statistics.recentActivity.slice(0, 10).reverse();
    const labels = last10Activities.map((_, index) => `Zadanie ${index + 1}`);
    const accuracyData = last10Activities.map(activity => activity.isCorrect ? 100 : 0);
    const timeData = last10Activities.map(activity => activity.timeSpent);

    this.charts.progressTime = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Skuteczność',
          data: accuracyData,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y'
        }, {
          label: 'Czas (sekundy)',
          data: timeData,
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.1)',
          tension: 0.4,
          fill: false,
          borderWidth: 3,
          pointBackgroundColor: '#f093fb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 12 },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 12,
            caretPadding: 10,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 11 },
              callback: function(value) {
                return value + '%';
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 11 },
              callback: function(value) {
                return value + 's';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 10 }
            }
          }
        },
        animation: {
          duration: 2000,
          easing: 'easeOutCubic'
        }
      }
    });
  }

  private createExerciseTypesChart() {
    const canvas = this.shadow.querySelector('#exerciseTypesChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const exerciseTypes = this.statistics.recentActivity.reduce((acc: any, activity) => {
      acc[activity.exerciseType] = (acc[activity.exerciseType] || 0) + 1;
      return acc;
    }, {});

    this.charts.exerciseTypes = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(exerciseTypes),
        datasets: [{
          data: Object.values(exerciseTypes),
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(240, 147, 251, 0.8)',
            'rgba(129, 140, 248, 0.8)',
            'rgba(167, 139, 250, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(118, 75, 162, 1)',
            'rgba(240, 147, 251, 1)',
            'rgba(129, 140, 248, 1)',
            'rgba(167, 139, 250, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.8)',
              font: { size: 12 },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 12,
            caretPadding: 10,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        animation: {
          animateRotate: true,
          duration: 2000
        }
      }
    });
  }

  private createTimeChart() {
    const canvas = this.shadow.querySelector('#timeChart') as HTMLCanvasElement;
    if (!canvas || !this.statistics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timeRanges = {
      'Szybko (0-30s)': 0,
      'Średnio (30-60s)': 0,
      'Wolno (60-120s)': 0,
      'Bardzo wolno (120s+)': 0
    };

    this.statistics.recentActivity.forEach(activity => {
      if (activity.timeSpent <= 30) timeRanges['Szybko (0-30s)']++;
      else if (activity.timeSpent <= 60) timeRanges['Średnio (30-60s)']++;
      else if (activity.timeSpent <= 120) timeRanges['Wolno (60-120s)']++;
      else timeRanges['Bardzo wolno (120s+)']++;
    });

    this.charts.timeAnalysis = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(timeRanges),
        datasets: [{
          label: 'Liczba zadań',
          data: Object.values(timeRanges),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 12,
            caretPadding: 10,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 12 }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 10 }
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutBounce'
        }
      }
    });
  }

  disconnectedCallback() {
    // Zniszcz wykresy przy usuwaniu komponentu
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }
}

customElements.define('student-statistics', StudentStatistics);
