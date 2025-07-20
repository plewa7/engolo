export class MainApp extends HTMLElement {
  private user: any = null;
  private currentSection: string = "dashboard";

  async connectedCallback() {
    const { authStore } = await import("../features/auth/auth.store.ts");
    const { fetchUser } = await import("../features/auth/fetch-user.ts");
    const jwt = localStorage.getItem("strapi_jwt");
    if (!jwt) {
      window.location.replace("index.html");
      return;
    }
    let user = authStore.getValue().user;
    if (!user) {
      user = await fetchUser();
    }
    if (!user) {
      window.location.replace("index.html");
      return;
    }
    this.user = user;
    // Odczytaj sekcję z hash w URL
    const hashSection = window.location.hash.replace("#", "");
    if (hashSection) {
      this.currentSection = hashSection;
    } else {
      this.currentSection = "dashboard";
    }
    this.render();
  }

  render() {
    this.innerHTML = `
      <navbar-component role="${
        this.user.role?.name || "student"
      }" current-section="${this.currentSection}"></navbar-component>
      <div id="spa-content"></div>
    `;
    const navbar = this.querySelector("navbar-component");
    if (navbar) {
      navbar.addEventListener("navigate", (e: any) => {
        this.currentSection = e.detail.section;
        // Synchronizuj aktualną sekcję z navbar
        navbar.setAttribute("current-section", this.currentSection);
        this.renderSection();
      });
      navbar.addEventListener("logout", () => {
        import("../features/auth/auth.store.ts").then(({ logout }) => {
          logout();
          window.location.replace("index.html");
        });
      });
    }
    this.renderSection();
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
