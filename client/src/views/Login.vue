<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Decorative background -->
    <div class="absolute inset-0">
      <div class="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: #6366F1;"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15" style="background: #C18F2E;"></div>
    </div>

    <div class="card w-full max-w-md p-8 relative">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4"
             style="background: linear-gradient(135deg, #4F46E5, #312E81); box-shadow: 0 8px 20px -4px rgba(79,70,229,0.35);">
          C
        </div>
        <h1 class="text-2xl font-bold text-slate-800">欢迎回来</h1>
        <p class="text-sm text-slate-500 mt-1">登录 CNB 亚洲互联网学院</p>
      </div>

      <!-- Pending approval notice -->
      <div v-if="pendingNotice" class="mb-4 p-4 rounded-xl flex items-start gap-3"
           style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
        <span class="text-xl flex-shrink-0">⏳</span>
        <div>
          <div class="text-sm font-medium text-amber-800">账号待审核</div>
          <div class="text-xs text-amber-600 mt-1">您的账号正在等待管理员审核，审核通过后即可登录。</div>
        </div>
      </div>

      <!-- Rejected notice -->
      <div v-if="rejectedNotice" class="mb-4 p-4 rounded-xl flex items-start gap-3"
           style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);">
        <span class="text-xl flex-shrink-0">🚫</span>
        <div>
          <div class="text-sm font-medium text-red-800">注册被拒绝</div>
          <div class="text-xs text-red-600 mt-1">您的注册申请已被管理员拒绝，如有疑问请联系管理员。</div>
        </div>
      </div>

      <!-- Locked notice -->
      <div v-if="lockedNotice" class="mb-4 p-4 rounded-xl flex items-start gap-3"
           style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);">
        <span class="text-xl flex-shrink-0">🔒</span>
        <div>
          <div class="text-sm font-medium text-red-800">登录已被锁定</div>
          <div class="text-xs text-red-600 mt-1">{{ error }}</div>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="label">用户名或邮箱</label>
          <input v-model="form.username" type="text" class="input" placeholder="输入用户名或邮箱"
                 maxlength="254"
                 :class="errors.username ? 'border-red-400' : ''"
                 @input="clearError('username')" required />
          <p v-if="errors.username" class="text-red-500 text-xs mt-1">{{ errors.username }}</p>
        </div>
        <div>
          <label class="label">密码</label>
          <input v-model="form.password" type="password" class="input" placeholder="输入密码"
                 maxlength="36"
                 :class="errors.password ? 'border-red-400' : ''"
                 @input="clearError('password')" required />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
        </div>

        <!-- Captcha -->
        <div>
          <label class="label">验证码</label>
          <div class="flex gap-3 items-center">
            <div class="flex-1">
              <input v-model="form.captcha_answer" type="text" class="input" placeholder="输入计算结果" required />
            </div>
            <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl select-none cursor-pointer min-w-[140px] justify-center transition hover:scale-[1.02]"
                 style="background: linear-gradient(135deg, rgba(67,56,202,0.08), rgba(99,102,241,0.12)); border: 1px solid rgba(67,56,202,0.15);"
                 @click="refreshCaptcha" title="点击刷新验证码">
              <span class="text-lg font-bold text-cnb-700 tracking-wider font-mono" style="font-family: 'Courier New', monospace; letter-spacing: 2px; text-decoration: line-through; text-decoration-color: rgba(67,56,202,0.2);">
                {{ captchaQuestion || '加载中...' }}
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-1">点击验证码可刷新</p>
        </div>

        <div v-if="error && !pendingNotice && !rejectedNotice && !lockedNotice" class="text-red-600 text-sm p-3 rounded-xl" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">
          {{ error }}
          <span v-if="remainingAttempts !== null && remainingAttempts > 0" class="block text-xs mt-1 text-red-400">剩余尝试次数：{{ remainingAttempts }}次</span>
        </div>

        <button type="submit" :disabled="loading" class="btn-primary w-full py-3 disabled:opacity-50">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-500">
        还没有账号？
        <router-link to="/register" class="text-cnb-600 font-medium hover:underline">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const router = useRouter();
const auth = useAuthStore();
const form = ref({ username: '', password: '', captcha_answer: '' });
const error = ref('');
const errors = ref({});
const loading = ref(false);
const captchaQuestion = ref('');
const captchaId = ref('');
const pendingNotice = ref(false);
const rejectedNotice = ref(false);
const lockedNotice = ref(false);
const remainingAttempts = ref(null);

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

const fetchCaptcha = async () => {
  try {
    const { data } = await api.get('/auth/captcha');
    captchaQuestion.value = data.question;
    captchaId.value = data.id;
    form.value.captcha_answer = '';
  } catch {
    captchaQuestion.value = '获取失败';
  }
};

const refreshCaptcha = () => fetchCaptcha();

const clearError = (field) => {
  errors.value = { ...errors.value, [field]: '' };
};

// Frontend validation before submit
const validateForm = () => {
  const e = {};
  const { username, password } = form.value;

  if (!username) {
    e.username = '请输入用户名或邮箱';
  } else if (username.length > 254) {
    e.username = '用户名或邮箱长度不能超过254位';
  } else if (CHINESE_REGEX.test(username)) {
    e.username = '用户名不能包含中文';
  }

  if (!password) {
    e.password = '请输入密码';
  } else if (password.length > 36) {
    e.password = '密码长度不能超过36位';
  } else if (CHINESE_REGEX.test(password)) {
    e.password = '密码不能包含中文';
  }

  errors.value = e;
  return Object.keys(e).length === 0;
};

const handleLogin = async () => {
  error.value = '';
  pendingNotice.value = false;
  rejectedNotice.value = false;
  lockedNotice.value = false;
  remainingAttempts.value = null;

  // Frontend validation
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  try {
    await auth.login({
      ...form.value,
      captcha_id: captchaId.value,
    });
    router.push('/dashboard');
  } catch (e) {
    const errData = e.response?.data;
    if (errData?.pending) {
      pendingNotice.value = true;
    } else if (errData?.rejected) {
      rejectedNotice.value = true;
    } else if (errData?.locked) {
      lockedNotice.value = true;
      error.value = errData.error || '登录失败次数过多，请稍后再试';
    } else {
      error.value = errData?.error || '登录失败，请重试';
      if (typeof errData?.remaining === 'number') {
        remainingAttempts.value = errData.remaining;
      }
    }
    fetchCaptcha();
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCaptcha);
</script>
