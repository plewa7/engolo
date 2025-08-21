interface TeacherStatisticData {
  totalStudents: number;
  totalExercises: number;
  averageProgress: number;
  studentStats: StudentStats[];
  modulePerformance: ModulePerformance[];
  recentActivity: TeacherActivityItem[];
}

interface StudentStats {
  id: string;
  username: string;
  email: string;
  totalExercises: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  lastActive: string;
  moduleProgress: {
    module: number;
    completed: number;
    total: number;
  }[];
}

interface ModulePerformance {
  module: number;
  category: string;
  totalAttempts: number;
  averageAccuracy: number;
  averageTime: number;
  studentsCompleted: number;
  totalStudents: number;
}

interface TeacherActivityItem {
  studentName: string;
  exerciseType: string;
  module: number;
  isCorrect: boolean;
  timeSpent: number;
  completedAt: string;
  isQuiz?: boolean;
  quizId?: string;
}

class TeacherStatistics extends HTMLElement {
  shadow: ShadowRoot;
  statistics: TeacherStatisticData | null = null;
  loading: boolean = true;
  selectedView: 'overview' | 'students' | 'modules' = 'overview';
  selectedStudentId: string | null = null;
  allUsers: any[] = [];
  allStatistics: any[] = [];

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
      const token = localStorage.getItem("strapi_jwt");
      if (!token) {
        this.showError("Brak autoryzacji");
        return;
      }

