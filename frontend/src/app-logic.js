document.addEventListener("DOMContentLoaded", function () {
  const JWT_KEY = "strapi_jwt";
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      // Usuń JWT z localStorage niezależnie od window.logout
      localStorage.removeItem(JWT_KEY);
      window.location.href = "/";
    });
  }
});
