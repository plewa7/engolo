import { checkAuth } from "./features/auth/check-auth.ts";
import { logout, authStore } from "./features/auth/auth.store.ts";
import { fetchUser } from "./features/auth/fetch-user.ts";

const JWT_KEY = "strapi_jwt";
const appContainer = document.getElementById("app-container");
const userLogin = document.getElementById("user-login");
const userRole = document.getElementById("user-role");

(async () => {
  const ok = await checkAuth(JWT_KEY);
  if (!ok) {
    window.location.replace("/");
    return;
  }
  // Pobierz dane użytkownika
  const user = await fetchUser(JWT_KEY);
  if (!user) {
    window.location.replace("/");
    return;
  }
  if (userLogin) userLogin.textContent = user.username || user.email || "";
  if (userRole) userRole.textContent = user.role?.name || "brak roli";
  appContainer!.style.display = "block";
})();

document.getElementById("logout-btn")?.addEventListener("click", function () {
  logout();
  window.location.replace("/");
});
