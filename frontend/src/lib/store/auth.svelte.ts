import { browser } from '$app/environment';
import type { User } from "$lib/type/user";

class UserStore {
    user: User | null = $state(null);
    
    get isAuthenticated() {
        return this.user !== null;
    }

    get currentUser() {
        return this.user;
    }
    // Call this after Lambda authenticates the Google payload
    setUser(user:User | null) {
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