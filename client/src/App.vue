<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1">
      <router-view />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
import SiteFooter from './components/Footer.vue';
import { useAuthStore } from './stores/auth';
import { onMounted } from 'vue';

const auth = useAuthStore();
onMounted(() => {
  if (auth.token) auth.fetchMe();
});
</script>
