import { authStore } from "../features/auth/auth.store";

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
        const { fetchUser } = await import("../features/auth/fetch-user.ts");
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
      <div class="dashboard-home-bg" style="padding-bottom: 36px;">
        <div style="display: flex; align-items: center; gap: 18px; justify-content: center; margin-bottom: 18px;">
          <img src="${avatarUrl}" alt="Avatar" class="dashboard-home-img" style="width: 70px; height: 70px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); background: #fff;" />
          <div style="text-align: left;">
            <h2 style="margin: 0 0 4px 0; font-size: 2em; color: #3a3a5a;">Panel główny</h2>
            <p style="margin: 0; color: #666; font-size: 1.1em;">Cześć, <b>${username}</b>!</p>
          </div>
        </div>
        <div style="position: relative;">
          <img src="${dashboardImg.url}" alt="Dashboard" class="dashboard-main-img" style="max-width: 420px; width: 100%; margin: 0 auto; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); display: block;" />
          <div style="position: absolute; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.92); border-radius: 0 0 18px 18px; padding: 12px 18px; font-size: 1.13em; color: #2a2a3a; font-weight: 500; text-align: center; letter-spacing: 0.01em;">${dashboardImg.caption}</div>
        </div>
        <div style="margin-top: 32px; text-align: center;">
          <p style="font-size: 1.15em; color: #3a3a5a; margin-bottom: 10px;">Zacznij dzień od nowej porcji wiedzy, sprawdź wyzwania lub napisz do nauczyciela!</p>
          <p style="color: #888; font-size: 1em;">Pamiętaj: systematyczność to klucz do sukcesu. Powodzenia!</p>
        </div>
      </div>
    `;
  }
}
customElements.define("dashboard-home", DashboardHome);
