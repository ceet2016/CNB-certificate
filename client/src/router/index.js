import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/Home.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { guestOnly: true } },
  { path: '/certificates', name: 'CertTypes', component: () => import('../views/CertTypes.vue') },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { auth: true } },
  { path: '/submit-work', name: 'SubmitWork', component: () => import('../views/SubmitWork.vue'), meta: { auth: true, approved: true } },
  { path: '/my-works', name: 'MyWorks', component: () => import('../views/MyWorks.vue'), meta: { auth: true, approved: true } },
  { path: '/my-certificates', name: 'MyCerts', component: () => import('../views/MyCerts.vue'), meta: { auth: true, approved: true } },
  { path: '/verify/:certNumber?', name: 'Verify', component: () => import('../views/Verify.vue') },
  { path: '/admin', name: 'Admin', component: () => import('../views/Admin.vue'), meta: { auth: true, admin: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.auth && !auth.isLoggedIn) {
    return next('/login');
  }
  if (to.meta.admin && !auth.isAdmin) {
    return next('/dashboard');
  }
  if (to.meta.approved && auth.isLoggedIn && !auth.isApproved) {
    // Non-approved users can only see dashboard (which shows a pending notice)
    return next('/dashboard');
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return next('/dashboard');
  }
  next();
});

export default router;
