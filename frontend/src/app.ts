import { checkAuth } from "./features/auth/check-auth.ts";
import { logout } from "./features/auth/auth.store.ts";

const JWT_KEY = "strapi_jwt";
const appContainer = document.getElementById("app-container");

(async () => {
  const ok = await checkAuth(JWT_KEY);
  if (!ok) {
    window.location.replace("/");
  } else {
    appContainer!.style.display = "block";
  }
})();

document.getElementById("logout-btn")?.addEventListener("click", function () {
  logout();
  window.location.replace("/");
});
