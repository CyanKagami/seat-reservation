import { browser } from '$app/environment';
import { logout } from '$lib/scripts/auth';
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
            logout()
        }
    }
}

export const userStore = new UserStore();