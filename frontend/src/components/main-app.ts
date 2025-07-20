export class MainApp extends HTMLElement {
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
    this.render(user);
  }

  render(user: any) {
    this.innerHTML = `
      <navbar-component></navbar-component>
      ${
        user.role?.name === "teacher"
          ? "<teacher-dashboard></teacher-dashboard>"
          : "<student-dashboard></student-dashboard>"
      }
    `;
    this.querySelector("navbar-component")?.addEventListener("logout", () => {
      import("../features/auth/auth.store.ts").then(({ logout }) => {
        logout();
        window.location.replace("index.html");
      });
    });
  }
}

customElements.define("main-app", MainApp);
