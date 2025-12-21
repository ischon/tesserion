import { createRouter, createWebHistory } from 'vue-router'
import { auth } from './firebase'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('./views/Login.vue'),
            meta: { guestOnly: true }
        },
        {
            path: '/',
            name: 'dashboard',
            component: () => import('./views/Dashboard.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/room/:id',
            name: 'room',
            component: () => import('./views/Room.vue'),
            meta: { requiresAuth: true }
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const user = await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });

    if (to.meta.requiresAuth && !user) {
        next({ name: 'login' });
    } else if (to.meta.guestOnly && user) {
        next({ name: 'dashboard' });
    } else {
        next();
    }
});

export default router
