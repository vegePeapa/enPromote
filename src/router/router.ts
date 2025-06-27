import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/login.vue'),
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('../views/register.vue'),
        },
        {
            path: '/',
            name: 'Home',
            component: () => import('../views/home.vue'),
        },
        {
            path: '/vocabulary',
            name: 'Vocabulary',
            component: () => import('../views/home.vue'), // 暂时指向首页，后续开发
        },
        {
            path: '/grammar',
            name: 'Grammar',
            component: () => import('../views/home.vue'), // 暂时指向首页，后续开发
        },
        {
            path: '/reading',
            name: 'Reading',
            component: () => import('../views/home.vue'), // 暂时指向首页，后续开发
        },
        {
            path: '/listening',
            name: 'Listening',
            component: () => import('../views/home.vue'), // 暂时指向首页，后续开发
        },
    ]
})
export default router