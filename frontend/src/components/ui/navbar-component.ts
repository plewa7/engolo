import { notificationService } from '../../features/notifications/notification.service';

export class NavbarComponent extends HTMLElement {
  static get observedAttributes() {
    return ["role", "current-section"];
  }

  role: string = "student";
  currentSection: string = "dashboard";
  sections: Array<{ key: string; label: string; icon: string }> = [];
  mobileMenuOpen: boolean = false;
  unreadNotifications: number = 0;

  connectedCallback() {
    this.updateSections();
    // Odczytaj sekcję z hash w URL, jeśli istnieje
    const hashSection = window.location.hash.replace("#", "");
    if (hashSection && this.sections.some((s) => s.key === hashSection)) {
      this.currentSection = hashSection;
      this.setAttribute("current-section", hashSection);
    } else {
      this.currentSection = "dashboard";
      this.setAttribute("current-section", "dashboard");
    }
    this.render();
    this.setupEventListeners();
    this.subscribeToNotifications();
  }

  attributeChangedCallback(name: string, newValue: string) {
    if (name === "role") {
      this.role = newValue;
      this.updateSections();
    }
    if (name === "current-section") {
      this.currentSection = newValue;
    }
    this.render();
  }

  updateSections() {
    if (this.role === "teacher") {
      this.sections = [
        { key: "challenges", label: "Wyzwania", icon: "📝" },
        { key: "chat", label: "Czat", icon: "💬" },
        { key: "stats", label: "Statystyki uczniów", icon: "📊" },
        { key: "dictionary", label: "Słownik", icon: "📚" },
        { key: "notifications", label: "Powiadomienia", icon: "🔔" },
      ];
    } else {
      this.sections = [
        { key: "challenges", label: "Wyzwania", icon: "🎯" },
        { key: "chat", label: "Czat", icon: "💬" },
        { key: "stats", label: "Statystyki", icon: "📊" },
        { key: "dictionary", label: "Słownik", icon: "📚" },
        { key: "notifications", label: "Powiadomienia", icon: "🔔" },
      ];
    }
  }

