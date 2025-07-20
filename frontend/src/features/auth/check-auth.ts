// frontend/src/features/auth/check-auth.ts

// Sprawdza ważność JWT przez próbę pobrania danych użytkownika z backendu
export async function checkAuth(jwtKey = "strapi_jwt") {
  const jwt = localStorage.getItem(jwtKey);
  if (!jwt) return false;
  try {
    const res = await fetch("http://localhost:1337/api/users/me", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return true;
  } catch (e) {
    localStorage.removeItem(jwtKey);
    return false;
  }
}
