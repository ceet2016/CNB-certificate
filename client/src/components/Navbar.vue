<template>
  <nav class="sticky top-0 z-40 glass border-b border-white/40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2.5 group">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105"
               style="background: linear-gradient(135deg, #4F46E5, #312E81); box-shadow: 0 4px 12px -2px rgba(79,70,229,0.4);">
            C
          </div>
          <div class="hidden sm:block">
            <div class="text-base font-bold text-slate-800 leading-tight">CNB亚洲互联网学院</div>
            <div class="text-xs text-cnb-500 leading-tight">CNB Asia Internet Academy</div>
          </div>
        </router-link>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-1">
          <router-link to="/" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cnb-700 hover:bg-cnb-50/50 transition">首页</router-link>
          <router-link to="/certificates" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cnb-700 hover:bg-cnb-50/50 transition">证书类型</router-link>
          <router-link to="/verify" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cnb-700 hover:bg-cnb-50/50 transition">证书验证</router-link>
          <template v-if="auth.isLoggedIn">
            <router-link to="/dashboard" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cnb-700 hover:bg-cnb-50/50 transition">控制台</router-link>
            <router-link v-if="auth.isAdmin" to="/admin" class="px-4 py-2 rounded-lg text-sm font-medium text-cnb-gold hover:bg-amber-50/50 transition">管理后台</router-link>
            <div class="relative ml-2" ref="menuRef">
              <button @click="menuOpen = !menuOpen" class="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-900/5 transition">
                <div class="w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-bold"
                     style="background: linear-gradient(135deg, #6366F1, #4338CA);">
                  {{ auth.user?.username?.charAt(0).toUpperCase() }}
                </div>
                <span class="text-sm font-medium text-slate-700">{{ auth.user?.username }}</span>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div v-if="menuOpen" class="absolute right-0 mt-2 w-52 rounded-xl shadow-lg py-1.5 animate-scale-in glass border border-white/60">
                <router-link to="/dashboard" @click="menuOpen = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-cnb-50/50 transition">
                  <span class="text-slate-400">📊</span> 控制台
                </router-link>
                <router-link to="/my-works" @click="menuOpen = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-cnb-50/50 transition">
                  <span class="text-slate-400">📁</span> 我的作品
                </router-link>
                <router-link to="/my-certificates" @click="menuOpen = false" class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-cnb-50/50 transition">
                  <span class="text-slate-400">📜</span> 我的证书
                </router-link>
                <hr class="my-1.5 border-slate-200/50" />
                <button @click="handleLogout" class="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 transition">
                  <span>🚪</span> 退出登录
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cnb-700 hover:bg-cnb-50/50 transition">登录</router-link>
            <router-link to="/register" class="btn-primary text-sm">免费注册</router-link>
          </template>
        </div>

        <!-- Mobile menu button -->
        <button @click="mobileOpen = !mobileOpen" class="md:hidden p-2 rounded-lg hover:bg-slate-900/5">
          <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileOpen" class="md:hidden border-t border-white/30 glass">
      <div class="px-4 py-3 space-y-1">
        <router-link to="/" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg hover:bg-cnb-50/50 text-sm text-slate-600">首页</router-link>
        <router-link to="/certificates" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg hover:bg-cnb-50/50 text-sm text-slate-600">证书类型</router-link>
        <router-link to="/verify" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg hover:bg-cnb-50/50 text-sm text-slate-600">证书验证</router-link>
        <template v-if="auth.isLoggedIn">
          <router-link to="/dashboard" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg hover:bg-cnb-50/50 text-sm text-slate-600">控制台</router-link>
          <router-link v-if="auth.isAdmin" to="/admin" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg hover:bg-amber-50/50 text-sm text-cnb-gold">管理后台</router-link>
          <button @click="handleLogout" class="block w-full text-left px-3 py-2 rounded-lg hover:bg-red-50/50 text-sm text-red-600">退出登录</button>
        </template>
        <template v-else>
          <router-link to="/login" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg hover:bg-cnb-50/50 text-sm text-slate-600">登录</router-link>
          <router-link to="/register" @click="mobileOpen = false" class="block px-3 py-2 rounded-lg text-white text-sm text-center" style="background: linear-gradient(135deg, #4F46E5, #4338CA);">免费注册</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const mobileOpen = ref(false);
const menuOpen = ref(false);
const menuRef = ref(null);

const handleLogout = () => {
  auth.logout();
  menuOpen.value = false;
  mobileOpen.value = false;
  router.push('/');
};

const handleClickOutside = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>
