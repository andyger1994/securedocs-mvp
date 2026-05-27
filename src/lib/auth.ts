"use client";

export const AUTH_STORAGE_KEY = "security-docs-authenticated";
export const DEMO_USERNAME = "Liconex";
export const DEMO_PASSWORD = "Liconex";

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function login(username: string, password: string) {
  const valid = username === DEMO_USERNAME && password === DEMO_PASSWORD;
  if (valid) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
  }
  return valid;
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
