import { createStore, withProps } from "@ngneat/elf";

const JWT_KEY = "strapi_jwt";

export interface AuthState {
  jwt: string | null;
  user: any | null;
}

// Try to load JWT from localStorage on init
const initialJwt =
  typeof window !== "undefined" ? localStorage.getItem(JWT_KEY) : null;

export const authStore = createStore(
  { name: "auth" },
  withProps<AuthState>({ jwt: initialJwt, user: null })
);

// Helper to persist JWT to localStorage
export function setJwt(jwt: string | null) {
  authStore.update((state) => ({ ...state, jwt }));
  if (jwt) {
    localStorage.setItem(JWT_KEY, jwt);
  } else {
    localStorage.removeItem(JWT_KEY);
  }
}

// Logout function: clears JWT from store and localStorage
export function logout() {
  // Najpierw usuń JWT z localStorage
  localStorage.removeItem(JWT_KEY);
  // Wyczyść stan w store
  authStore.update((state) => ({ ...state, jwt: null, user: null }));
}
