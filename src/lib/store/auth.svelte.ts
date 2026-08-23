import type { GoogleUser } from "$lib/type/googleUser";
import { browser } from '$app/environment';

class UserStore {
    user: GoogleUser | null = $state(null);
    
    get isAuthenticated() {
        return this.user !== null;
    }

    get currentUser() {
        return this.user;
    }
    // Call this after Lambda authenticates the Google payload
    setUser(user:GoogleUser | null) {
        this.user = user;
    }

    logout() {
        if (browser) {
            fetch('/api/auth/google/', { method: 'DELETE', credentials: 'include' }).finally(() => {
                this.user = null;
            });
        }
    }
}

export const userStore = new UserStore();