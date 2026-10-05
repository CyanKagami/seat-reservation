// src/lib/auth.js
import { PUBLIC_API_URL } from '$env/static/public';

const TOKEN_KEY = 'token';

export function saveToken(token:string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function loginWithGoogle() {
  // Sends the browser to your backend's OAuth-kickoff route,
  // which redirects to Google, which redirects back to your
  // backend's callback, which finally redirects here with the token.
  window.location.href = `${PUBLIC_API_URL}/auth/google`;
}

export async function logout() {
  clearToken();
  // Optional: tell the backend too, though JWTs are stateless
  // so this call isn't strictly necessary for logout to "work."
  try {
    await fetch(`${PUBLIC_API_URL}/auth/logout`, { method: 'POST' });
  } catch {
    // ignore — logout should succeed client-side regardless
  }
}