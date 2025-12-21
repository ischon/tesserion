import { defineStore } from 'pinia'
import { auth, googleProvider } from '../firebase'
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: true
    }),
    getters: {
        isAuthenticated: (state) => !!state.user,
        userDomain: (state) => state.user?.email?.split('@')[1] || null
    },
    actions: {
        async login() {
            try {
                await signInWithRedirect(auth, googleProvider)
            } catch (error) {
                console.error("Login failed", error)
            }
        },
        async logout() {
            try {
                await signOut(auth)
                this.user = null
            } catch (error) {
                console.error("Logout failed", error)
            }
        },
        init() {
            return new Promise((resolve) => {
                onAuthStateChanged(auth, async (user) => {
                    if (!user) {
                        try {
                            const result = await getRedirectResult(auth)
                            if (result) {
                                this.user = result.user
                            }
                        } catch (error) {
                            console.error("Redirect login error", error)
                        }
                    } else {
                        this.user = user
                    }
                    this.loading = false
                    resolve(this.user)
                })
            })
        }
    }
})

