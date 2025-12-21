import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue'),
            meta: { guestOnly: true }
        },
        {
            path: '/',
            name: 'dashboard',
            component: () => import('../views/Dashboard.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/room/:id',
            name: 'room',
            component: () => import('../views/Room.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    if (authStore.loading) {
        await authStore.init()
    }

    const user = authStore.user

    if (to.meta.requiresAuth && !user) {
        next({ name: 'login' });
    } else if (to.meta.guestOnly && user) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router
