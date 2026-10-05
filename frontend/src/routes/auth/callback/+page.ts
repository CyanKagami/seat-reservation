// src/routes/auth/callback/+page.js
import { saveToken } from '$lib/scripts/auth';

export const prerender = false; // dynamic route, not known at build time

export function load() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.hash.slice(1)); // strip leading '#'
    const token = params.get('token');
    console.log('Token from callback:', token);
    if (token) {
      saveToken(token);
      window.location.replace('/'); // go to the app, and replace() drops the token from history
    } else {
      window.location.replace('/login?error=no_token');
    }
  }
}