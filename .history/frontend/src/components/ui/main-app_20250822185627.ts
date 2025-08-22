export class MainApp extends HTMLElement {
  private user: any = null;
  private currentSection: string = "dashboard";

  async connectedCallback() {
    // Initialize theme from localStorage
    this.initializeTheme();
    
    const { authStore } = await import("../../features/auth/auth.store");
    const { fetchUser } = await import("../../features/auth/fetch-user");
    const jwt = localStorage.getItem("strapi_jwt");
    console.log('MainApp - JWT exists:', !!jwt);
    
    if (!jwt) {
      console.log('No JWT found, redirecting to login');
      window.location.replace("index.html");
      return;
    }
    
    let user = authStore.getValue().user;
    console.log('MainApp - User from store:', user);
    
    if (!user) {
      console.log('No user in store, fetching from API');
      user = await fetchUser();
      console.log('MainApp - User fetched:', user);
    }
    
    if (!user) {
      console.log('No user found, redirecting to login');
      window.location.replace("index.html");
      return;
    }
    
    this.user = user;
    console.log('MainApp - User set:', this.user);
    // Odczytaj sekcję z hash w URL
    const hashSection = window.location.hash.replace("#", "");
    if (hashSection) {
      this.currentSection = hashSection;
    } else {
      this.currentSection = "dashboard";
    }
    this.render();
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  render() {
    this.innerHTML = `
      <!-- Navigation -->
      <navbar-component role="${
        this.user.role?.name || "student"
      }" current-section="${this.currentSection}"></navbar-component>
      
      <!-- Main content -->
      <div id="spa-content"></div>
    `;
    
    // Setup navigation
    const navbar = this.querySelector("navbar-component");
    if (navbar) {
      navbar.addEventListener("navigate", (e: any) => {
        this.currentSection = e.detail.section;
        // Synchronizuj aktualną sekcję z navbar
        navbar.setAttribute("current-section", this.currentSection);
        this.renderSection();
      });
      navbar.addEventListener("logout", () => {
        import("../../features/auth/auth.store").then(({ logout }) => {
          logout();
          window.location.replace("index.html");
        });
      });
    }

    this.renderSection();
  }

  addThemeToggleToBody() {
    // Remove existing theme toggle
    const existingToggle = document.querySelector('.theme-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }
    
    // Create new theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Toggle dark mode');
    
    // Set initial icon
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    
    // Add event listener
    themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Add to body
    document.body.appendChild(themeToggle);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icon
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  disconnectedCallback() {
    // Clean up theme toggle when component is removed
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.remove();
    }
  }

  renderSection() {
    const content = this.querySelector("#spa-content");
    if (!content) return;
    // Renderuj dashboard z atrybutem section
    if (this.user.role?.name === "teacher") {
      content.innerHTML = `<teacher-dashboard section="${this.currentSection}"></teacher-dashboard>`;
    } else {
      content.innerHTML = `<student-dashboard section="${this.currentSection}"></student-dashboard>`;
    }
  }
}

customElements.define("main-app", MainApp);
