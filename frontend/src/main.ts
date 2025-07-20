import "./components/auth-form";
import { authStore } from "./features/auth/auth.store";

function renderHome() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `<div class="auth-form-wrapper"><auth-form></auth-form></div>`;
}

// Po zalogowaniu przekieruj do app.html
function redirectToApp() {
  window.location.href = "/app.html";
}

// Subskrybuj zmiany stanu auth

authStore.subscribe((state) => {
  const jwt = localStorage.getItem("strapi_jwt");
  if (jwt && state.user) {
    redirectToApp();
  } else {
    renderHome();
  }
});

// Inicjalizacja
renderHome();