  setupEventListeners() {
    // Close mobile menu when window resizes
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeMobileMenu();
      }
    });
  }

  subscribeToNotifications() {
    notificationService.subscribe((notifications) => {
      this.unreadNotifications = notifications.filter(n => !n.read).length;
      this.updateNotificationBadges();
    });
  }

  updateNotificationBadges() {
    // Update desktop notification button
    const desktopBtn = this.querySelector('.nav-btn[data-section="notifications"]');
    if (desktopBtn) {
      this.updateNotificationButton(desktopBtn);
    }

    // Update mobile notification button
    const mobileBtn = this.querySelector('.mobile-nav-btn[data-section="notifications"]');
    if (mobileBtn) {
      this.updateNotificationButton(mobileBtn);
    }
  }

  updateNotificationButton(button: Element) {
    const existingBadge = button.querySelector('.notification-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    if (this.unreadNotifications > 0) {
      const badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.textContent = this.unreadNotifications > 99 ? '99+' : this.unreadNotifications.toString();
      button.appendChild(badge);
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    const mobileDropdown = this.querySelector('.mobile-dropdown');
    const hamburgerMenu = this.querySelector('.hamburger-menu');
    const mobileOverlay = this.querySelector('.mobile-overlay');
    
    if (mobileDropdown) {
      mobileDropdown.classList.toggle('open', this.mobileMenuOpen);
    }
    
    if (hamburgerMenu) {
      hamburgerMenu.classList.toggle('open', this.mobileMenuOpen);
    }
    
    if (mobileOverlay) {
      mobileOverlay.classList.toggle('open', this.mobileMenuOpen);
    }
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    const mobileDropdown = this.querySelector('.mobile-dropdown');
    const hamburgerMenu = this.querySelector('.hamburger-menu');
    const mobileOverlay = this.querySelector('.mobile-overlay');
    
    if (mobileDropdown) {
      mobileDropdown.classList.remove('open');
    }
    
    if (hamburgerMenu) {
      hamburgerMenu.classList.remove('open');
    }
    
    if (mobileOverlay) {
      mobileOverlay.classList.remove('open');
    }
    
    document.body.style.overflow = '';
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icons in both desktop and mobile
    const desktopThemeToggle = this.querySelector('.theme-toggle-btn .nav-icon');
    const mobileThemeToggle = this.querySelector('.mobile-theme-btn .nav-icon');
    const newIcon = newTheme === 'dark' ? '☀️' : '🌙';
    
    if (desktopThemeToggle) {
      desktopThemeToggle.textContent = newIcon;
    }
    if (mobileThemeToggle) {
      mobileThemeToggle.textContent = newIcon;
    }
  }

  render() {
    const nav = this.querySelector("nav.navbar");
    if (nav) {
      // Aktualizuj klasy aktywności przycisków
      nav.querySelectorAll(".nav-btn").forEach((btn) => {
        const section = btn.getAttribute("data-section");
        if (section === this.currentSection) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      return;
    }

    this.innerHTML = `
      <link rel="stylesheet" href="/src/styles/navbar.css">
      <nav class="navbar">
        <!-- Left: Brand -->
        <div class="navbar-left">
          <div class="navbar-brand" role="button" tabindex="0" aria-label="Przejdź do strony głównej">
            <div class="brand-mascot">🦉</div>
            <div class="brand-name">Engolo</div>
          </div>
        </div>
        
        <!-- Center: Navigation (Desktop) -->
        <div class="navbar-center">
          ${this.sections
            .map(
              (s) =>
                `<button class="nav-btn${
                  s.key === this.currentSection ? " active" : ""
                }" data-section="${s.key}">
                  <span class="nav-icon">${s.icon}</span>
                  <span class="nav-label">${s.label}</span>
                </button>`
            )
            .join("")}
        </div>
        
        <!-- Right: Theme + Logout (Desktop) -->
        <div class="navbar-right">
          <button class="theme-toggle-btn">
            <span class="nav-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
            <span class="nav-label">Motyw</span>
          </button>
          <button class="logout-btn">
            <span class="nav-icon">🚪</span>
            <span class="nav-label">Wyloguj</span>
          </button>
        </div>
        
        <!-- Mobile: Hamburger Menu -->
        <button class="hamburger-menu" aria-label="Toggle menu">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        
        <!-- Mobile: Dropdown Menu -->
        <div class="mobile-dropdown">
          ${this.sections
            .map(
              (s) =>
                `<button class="mobile-nav-btn${
                  s.key === this.currentSection ? " active" : ""
                }" data-section="${s.key}">
                  <span class="nav-icon">${s.icon}</span>
                  <span class="nav-label">${s.label}</span>
                </button>`
            )
            .join("")}
          <button class="mobile-theme-btn">
            <span class="nav-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
            <span class="nav-label">Motyw</span>
          </button>
          <button class="mobile-logout-btn">
            <span class="nav-icon">🚪</span>
            <span class="nav-label">Wyloguj</span>
          </button>
        </div>
      </nav>
      <div class="mobile-overlay"></div>
    `;
    
    // Add brand click listener
    this.querySelector('.navbar-brand')?.addEventListener('click', () => {
      if (this.currentSection !== 'dashboard') {
        this.currentSection = 'dashboard';
        this.setAttribute('current-section', 'dashboard');
        window.location.hash = 'dashboard';
        this.closeMobileMenu();
        this.dispatchEvent(
          new CustomEvent("navigate", {
            detail: { section: 'dashboard' },
            bubbles: true,
          })
        );
      }
    });

    // Add keyboard support for brand
    this.querySelector('.navbar-brand')?.addEventListener('keydown', (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;
      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        e.preventDefault();
        if (this.currentSection !== 'dashboard') {
          this.currentSection = 'dashboard';
          this.setAttribute('current-section', 'dashboard');
          window.location.hash = 'dashboard';
          this.closeMobileMenu();
          this.dispatchEvent(
            new CustomEvent("navigate", {
              detail: { section: 'dashboard' },
              bubbles: true,
            })
          );
        }
      }
    });
    
    // Add navigation listeners (desktop)
    this.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = (e.currentTarget as HTMLElement).dataset.section;
        if (section && section !== this.currentSection) {
          this.currentSection = section;
          this.setAttribute("current-section", section);
          window.location.hash = section;
          this.closeMobileMenu();
        }
        this.dispatchEvent(
          new CustomEvent("navigate", {
            detail: { section },
            bubbles: true,
          })
        );
      });
    });

    // Add navigation listeners (mobile)
    this.querySelectorAll(".mobile-nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = (e.currentTarget as HTMLElement).dataset.section;
        if (section && section !== this.currentSection) {
          this.currentSection = section;
          this.setAttribute("current-section", section);
          window.location.hash = section;
          this.closeMobileMenu();
        }
        this.dispatchEvent(
          new CustomEvent("navigate", {
            detail: { section },
            bubbles: true,
          })
        );
      });
    });

    // Theme toggle listeners (desktop + mobile)
    this.querySelector(".theme-toggle-btn")?.addEventListener("click", () => {
      this.toggleTheme();
    });
    
    this.querySelector(".mobile-theme-btn")?.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Logout listeners (desktop + mobile)
    this.querySelector(".logout-btn")?.addEventListener("click", () => {
      this.closeMobileMenu();
      this.dispatchEvent(new CustomEvent("logout", { bubbles: true }));
    });
    
    this.querySelector(".mobile-logout-btn")?.addEventListener("click", () => {
      this.closeMobileMenu();
      this.dispatchEvent(new CustomEvent("logout", { bubbles: true }));
    });

    // Hamburger menu toggle
    this.querySelector(".hamburger-menu")?.addEventListener("click", () => {
      this.toggleMobileMenu();
    });

    // Mobile overlay click to close
    this.querySelector(".mobile-overlay")?.addEventListener("click", () => {
      this.closeMobileMenu();
    });

    this.setupEventListeners();
  }
}

customElements.define("navbar-component", NavbarComponent);
