import { setUser } from "./auth.store";

export async function fetchUser(jwtKey = "strapi_jwt") {
  const jwt = localStorage.getItem(jwtKey);
  if (!jwt) return null;
  try {
    const res = await fetch(
      "http://localhost:1337/api/users/me?populate=role",
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    if (!res.ok) throw new Error("Unauthorized");
    const user = await res.json();
    setUser(user);
    return user;
  } catch (e) {
    localStorage.removeItem(jwtKey);
    setUser(null);
    return null;
  }
}
