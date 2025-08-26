import { authStore } from "../../features/auth/auth.store";

const dashboardImages = [
  {
    url: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80",
    caption: "Odkrywaj świat wiedzy każdego dnia!",
  },
  {
    url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
    caption: "Nauka to podróż, nie cel.",
  },
  {
    url: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=600&q=80",
    caption: "Każde pytanie przybliża Cię do odpowiedzi.",
  },
  {
    url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    caption: "Wspólna nauka daje najlepsze efekty.",
  },
  {
    url: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
    caption: "Nie bój się popełniać błędów – to część nauki!",
  },
];

export class DashboardHome extends HTMLElement {
  async connectedCallback() {
    let user = authStore.getValue().user;
    if (!user) {
      try {
        const { fetchUser } = await import("../../features/auth/fetch-user");
        user = await fetchUser();
      } catch {}
    }
    const username = user?.username || user?.email || "Użytkownik";
    const avatarUrl = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
      username
    )}`;
    // Wybierz losowy obrazek z listy
    const imgIndex = Math.floor(Math.random() * dashboardImages.length);
    const dashboardImg = dashboardImages[imgIndex];
    this.innerHTML = `
      <style>
        .dashboard-home-bg {
          padding: 36px 20px;
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: all var(--transition-normal);
          min-height: calc(100vh - 70px);
        }
        
        .dashboard-container {
          max-width: 1000px;
          margin: 0 auto;
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
        
        .welcome-section {
          background: var(--card-bg);
          border-radius: var(--border-radius-lg);
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--card-border);
          text-align: center;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.2s forwards;
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 16px auto;
          border: 4px solid var(--primary);
          box-shadow: var(--shadow-md);
        }
        
        .welcome-title {
          font-size: var(--font-size-2xl);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }
        
        .welcome-subtitle {
          font-size: var(--font-size-lg);
          color: var(--text-secondary);
          margin: 0 0 24px 0;
        }
        
        .motivation-text {
          font-size: var(--font-size-md);
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .dashboard-card {
          background: var(--card-bg);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--card-border);
          transition: all var(--transition-normal);
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.4s forwards;
        }
        
        .dashboard-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .card-icon {
          font-size: 32px;
          margin-bottom: 16px;
          display: block;
        }
        
        .card-title {
          font-size: var(--font-size-xl);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }
        
        .card-description {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }
        
        .inspiration-section {
          background: var(--card-bg);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--card-border);
          text-align: center;
          opacity: 0;
          animation: fadeInUp 0.6s ease 0.6s forwards;
        }
        
        .inspiration-image {
          width: 100%;
          max-width: 400px;
          height: 200px;
          object-fit: cover;
          border-radius: var(--border-radius-md);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        
        .inspiration-caption {
          font-size: var(--font-size-lg);
          font-weight: 500;
          color: var(--text-primary);
          font-style: italic;
          margin: 0;
        }
        
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
        
        @media (max-width: 768px) {
          .dashboard-home-bg {
            padding: 20px 16px;
          }
          
          .welcome-section {
            padding: 24px;
            margin-bottom: 24px;
          }
          
          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .dashboard-card {
            padding: 20px;
          }
          
          .welcome-title {
            font-size: var(--font-size-xl);
          }
          
          .profile-avatar {
            width: 60px;
            height: 60px;
          }
        }
      </style>
      
      <div class="dashboard-home-bg">
        <div class="dashboard-container">
          <div class="welcome-section">
            <img class="profile-avatar" src="${avatarUrl}" alt="Avatar użytkownika" />
            <h1 class="welcome-title">Witaj, ${username}! 👋</h1>
            <p class="welcome-subtitle">Miło Cię widzieć w aplikacji Engolo</p>
            <p class="motivation-text">Każdy dzień to nowa szansa na naukę i rozwój. Wykorzystaj swój potencjał i osiągnij swoje cele!</p>
          </div>
          
          <div class="dashboard-grid">
            <div class="dashboard-card">
              <span class="card-icon">🎯</span>
              <h3 class="card-title">Wyzwania</h3>
              <p class="card-description">Rozwiązuj quizy i ćwiczenia językowe, aby rozwijać swoje umiejętności w języku angielskim.</p>
            </div>
            
            <div class="dashboard-card">
              <span class="card-icon">📊</span>
              <h3 class="card-title">Statystyki</h3>
              <p class="card-description">Śledź swój postęp, analizuj wyniki i zobacz jak daleko zaszedłeś w nauce.</p>
            </div>
            
            <div class="dashboard-card">
              <span class="card-icon">💬</span>
              <h3 class="card-title">Czat</h3>
              <p class="card-description">Komunikuj się z nauczycielem i innymi uczniami, wymieniaj się doświadczeniami.</p>
            </div>
            
            <div class="dashboard-card">
              <span class="card-icon">📚</span>
              <h3 class="card-title">Słownik</h3>
              <p class="card-description">Sprawdzaj znaczenia nowych słów i poszerzaj swoje słownictwo języka angielskiego.</p>
            </div>
          </div>
          
          <div class="inspiration-section">
            <img class="inspiration-image" src="${dashboardImg.url}" alt="Inspirujący obrazek" />
            <p class="inspiration-caption">${dashboardImg.caption}</p>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define("dashboard-home", DashboardHome);