      // Pobierz wszystkich użytkowników
      const usersResponse = await fetch('http://localhost:1337/api/users', {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!usersResponse.ok) {
        console.error('Users API error:', usersResponse.status, usersResponse.statusText);
        this.showError("Błąd pobierania użytkowników");
        return;
      }

      const users = await usersResponse.json();
      console.log('Users API response:', users);
      this.allUsers = users;
      
      // Pobierz wszystkie statystyki ćwiczeń językowych
      const exerciseStatsResponse = await fetch('http://localhost:1337/api/exercise-statistics?populate=user&sort=completedAt:desc', {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!exerciseStatsResponse.ok) {
        console.error('Exercise Statistics API error:', exerciseStatsResponse.status, exerciseStatsResponse.statusText);
        this.showError("Błąd pobierania statystyk ćwiczeń");
        return;
      }

      const exerciseStats = await exerciseStatsResponse.json();
      console.log('Exercise Statistics API response:', exerciseStats);

      // Pobierz wszystkie statystyki quizów
      const quizStatsResponse = await fetch('http://localhost:1337/api/quiz-statistics?populate=user&sort=completedAt:desc', {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!quizStatsResponse.ok) {
        console.error('Quiz Statistics API error:', quizStatsResponse.status, quizStatsResponse.statusText);
        this.showError("Błąd pobierania statystyk quizów");
        return;
      }

      const quizStats = await quizStatsResponse.json();
      console.log('Quiz Statistics API response:', quizStats);

      // Połącz wszystkie statystyki z oznaczeniem typu
      const allStats = [
        ...(exerciseStats.data || []).map((stat: any) => ({ ...stat, isQuiz: false })),
        ...(quizStats.data || []).map((stat: any) => ({ ...stat, isQuiz: true }))
      ];
      console.log('Combined stats with quiz flags:', allStats);
      this.allStatistics = allStats;
      this.processTeacherStatistics(users, allStats);

    } catch (error) {
      console.error('Error loading teacher statistics:', error);
      this.showError("Błąd połączenia");
    } finally {
      this.loading = false;
      this.render();
    }
  }

  processTeacherStatistics(users: any[], rawStats: any[]) {
      console.log('=== TEACHER STATISTICS DEBUG ===');
      console.log('All users received:', users);
      console.log('Raw statistics received:', rawStats.length);
      
      const studentUsers = users.filter(user => !user.isTeacher);
      console.log('Filtered student users:', studentUsers);    // Filtruj tylko statystyki z prawidłową strukturą user
    const validStats = rawStats.filter(item => {
      console.log('Full statistic item structure:', item);
      
      // Teacher statistics otrzymuje płaską strukturę, nie Strapi v4 format
      const hasUser = item.user || (item.attributes?.user?.data?.id);
      
      if (!hasUser) {
        console.log('Skipping statistic without user:', item);
      } else {
        console.log('Valid statistic with user:', hasUser, item);
      }
      return hasUser;
    });
    
    console.log('Valid statistics with users:', validStats);
    
    const exercises = validStats.map(item => {
      // Teacher statistics ma płaską strukturę, student statistics ma item.attributes
      const data = item.attributes || item;
      const user = data.user || item.user;
      
      const processedItem = {
        ...data,
        userId: user?.id || user || 'unknown',
        userName: user?.username || 'Nieznany użytkownik',
        // Rozróżnij typ statystyki
        isQuiz: !!data.quizId,
        type: data.quizId ? 'quiz' : 'exercise',
        // Dodaj brakujące pola dla quizów
        exerciseType: data.exerciseType || (data.quizId ? 'Quiz' : 'Exercise'),
        timeSpent: data.timeSpent || 0,
        module: data.module || 0,
        isCorrect: data.isCorrect !== undefined ? data.isCorrect : true
      };
      
      if (data.quizId) {
        console.log('Processing quiz item:', item, '=> processed:', processedItem);
      }
      
      return processedItem;
    });

    console.log('Processed exercises:', exercises);

    // Podstawowe statystyki
    const studentGroups = this.groupBy(exercises.filter(ex => ex.userId), 'userId');
    const totalStudents = Object.keys(studentGroups).length; // Tylko aktywni uczniowie ze statystykami
    const totalExercises = exercises.length;
    
    // Statystyki studentów
    const studentStats: StudentStats[] = Object.entries(studentGroups).map(([userId, userExercises]) => {
      const exerciseList = userExercises as any[];
      const user = studentUsers.find(u => u.id === parseInt(userId));
      const correctAnswers = exerciseList.filter(ex => ex.isCorrect).length;
      const accuracy = Math.round((correctAnswers / exerciseList.length) * 100);
      const averageTime = Math.round(exerciseList.reduce((sum, ex) => sum + ex.timeSpent, 0) / exerciseList.length);
      
      // Progress w modułach
      const moduleGroups = this.groupBy(exerciseList, 'module');
      const moduleProgress = Object.entries(moduleGroups).map(([module, moduleExs]) => {
        const moduleExercises = moduleExs as any[];
        return {
          module: parseInt(module),
          completed: moduleExercises.filter(ex => ex.isCorrect).length,
          total: moduleExercises.length
        };
      });

      return {
        id: userId,
        username: user?.username || 'Nieznany',
        email: user?.email || '',
        totalExercises: exerciseList.length,
        correctAnswers,
        accuracy,
        averageTime,
        lastActive: exerciseList[0]?.completedAt || '',
        moduleProgress
      };
    }).sort((a, b) => {
      // Sortuj według skuteczności (malejąco), w przypadku remisu według liczby zadań
      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }
      return b.totalExercises - a.totalExercises;
    });

    const averageProgress = studentStats.length > 0 
      ? Math.round(studentStats.reduce((sum, s) => sum + s.accuracy, 0) / studentStats.length)
      : 0;

    // Performance modułów
    const moduleGroups = this.groupBy(exercises, 'module');
    const modulePerformance: ModulePerformance[] = Object.entries(moduleGroups).map(([module, moduleExs]) => {
      const exerciseList = moduleExs as any[];
      const correctCount = exerciseList.filter(ex => ex.isCorrect).length;
      const averageAccuracy = Math.round((correctCount / exerciseList.length) * 100);
      const averageTime = Math.round(exerciseList.reduce((sum, ex) => sum + ex.timeSpent, 0) / exerciseList.length);
      
      const uniqueStudents = new Set(exerciseList.map(ex => ex.userId)).size;
      
      return {
        module: parseInt(module),
        category: exerciseList[0].category || 'Różne',
        totalAttempts: exerciseList.length,
        averageAccuracy,
        averageTime,
        studentsCompleted: uniqueStudents,
        totalStudents
      };
    }).sort((a, b) => a.module - b.module);

    // Ostatnia aktywność
    const recentActivity: TeacherActivityItem[] = exercises.slice(0, 20).map(ex => ({
      studentName: ex.userName || 'Nieznany użytkownik',
      exerciseType: ex.isQuiz ? `Quiz (${ex.category || 'Quiz'})` : (ex.exerciseType || 'Nieznane'),
      module: ex.module || 0,
      isCorrect: ex.isCorrect !== undefined ? ex.isCorrect : true,  // Default dla quizów jeśli brak
      timeSpent: ex.timeSpent || 0,  // Default 0 dla quizów jeśli brak
      completedAt: ex.completedAt || new Date().toISOString(),
      isQuiz: ex.isQuiz || false,
      quizId: ex.quizId
    }));

    console.log('Recent activity items:', recentActivity);
    console.log('Quiz activities found:', recentActivity.filter(a => a.isQuiz));
    console.log('First quiz activity details:', recentActivity.find(a => a.isQuiz));
    console.log('All activities sorted by date:', recentActivity.map(a => ({ 
      name: a.studentName, 
      type: a.isQuiz ? 'QUIZ' : 'EXERCISE', 
      date: a.completedAt,
      exerciseType: a.exerciseType 
    })));

    this.statistics = {
      totalStudents,
      totalExercises,
      averageProgress,
      studentStats,
      modulePerformance,
      recentActivity
    };
  }

  groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (group) {
        groups[group] = groups[group] || [];
        groups[group].push(item);
      }
      return groups;
    }, {});
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

  getTypeLabel(type: string): string {
    const labels = {
      'translation': 'Tłumaczenia',
      'vocabulary': 'Słownictwo',
      'grammar': 'Gramatyka',
      'listening': 'Słuchanie'
    };
    return labels[type as keyof typeof labels] || type;
  }

  switchView(view: 'overview' | 'students' | 'modules') {
    this.selectedView = view;
    this.selectedStudentId = null; // Reset student selection when changing views
    this.render();
  }

  selectStudent(studentId: string | null) {
    this.selectedStudentId = studentId;
    this.render();
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
            <p>Nie można załadować statystyk nauczyciela.</p>
          </div>
        </div>
      `;
      return;
    }

    this.shadow.innerHTML = `
      ${this.getStyles()}
      <div class="stats-container">
        <div class="stats-header">
          <h2>👩‍🏫 Statystyki Uczniów</h2>
          <p>Przegląd postępów wszystkich uczniów</p>
        </div>

        <!-- Nawigacja -->
        <div class="nav-tabs">
          <button class="nav-tab ${this.selectedView === 'overview' ? 'active' : ''}" data-view="overview">
            📊 Przegląd
          </button>
          <button class="nav-tab ${this.selectedView === 'students' ? 'active' : ''}" data-view="students">
            👥 Uczniowie
          </button>
          <button class="nav-tab ${this.selectedView === 'modules' ? 'active' : ''}" data-view="modules">
            📚 Moduły
          </button>
        </div>

        ${this.renderCurrentView()}
      </div>
    `;

    // Dodaj event listenery dla tabów
    this.shadow.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const view = target.getAttribute('data-view') as 'overview' | 'students' | 'modules';
        if (view) this.switchView(view);
      });
    });

    // Dodaj event listenery dla przycisków uczniów
    this.shadow.querySelectorAll('.view-student-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const studentId = target.getAttribute('data-student-id');
        if (studentId) this.selectStudent(studentId);
      });
    });

    // Dodaj event listener dla przycisku powrotu
    const backBtn = this.shadow.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.selectStudent(null));
    }
  }

  renderCurrentView(): string {
    if (!this.statistics) return '';

    switch (this.selectedView) {
      case 'overview':
        return this.renderOverview();
      case 'students':
        return this.renderStudents();
      case 'modules':
        return this.renderModules();
      default:
        return this.renderOverview();
    }
  }

  renderOverview(): string {
    const stats = this.statistics!;
    
    return `
      <!-- Podstawowe statystyki -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>${stats.totalStudents}</h3>
            <p>Aktywnych uczniów</p>
          </div>
        </div>
        
        <div class="stat-card success">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <h3>${stats.totalExercises}</h3>
            <p>Zadań ukończonych</p>
          </div>
        </div>
        
        <div class="stat-card info">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h3>${stats.averageProgress}%</h3>
            <p>Średnia skuteczność</p>
          </div>
        </div>
      </div>

      <!-- Top uczniowie -->
      <div class="section">
        <h3>🏆 Najlepsi uczniowie</h3>
        <div class="top-students">
          ${stats.studentStats.slice(0, 5).map((student, index) => `
            <div class="student-row ${index < 3 ? 'top-performer' : ''}">
              <div class="student-rank">${index + 1}</div>
              <div class="student-info">
                <h4>${student.username}</h4>
                <p>${student.totalExercises} zadań • ${student.accuracy}% skuteczność</p>
              </div>
              <div class="student-score">${student.accuracy}%</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Ostatnia aktywność -->
      <div class="section">
        <h3>📝 Ostatnia aktywność</h3>
        <div class="activity-list">
          ${stats.recentActivity.slice(0, 20).map((activity, index) => {
            console.log(`Rendering activity ${index}:`, activity);
            return `
            <div class="activity-item ${activity.isQuiz ? 'quiz-activity' : ''}">
              <div class="activity-icon ${activity.isCorrect ? 'correct' : 'incorrect'}">
                ${activity.isCorrect ? '✅' : '❌'}
              </div>
              <div class="activity-content">
                <div class="activity-student">${activity.studentName}</div>
                <div class="activity-meta">
                  ${activity.isQuiz ? 
                    `<span class="activity-module">Quiz ${activity.quizId}</span>` : 
                    `<span class="activity-module">Moduł ${activity.module}</span>`
                  }
                  <span class="${activity.isQuiz ? 'quiz-type' : 'exercise-type'}">${activity.exerciseType}</span>
                  <span>${this.formatTime(activity.timeSpent)}</span>
                  <span>${this.formatDate(activity.completedAt)}</span>
                </div>
              </div>
            </div>
          `;}).join('')}
        </div>
      </div>
    `;
  }

  renderStudents(): string {
    const stats = this.statistics!;
    
    if (this.selectedStudentId) {
      return this.renderStudentDetails();
    }
    
    return `
      <div class="section">
        <h3>👥 Wszyscy uczniowie (${stats.studentStats.length})</h3>
        <div class="students-table">
          <div class="table-header">
            <div>Uczeń</div>
            <div>Zadania</div>
            <div>Skuteczność</div>
            <div>Średni czas</div>
            <div>Ostatnia aktywność</div>
            <div>Akcje</div>
          </div>
          ${stats.studentStats.map(student => `
            <div class="table-row">
              <div class="student-cell">
                <h4>${student.username}</h4>
                <p>${student.email}</p>
              </div>
              <div class="stat-cell">
                <span class="stat-number">${student.totalExercises}</span>
                <span class="stat-label">zadań</span>
              </div>
              <div class="stat-cell">
                <span class="accuracy-badge ${student.accuracy >= 80 ? 'high' : student.accuracy >= 60 ? 'medium' : 'low'}">
                  ${student.accuracy}%
                </span>
              </div>
              <div class="stat-cell">
                <span class="stat-number">${this.formatTime(student.averageTime)}</span>
              </div>
              <div class="stat-cell">
                <span class="date-text">${student.lastActive ? this.formatDate(student.lastActive) : 'Brak'}</span>
              </div>
              <div class="action-cell">
                <button class="view-student-btn" data-student-id="${student.id}">
                  👁️ Zobacz szczegóły
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderModules(): string {
    const stats = this.statistics!;
    
    return `
      <div class="section">
        <h3>📚 Performance modułów</h3>
        <div class="modules-performance">
          ${stats.modulePerformance.map(module => `
            <div class="module-performance-card">
              <div class="module-header">
                <h4>Moduł ${module.module}</h4>
                <span class="completion-rate">
                  ${module.studentsCompleted}/${module.totalStudents} uczniów
                </span>
              </div>
              <p class="module-category">${module.category}</p>
              
              <div class="performance-stats">
                <div class="performance-stat">
                  <span class="performance-label">Skuteczność</span>
                  <span class="performance-value ${module.averageAccuracy >= 80 ? 'high' : module.averageAccuracy >= 60 ? 'medium' : 'low'}">
                    ${module.averageAccuracy}%
                  </span>
                </div>
                <div class="performance-stat">
                  <span class="performance-label">Średni czas</span>
                  <span class="performance-value">${this.formatTime(module.averageTime)}</span>
                </div>
                <div class="performance-stat">
                  <span class="performance-label">Liczba prób</span>
                  <span class="performance-value">${module.totalAttempts}</span>
                </div>
              </div>
              
              <div class="completion-bar">
                <div class="completion-progress" style="width: ${(module.studentsCompleted / module.totalStudents) * 100}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getStyles() {
    return `
      <style>
        .stats-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .stats-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .stats-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .stats-header p {
          color: #666;
          margin: 0;
        }

        .loading, .no-data {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .nav-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 2px solid #f0f0f0;
        }

        .nav-tab {
          padding: 12px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .nav-tab:hover {
          color: #2196F3;
          background: #f8f9fa;
        }

        .nav-tab.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
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
          background: #f5f5f5;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .stat-content p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }

        .section {
          margin-bottom: 40px;
        }

        .section h3 {
          color: #333;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }

        .top-students {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .student-row {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .student-row:last-child {
          border-bottom: none;
        }

        .student-row.top-performer {
          background: linear-gradient(90deg, #fff8e1, white);
        }

        .student-rank {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 15px;
        }

        .top-performer .student-rank {
          background: linear-gradient(45deg, #FFD700, #FFA000);
          color: white;
        }

        .student-info {
          flex: 1;
        }

        .student-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .student-info p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .student-score {
          font-size: 18px;
          font-weight: bold;
          color: #4CAF50;
        }

        .activity-list {
          space-y: 10px;
        }

        .activity-item {
          display: flex;
          gap: 15px;
          padding: 15px;
          background: white;
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
          background: #e8f5e8;
        }

        .activity-icon.incorrect {
          background: #ffeaea;
        }

        .activity-content {
          flex: 1;
        }

        .activity-student {
          font-weight: 500;
          color: #333;
          margin-bottom: 5px;
        }

        .activity-meta {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #666;
        }

        .activity-meta span {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .activity-question {
          font-weight: 500;
          color: #333;
          margin-bottom: 5px;
        }

        .activity-module {
          background: #e3f2fd !important;
          color: #1976d2 !important;
        }

        .quiz-activity {
          border-left: 3px solid #FF9800;
        }

        .quiz-type {
          background: #fff3e0 !important;
          color: #f57c00 !important;
        }

        .exercise-type {
          background: #e8f5e8 !important;
          color: #2e7d32 !important;
        }

        .students-table {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr;
          gap: 20px;
          padding: 15px 20px;
          background: #f8f9fa;
          font-weight: 500;
          color: #333;
          border-bottom: 1px solid #e0e0e0;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr;
          gap: 20px;
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .action-cell {
          text-align: center;
        }

        .view-student-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .view-student-btn:hover {
          background: #1976D2;
        }

        .back-btn {
          background: #757575;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: #616161;
        }

        .student-details-header {
          margin-bottom: 30px;
        }

        .student-details-header h3 {
          margin: 10px 0 0 0;
          color: #333;
        }

        .student-cell h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .student-cell p {
          margin: 0;
          color: #666;
          font-size: 12px;
        }

        .stat-cell {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-weight: 500;
          color: #333;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
        }

        .accuracy-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .accuracy-badge.high { background: #e8f5e8; color: #2e7d32; }
        .accuracy-badge.medium { background: #fff3e0; color: #f57c00; }
        .accuracy-badge.low { background: #ffeaea; color: #d32f2f; }

        .date-text {
          font-size: 12px;
          color: #666;
        }

        .modules-performance {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .module-performance-card {
          background: white;
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
          color: #333;
        }

        .completion-rate {
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #666;
        }

        .module-category {
          color: #666;
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .performance-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }

        .performance-stat {
          text-align: center;
        }

        .performance-label {
          display: block;
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }

        .performance-value {
          display: block;
          font-weight: 500;
          color: #333;
        }

        .performance-value.high { color: #2e7d32; }
        .performance-value.medium { color: #f57c00; }
        .performance-value.low { color: #d32f2f; }

        .completion-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .completion-progress {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #45a049);
          transition: width 0.3s ease;
        }

        @media (max-width: 768px) {
          .stats-container {
            padding: 15px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .nav-tabs {
            flex-wrap: wrap;
          }
          
          .table-header, .table-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .modules-performance {
            grid-template-columns: 1fr;
          }
          
          .performance-stats {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
  }

  renderStudentDetails(): string {
    if (!this.selectedStudentId || !this.statistics) return '';
    
    const student = this.statistics.studentStats.find(s => s.id === this.selectedStudentId);
    if (!student) return '';

    // Pobierz statystyki dla tego ucznia (zarówno exercise jak i quiz)
    const studentStats = this.allStatistics.filter(stat => {
      // Dla teacher statistics mamy płaską strukturę z userId
      const userId = stat.userId || stat.user?.id || stat.attributes?.user?.data?.id;
      return userId && userId.toString() === this.selectedStudentId;
    });

    console.log('Student stats for user', this.selectedStudentId, ':', studentStats);

    const studentExercises = studentStats.map(stat => {
      const data = stat.attributes || stat;
      return {
        ...data,
        completedAt: data.completedAt || new Date().toISOString(),
        isQuiz: !!data.quizId,
        displayType: data.quizId ? `Quiz ${data.quizId}` : `Moduł ${data.module}`,
        exerciseTypeDisplay: data.quizId ? 'Quiz nauczyciela' : data.exerciseType
      };
    }).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    return `
      <div class="section">
        <div class="student-details-header">
          <button class="back-btn">← Powrót do listy uczniów</button>
          <h3>👤 Szczegóły ucznia: ${student.username}</h3>
        </div>

        <!-- Statystyki ucznia -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <h3>${student.totalExercises}</h3>
              <p>Zadań rozwiązanych</p>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>${student.accuracy}%</h3>
              <p>Skuteczność</p>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <h3>${this.formatTime(student.averageTime)}</h3>
              <p>Średni czas</p>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>${student.lastActive ? this.formatDate(student.lastActive) : 'Brak'}</h3>
              <p>Ostatnia aktywność</p>
            </div>
          </div>
        </div>

        <!-- Postęp w modułach -->
        <div class="section">
          <h3>📚 Postęp w modułach</h3>
          <div class="modules-grid">
            ${student.moduleProgress.map(progress => `
              <div class="module-card">
                <div class="module-header">
                  <h4>Moduł ${progress.module}</h4>
                  <span class="completion-rate">${progress.completed}/${progress.total}</span>
                </div>
                <div class="module-progress">
                  <div class="progress-bar">
                    <div class="progress" style="width: ${(progress.completed / progress.total) * 100}%"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Ostatnia aktywność -->
        <div class="section">
          <h3>📝 Ostatnia aktywność (${studentExercises.length} zadań)</h3>
          <div class="activity-list">
            ${studentExercises.slice(0, 20).map(exercise => `
              <div class="activity-item ${exercise.isQuiz ? 'quiz-activity' : ''}">
                <div class="activity-icon ${exercise.isCorrect ? 'correct' : 'incorrect'}">
                  ${exercise.isCorrect ? '✅' : '❌'}
                </div>
                <div class="activity-content">
                  <div class="activity-question">${(exercise.question || exercise.exerciseId || 'Zadanie').substring(0, 80)}...</div>
                  <div class="activity-meta">
                    <span class="${exercise.isQuiz ? 'quiz-type' : 'exercise-type'}">${exercise.exerciseTypeDisplay}</span>
                    <span class="activity-module">${exercise.displayType}</span>
                    <span class="activity-time">${this.formatTime(exercise.timeSpent || 0)}</span>
                    ${exercise.attempts > 1 ? `<span class="activity-attempts">${exercise.attempts} próby</span>` : ''}
                    <span class="activity-date">${this.formatDate(exercise.completedAt)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('teacher-statistics', TeacherStatistics);
