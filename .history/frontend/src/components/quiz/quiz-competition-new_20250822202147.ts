import "../../styles/globals.css";

interface LeaderboardEntry {
  id: string;
  username: string;
  totalScore: number;
  completedQuizSets: number;
  averageScore: number;
  lastActive: string;
  rank: number;
}

interface QuizSetResult {
  id: string;
  quizSetTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number;
  completedAt: string;
  username: string;
}

class QuizCompetition extends HTMLElement {
  shadow: ShadowRoot;
  leaderboard: LeaderboardEntry[] = [];
  recentResults: QuizSetResult[] = [];
  currentUserRank: number = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.loadLeaderboard();
    this.loadRecentResults();
    this.render();
  }

  async loadLeaderboard() {
    try {
      // Najpierw spróbuj prawdziwe dane z API
      const token = localStorage.getItem("strapi_jwt");
      const response = await fetch('http://localhost:1337/api/quiz-statistics?populate=*&sort=score:desc', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        this.processLeaderboardData(data.data || []);
      } else {
        console.warn('Failed to load leaderboard, using demo data');
        this.loadDemoLeaderboard();
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.loadDemoLeaderboard();
    }
  }

  processLeaderboardData(statistics: any[]) {
    // Grupuj statystyki według użytkowników
    const userStats = new Map<string, any>();
    
    statistics.forEach(stat => {
      const attrs = stat.attributes || stat;
      const userId = attrs.user?.data?.id || attrs.userId || 'anonymous';
      const username = attrs.user?.data?.attributes?.username || attrs.username || `Użytkownik ${userId}`;
      
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          id: userId,
          username: username,
          totalScore: 0,
          completedQuizSets: 0,
          totalPossibleScore: 0,
          lastActive: attrs.completedAt || new Date().toISOString()
        });
      }
      
      const user = userStats.get(userId)!;
      user.totalScore += attrs.score || 0;
      user.totalPossibleScore += attrs.totalPoints || 0;
      user.completedQuizSets += 1;
      
      if (new Date(attrs.completedAt || 0) > new Date(user.lastActive)) {
        user.lastActive = attrs.completedAt;
      }
    });
    
    // Konwertuj do array i posortuj
    this.leaderboard = Array.from(userStats.values())
      .map(user => ({
        id: user.id,
        username: user.username,
        totalScore: user.totalScore,
        completedQuizSets: user.completedQuizSets,
        averageScore: user.totalPossibleScore > 0 ? Math.round((user.totalScore / user.totalPossibleScore) * 100) : 0,
        lastActive: user.lastActive,
        rank: 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))
      .slice(0, 10); // Top 10
      
    // Znajdź ranking aktualnego użytkownika
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const userEntry = this.leaderboard.find(entry => entry.username === currentUser.username);
      this.currentUserRank = userEntry ? userEntry.rank : 0;
    }
  }

  loadDemoLeaderboard() {
    this.leaderboard = [
      {
        id: '1',
        username: 'Anna Kowalska',
        totalScore: 450,
        completedQuizSets: 5,
        averageScore: 90,
        lastActive: '2025-08-22T10:30:00Z',
        rank: 1
      },
      {
        id: '2', 
        username: 'Piotr Nowak',
        totalScore: 420,
        completedQuizSets: 6,
        averageScore: 70,
        lastActive: '2025-08-22T09:15:00Z',
        rank: 2
      },
      {
        id: '3',
        username: 'Maria Wiśniewska', 
        totalScore: 380,
        completedQuizSets: 4,
        averageScore: 95,
        lastActive: '2025-08-22T11:45:00Z',
        rank: 3
      },
      {
        id: '4',
        username: 'Tomasz Wójcik',
        totalScore: 350,
        completedQuizSets: 7,
        averageScore: 50,
        lastActive: '2025-08-22T08:20:00Z',
        rank: 4
      },
      {
        id: '5',
        username: 'Katarzyna Lewandowska',
        totalScore: 320,
        completedQuizSets: 3,
        averageScore: 85,
        lastActive: '2025-08-22T12:10:00Z',
        rank: 5
      }
    ];
    
    // Symuluj ranking aktualnego użytkownika
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.currentUserRank = Math.floor(Math.random() * 10) + 1;
    }
  }

  async loadRecentResults() {
    try {
      const token = localStorage.getItem("strapi_jwt");
      const response = await fetch('http://localhost:1337/api/quiz-statistics?populate=*&sort=completedAt:desc&pagination[limit]=5', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        this.recentResults = (data.data || []).map((item: any) => {
          const attrs = item.attributes || item;
          return {
            id: item.id,
            quizSetTitle: attrs.quizSetTitle || 'Quiz Set',
            score: attrs.score || 0,
            totalPoints: attrs.totalPoints || 0,
            percentage: attrs.percentage || 0,
            timeSpent: attrs.timeSpent || 0,
            completedAt: attrs.completedAt || new Date().toISOString(),
            username: attrs.user?.data?.attributes?.username || attrs.username || 'Nieznany użytkownik'
          };
        });
      } else {
        this.loadDemoRecentResults();
      }
    } catch (error) {
      console.error('Error loading recent results:', error);
      this.loadDemoRecentResults();
    }
  }

  loadDemoRecentResults() {
    this.recentResults = [
      {
        id: '1',
        quizSetTitle: 'Podstawy Angielskiego',
        score: 25,
        totalPoints: 30,
        percentage: 83,
        timeSpent: 180,
        completedAt: '2025-08-22T11:30:00Z',
        username: 'Anna Kowalska'
      },
      {
        id: '2',
        quizSetTitle: 'Matematyka - Algebra',
        score: 40,
        totalPoints: 50,
        percentage: 80,
        timeSpent: 240,
        completedAt: '2025-08-22T11:15:00Z',
        username: 'Piotr Nowak'
      },
      {
        id: '3',
        quizSetTitle: 'Historia Polski',
        score: 35,
        totalPoints: 40,
        percentage: 87,
        timeSpent: 200,
        completedAt: '2025-08-22T10:45:00Z',
        username: 'Maria Wiśniewska'
      }
    ];
  }

  getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user;
    } catch {
      return null;
    }
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    return `${diffDays} dni temu`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getRankBadge(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    return '🎯';
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        .competition-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .competition-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .competition-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }

        .competition-subtitle {
          color: #666;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border-left: 4px solid #2196F3;
          animation: slideInUp 0.6s ease forwards;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #2196F3;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .leaderboard-section, .recent-section {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          animation: slideInUp 0.6s ease forwards;
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

        .leaderboard-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .leaderboard-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 10px;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .leaderboard-item:hover {
          background: #e3f2fd;
          transform: translateX(5px);
        }

        .rank-badge {
          font-size: 20px;
          margin-right: 15px;
          min-width: 30px;
        }

        .user-info {
          flex: 1;
        }

        .username {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 5px;
        }

        .user-stats {
          font-size: 12px;
          color: #666;
        }

        .score {
          font-size: 18px;
          font-weight: 700;
          color: #2196F3;
        }

        .recent-results {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .recent-item {
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 10px;
          background: #f8f9fa;
          border-left: 4px solid #4CAF50;
        }

        .recent-title {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .recent-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #666;
        }

        .recent-score {
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .your-rank {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #333;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
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

        @media (max-width: 768px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      </style>

      <div class="competition-container">
        <div class="competition-header">
          <h1 class="competition-title">🏆 Ranking Quiz-Sets</h1>
          <p class="competition-subtitle">Rywalizuj z innymi uczniami i zdobywaj punkty!</p>
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-number">${this.leaderboard.length}</div>
            <div class="stat-label">Aktywni uczniowie</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.leaderboard.reduce((sum, entry) => sum + entry.completedQuizSets, 0)}</div>
            <div class="stat-label">Ukończone Quiz-Sets</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.leaderboard.reduce((sum, entry) => sum + entry.totalScore, 0)}</div>
            <div class="stat-label">Łączne punkty</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${this.currentUserRank || '?'}</div>
            <div class="stat-label">Twoja pozycja</div>
          </div>
        </div>

        ${this.currentUserRank > 0 ? `
          <div class="your-rank">
            ${this.getRankBadge(this.currentUserRank)} Jesteś na ${this.currentUserRank}. miejscu w rankingu!
          </div>
        ` : ''}

        <div class="content-grid">
          <div class="leaderboard-section">
            <h2 class="section-title">🏅 Top 10 Rankingu</h2>
            <ul class="leaderboard-list">
              ${this.leaderboard.map(entry => `
                <li class="leaderboard-item">
                  <span class="rank-badge">${this.getRankBadge(entry.rank)}</span>
                  <div class="user-info">
                    <div class="username">${entry.username}</div>
                    <div class="user-stats">
                      ${entry.completedQuizSets} quiz-sets • ${entry.averageScore}% średnia • ${this.formatTimeAgo(entry.lastActive)}
                    </div>
                  </div>
                  <div class="score">${entry.totalScore} pkt</div>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="recent-section">
            <h2 class="section-title">⚡ Ostatnie wyniki</h2>
            <ul class="recent-results">
              ${this.recentResults.map(result => `
                <li class="recent-item">
                  <div class="recent-title">${result.quizSetTitle}</div>
                  <div class="recent-details">
                    <span>${result.username} • ${this.formatTimeAgo(result.completedAt)}</span>
                    <span class="recent-score">${result.percentage}%</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('quiz-competition', QuizCompetition);
