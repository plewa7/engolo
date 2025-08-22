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
    
    // Update form content without full re-render
    const form = this.querySelector('form');
    if (form) {
      form.id = mode === 'login' ? 'login-form' : 'register-form';
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się';
      }
    }
    
    // Update tab indicator
    const indicator = this.querySelector('.tab-indicator');
    if (indicator) {
      if (mode === 'register') {
        indicator.classList.add('register');
      } else {
        indicator.classList.remove('register');
      }
    }
    
    // Update disabled states
    const tabs = this.querySelectorAll('.tab-btn');
    tabs.forEach((tab, index) => {
      const isActive = (index === 0 && mode === 'login') || (index === 1 && mode === 'register');
      (tab as HTMLButtonElement).disabled = isActive;
    });
    
    this.updateDisplay();
  }

  setError(msg: string) {
    this.errorMsg = msg;
    this.successMsg = "";
    this.updateDisplay();
  }

  setSuccess(msg: string) {
    this.successMsg = msg;
    this.errorMsg = "";
    this.updateDisplay();
  }

  updateDisplay() {
    // Update error/success messages without full re-render
    const errorDiv = this.querySelector('.auth-error');
    const successDiv = this.querySelector('.auth-success');
    
    if (this.errorMsg) {
      if (errorDiv) {
        errorDiv.textContent = this.errorMsg;
      } else {
        const newErrorDiv = document.createElement('div');
        newErrorDiv.className = 'auth-error';
        newErrorDiv.textContent = this.errorMsg;
        const tabs = this.querySelector('.auth-form-tabs');
        if (tabs) {
          tabs.parentNode?.insertBefore(newErrorDiv, tabs.nextSibling);
        }
      }
    } else if (errorDiv) {
      errorDiv.remove();
    }

    if (this.successMsg) {
      if (successDiv) {
        successDiv.textContent = this.successMsg;
      } else {
        const newSuccessDiv = document.createElement('div');
        newSuccessDiv.className = 'auth-success';
        newSuccessDiv.textContent = this.successMsg;
        const tabs = this.querySelector('.auth-form-tabs');
        if (tabs) {
          tabs.parentNode?.insertBefore(newSuccessDiv, tabs.nextSibling);
        }
      }
    } else if (successDiv) {
      successDiv.remove();
    }
  }

  toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    const button = this.querySelector('.theme-toggle-auth');
    if (button) {
      const icon = button.querySelector('.toggle-icon');
      if (icon) {
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      }
    }
  }

  render() {
    render(
      html`
        <div class="auth-form-card">
          <button class="theme-toggle-auth" @click=${this.toggleTheme} title="Zmień motyw">
            <span class="toggle-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
          </button>
          
          <div class="auth-logo">
            <div class="auth-mascot">🦉</div>
            <h1>Engolo</h1>
          </div>
          
          <div class="auth-form-tabs">
            <div class="tab-indicator ${this.mode === 'register' ? 'register' : ''}"></div>
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
                  <button type="submit">Zarejestruj się</button>
                `
              : html`
                  <input name="identifier" placeholder="Email" required />
                  <input
                    name="password"
                    type="password"
                    placeholder="Hasło"
                    required
                  />
                  <button type="submit">Zaloguj się</button>
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
      this.updateDisplay();
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
        this.updateDisplay();
        register(formData).subscribe({
          next: (_) => {
            this.errorMsg = "";
            this.successMsg = "Registration successful! You can now log in.";
            this.updateDisplay();
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
