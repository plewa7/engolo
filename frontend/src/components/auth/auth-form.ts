import "../../styles/auth-form.css";
import { html, render } from "lit-html";
import { login, register } from "../../features/auth/auth.service";
import { authStore } from "../../features/auth/auth.store";

class AuthForm extends HTMLElement {
  private mode: "login" | "register" = "login";
  private errorMsg: string = "";
  private successMsg: string = "";

  connectedCallback() {
    this.render();
  }

  switchMode(mode: "login" | "register") {
    this.mode = mode;
    this.errorMsg = "";
    this.successMsg = "";
    this.render();
  }

  setError(msg: string) {
    this.errorMsg = msg;
    this.successMsg = "";
    this.render();
  }

  setSuccess(msg: string) {
    this.successMsg = msg;
    this.errorMsg = "";
    this.render();
  }

  render() {
    render(
      html`
        <div class="auth-form-card">
          <div class="auth-form-tabs">
            <button
              class="tab-btn"
              @click=${() => this.switchMode("login")}
              ?disabled=${this.mode === "login"}
            >
              Logowanie
            </button>
            <button
              class="tab-btn"
              @click=${() => this.switchMode("register")}
              ?disabled=${this.mode === "register"}
            >
              Rejestracja
            </button>
          </div>
          ${this.errorMsg
            ? html`<div class="auth-error">${this.errorMsg}</div>`
            : ""}
          ${this.successMsg
            ? html`<div class="auth-success">${this.successMsg}</div>`
            : ""}
          <form id="${this.mode}-form" class="auth-form-fields">
            ${this.mode === "register"
              ? html`
                  <input
                    name="username"
                    placeholder="Nazwa użytkownika"
                    required
                  />
                  <input name="email" placeholder="Email" required />
                  <input
                    name="password"
                    type="password"
                    placeholder="Hasło"
                    required
                  />
                  <button type="submit">Zarejestruj</button>
                `
              : html`
                  <input name="identifier" placeholder="Email" required />
                  <input
                    name="password"
                    type="password"
                    placeholder="Hasło"
                    required
                  />
                  <button type="submit">Zaloguj</button>
                `}
          </form>
        </div>
      `,
      this
    );
    this.querySelector("#login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Rozróżnienie: czy użytkownik jest na zakładce logowania
      if (this.mode !== "login") return;
      this.errorMsg = "";
      this.successMsg = "";
      this.render();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      login(formData).subscribe({
        next: (res) => {
          authStore.update(() => ({ jwt: res.jwt, user: res.user }));
          window.location.href = "app.html";
        },
        error: (err) => {
          if (this.mode === "login") {
            let msg = err?.response?.error?.message || "Unknown error";
            if (msg === "Invalid identifier or password") {
              msg = "Invalid email or password.";
            } else if (msg === "Missing required parameter(s)") {
              msg = "Please fill in all required fields.";
            }
            this.setError(`Login failed: ${msg}`);
          }
        },
      });
    });
    this.querySelector("#register-form")?.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        this.errorMsg = "";
        this.successMsg = "";
        this.render();
        register(formData).subscribe({
          next: (_) => {
            this.errorMsg = "";
            this.successMsg = "Registration successful! You can now log in.";
            this.render();
          },
          error: (err) =>
            this.setError(
              "Registration failed: " +
                (err?.response?.error?.message || "Unknown error")
            ),
        });
      }
    );
    (window as any).logout = () => {
      localStorage.removeItem("jwt");
      authStore.update(() => ({ jwt: null, user: null }));
      window.location.href = "/";
    };
  }
}

customElements.define("auth-form", AuthForm);
