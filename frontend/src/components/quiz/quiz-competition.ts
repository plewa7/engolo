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

class QuizCompetition extends HTMLElement {
  shadow: ShadowRoot;
  leaderboard: LeaderboardEntry[] = [];
  currentUserRank: number = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.loadData();
  }

  async loadData() {
    await this.loadLeaderboard();
    this.render();
  }

  async loadLeaderboard() {
    try {
      const token = localStorage.getItem("strapi_jwt");
      const response = await fetch('http://localhost:1337/api/quiz-statistics?populate=user', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        this.processLeaderboardData(data.data || []);
      } else {
        this.loadDemoLeaderboard();
      }
    } catch (error) {
      this.loadDemoLeaderboard();
    }
  }

  processLeaderboardData(statistics: any[]) {
    const userStats = new Map<string, any>();
    
    statistics.forEach(stat => {
      if (!stat.user || !stat.user.id) {
        return;
      }
      
      const userId = String(stat.user.id);
      const username = stat.user.username || `Użytkownik ${userId}`;
      
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          id: userId,
          username: username,
          totalScore: 0,
          completedQuizSets: 0,
          totalPossibleScore: 0,
          lastActive: stat.completedAt || new Date().toISOString()
        });
      }
      
      const user = userStats.get(userId)!;
      user.totalScore += stat.score || 0;
      user.totalPossibleScore += stat.totalPoints || 0;
      user.completedQuizSets += 1;
      
      if (new Date(stat.completedAt || 0) > new Date(user.lastActive)) {
        user.lastActive = stat.completedAt;
      }
    });
    
    const leaderboardArray = Array.from(userStats.values())
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
      .slice(0, 10);
      
    this.leaderboard = leaderboardArray;
      
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const userEntry = this.leaderboard.find(entry => entry.id === String(currentUser.id));
      this.currentUserRank = userEntry ? userEntry.rank : 0;
    }
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
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
      }
    ];
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m temu`;
    if (diffHours < 24) return `${diffHours}h temu`;
    if (diffDays < 7) return `${diffDays}d temu`;
    return date.toLocaleDateString('pl-PL');
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

        .content-grid {
          display: block;
        }

        .section-title {
          font-size: 20px;
          color: var(--text-primary);
          margin: 0 0 20px 0;
          padding: 15px;
          background: var(--card-bg);
          border-radius: 8px;
          border-left: 4px solid var(--primary-color);
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
          background: var(--card-bg);
          border-radius: 8px;
          margin-bottom: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }

        .leaderboard-item:hover {
          transform: translateY(-2px);
        }

        .rank-badge {
          font-size: 24px;
          margin-right: 15px;
        }

        .user-info {
          flex: 1;
        }

        .username {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .user-stats {
          font-size: 14px;
          color: #666;
        }

        .score {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-color);
        }

        @media (max-width: 768px) {
          .content-grid {
            display: block;
          }
        }
      </style>

      <div class="competition-container">
        <div class="content-grid">
          <div class="leaderboard-section">
            <h2 class="section-title">🏅 Ranking Studentów</h2>
            <ul class="leaderboard-list">
              ${this.leaderboard.map(entry => `
                <li class="leaderboard-item">
                  <span class="rank-badge">${this.getRankBadge(entry.rank)}</span>
                  <div class="user-info">
                    <div class="username">${entry.username}</div>
                    <div class="user-stats">
                      ${entry.completedQuizSets} zadań • ${entry.averageScore}% średnia • ${this.formatTimeAgo(entry.lastActive)}
                    </div>
                  </div>
                  <div class="score">${entry.totalScore} pkt</div>
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
