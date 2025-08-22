import { createStore, withProps } from "@ngneat/elf";

export interface AuthState {
  user: any | null;
}

export const authStore = createStore(
  { name: "auth" },
  withProps<AuthState>({ user: null })
);

// Helper to persist user to store
export function setUser(user: any | null) {
  console.log('Setting user in store:', user);
  authStore.update((state) => ({ ...state, user }));
  console.log('Store updated');
}

// Logout function: clears JWT from localStorage and user from store
export function logout() {
  localStorage.removeItem("strapi_jwt");
  authStore.update((state) => ({ ...state, user: null }));
}
