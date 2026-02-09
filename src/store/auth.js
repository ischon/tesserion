import { defineStore } from 'pinia'
import { auth, googleProvider, microsoftProvider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged, OAuthProvider } from 'firebase/auth'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: true,
        customPhotoURL: localStorage.getItem('customPhotoURL') || null
    }),
    getters: {
        isAuthenticated: (state) => !!state.user,
        userDomain: (state) => state.user?.email?.split('@')[1] || null,
        photoURL: (state) => state.customPhotoURL || state.user?.photoURL || null,
        isPublicDomain: (state) => {
            const domain = state.user?.email?.split('@')[1]?.toLowerCase()
            if (!domain) return true

            // Extract the main part of the domain (e.g., 'hotmail' from 'hotmail.nl' or 'hotmail.com')
            const domainParts = domain.split('.')
            const domainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0]

            const publicDomainNames = [
                'gmail', 'outlook', 'hotmail', 'live', 'icloud',
                'yahoo', 'msn', 'protonmail', 'proton', 'aol',
                'me', 'mac', 'googlemail'
            ]

            return publicDomainNames.includes(domainName)
        }
    },
    actions: {
        async login(providerName = 'google') {
            try {
                const provider = providerName === 'microsoft' ? microsoftProvider : googleProvider
                const result = await signInWithPopup(auth, provider)
                this.user = result.user

                if (providerName === 'microsoft') {
                    const credential = OAuthProvider.credentialFromResult(result)
                    if (credential?.accessToken) {
                        await this.fetchMicrosoftPhoto(credential.accessToken)
                    }
                }
            } catch (error) {
                console.error("Login failed", error)
            }
        },
        async fetchMicrosoftPhoto(token) {
            try {
                const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (response.ok) {
                    const blob = await response.blob()
                    const url = URL.createObjectURL(blob)
                    this.customPhotoURL = url
                    localStorage.setItem('customPhotoURL', url)
                }
            } catch (error) {
                console.error("Failed to fetch Microsoft photo", error)
            }
        },
        async logout() {
            try {
                await signOut(auth)
                this.user = null
                this.customPhotoURL = null
                localStorage.removeItem('customPhotoURL')
            } catch (error) {
                console.error("Logout failed", error)
            }
        },
        init() {
            return new Promise((resolve) => {
                onAuthStateChanged(auth, (user) => {
                    this.user = user
                    this.loading = false
                    resolve(user)
                })
            })
        }
    }
})

