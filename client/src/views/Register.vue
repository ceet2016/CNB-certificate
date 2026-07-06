<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Decorative background -->
    <div class="absolute inset-0">
      <div class="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: #6366F1;"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15" style="background: #C18F2E;"></div>
    </div>

    <!-- Success state: registration pending -->
    <div v-if="registered" class="card w-full max-w-md p-8 relative text-center">
      <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-3xl mb-4"
           style="background: linear-gradient(135deg, #10B981, #059669); box-shadow: 0 8px 20px -4px rgba(16,185,129,0.35);">
        ✓
      </div>
      <h1 class="text-2xl font-bold text-slate-800 mb-2">注册成功</h1>
      <p class="text-sm text-slate-500 mb-6">
        您的账号 <span class="font-bold text-slate-700">{{ registeredUsername }}</span> 已成功注册。<br/>
        系统管理员将在审核通过后激活您的账号，届时方可登录使用。
      </p>
      <div class="rounded-xl p-4 mb-6 text-left" style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.15);">
        <div class="text-sm font-medium text-amber-800 mb-1">⏳ 等待审核</div>
        <div class="text-xs text-amber-600">账号状态：待审核。审核通过前无法登录系统。</div>
      </div>
      <router-link to="/login" class="btn-primary w-full py-3 inline-block text-center">
        返回登录
      </router-link>
    </div>

    <!-- Registration form -->
    <div v-else class="card w-full max-w-md p-8 relative">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4"
             style="background: linear-gradient(135deg, #4F46E5, #312E81); box-shadow: 0 8px 20px -4px rgba(79,70,229,0.35);">
          C
        </div>
        <h1 class="text-2xl font-bold text-slate-800">创建账号</h1>
        <p class="text-sm text-slate-500 mt-1">加入 CNB 亚洲互联网学院</p>
        <p class="text-xs text-amber-600 mt-2">注册后需管理员审核通过方可登录</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="label">用户名 <span class="text-red-500">*</span></label>
          <input v-model="form.username" type="text" class="input" placeholder="3-20位，字母开头，可含数字和下划线"
                 :class="errors.username ? 'border-red-400' : ''"
                 @blur="validateField('username')" @input="clearError('username')" required />
          <p v-if="errors.username" class="text-red-500 text-xs mt-1">{{ errors.username }}</p>
        </div>

        <div>
          <label class="label">邮箱 <span class="text-red-500">*</span></label>
          <input v-model="form.email" type="email" class="input" placeholder="your@email.com"
                 :class="errors.email ? 'border-red-400' : ''"
                 @blur="validateField('email')" @input="clearError('email')" required />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="label">姓名（证书显示名）</label>
          <input v-model="form.full_name" type="text" class="input" placeholder="你的真实姓名"
                 @input="clearError('full_name')" />
        </div>

        <div>
          <label class="label">密码 <span class="text-red-500">*</span></label>
          <input v-model="form.password" type="password" class="input" placeholder="8-36位，需含字母和数字，不能包含中文"
                 maxlength="36"
                 :class="errors.password ? 'border-red-400' : ''"
                 @blur="validateField('password')" @input="onPasswordInput" required />
          <p v-if="errors.password" class="text-red-500 text-xs mt-1">{{ errors.password }}</p>
          <!-- Password strength indicator -->
          <div v-if="form.password" class="mt-2">
            <div class="flex gap-1 h-1.5">
              <div v-for="i in 4" :key="i" class="flex-1 rounded-full transition-all duration-300"
                   :style="passwordStrength >= i ? `background: ${strengthColor(i)};` : 'background: rgba(224,220,210,0.5);'">
              </div>
            </div>
            <p class="text-xs mt-1" :style="`color: ${strengthTextColor};`">{{ strengthText }}</p>
          </div>
        </div>

        <div>
          <label class="label">确认密码 <span class="text-red-500">*</span></label>
          <input v-model="form.confirmPassword" type="password" class="input" placeholder="再次输入密码"
                 maxlength="36"
                 :class="errors.confirmPassword ? 'border-red-400' : ''"
                 @blur="validateField('confirmPassword')" @input="clearError('confirmPassword')" required />
          <p v-if="errors.confirmPassword" class="text-red-500 text-xs mt-1">{{ errors.confirmPassword }}</p>
        </div>

        <!-- Captcha -->
        <div>
          <label class="label">验证码 <span class="text-red-500">*</span></label>
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

        <div v-if="error" class="text-red-600 text-sm p-3 rounded-xl" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">{{ error }}</div>

        <button type="submit" :disabled="loading" class="btn-primary w-full py-3 disabled:opacity-50">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-slate-500">
        已有账号？
        <router-link to="/login" class="text-cnb-600 font-medium hover:underline">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';

const form = ref({ username: '', email: '', full_name: '', password: '', confirmPassword: '', captcha_answer: '' });
const errors = ref({});
const error = ref('');
const loading = ref(false);
const captchaQuestion = ref('');
const captchaId = ref('');
const registered = ref(false);
const registeredUsername = ref('');

const WEAK_PASSWORDS = ['12345678', 'password', 'qwerty123', 'abc12345', 'aaaaaaaa'];
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

// --- Frontend validation ---
const validateField = (field) => {
  const e = {};
  const val = form.value[field];

  if (field === 'username') {
    if (!val) e.username = '用户名不能为空';
    else if (CHINESE_REGEX.test(val)) e.username = '用户名不能包含中文';
    else if (val.length < 3 || val.length > 20) e.username = '用户名长度需为3-20位';
    else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(val)) e.username = '需以字母开头，只能含字母、数字和下划线';
  }

  if (field === 'email') {
    if (!val) e.email = '邮箱不能为空';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) e.email = '邮箱格式不正确';
  }

  if (field === 'password') {
    if (!val) e.password = '密码不能为空';
    else if (CHINESE_REGEX.test(val)) e.password = '密码不能包含中文';
    else if (val.length < 8) e.password = '密码至少需要8位';
    else if (val.length > 36) e.password = '密码最长不能超过36位';
    else if (!/[a-zA-Z]/.test(val)) e.password = '密码必须包含字母';
    else if (!/[0-9]/.test(val)) e.password = '密码必须包含数字';
    else if (WEAK_PASSWORDS.includes(val.toLowerCase())) e.password = '密码过于简单';
  }

  if (field === 'confirmPassword') {
    if (!val) e.confirmPassword = '请确认密码';
    else if (CHINESE_REGEX.test(val)) e.confirmPassword = '密码不能包含中文';
    else if (val.length > 36) e.confirmPassword = '密码最长不能超过36位';
    else if (val !== form.value.password) e.confirmPassword = '两次输入的密码不一致';
  }

  errors.value = { ...errors.value, ...e };
  return Object.keys(e).length === 0;
};

const clearError = (field) => {
  errors.value = { ...errors.value, [field]: '' };
};

// --- Password strength ---
const passwordStrength = computed(() => {
  const p = form.value.password;
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p)) score++;
  return score;
});

const strengthText = computed(() => {
  const s = passwordStrength.value;
  if (s === 0) return '';
  if (s <= 1) return '弱';
  if (s === 2) return '中';
  return '强';
});

const strengthTextColor = computed(() => {
  const s = passwordStrength.value;
  if (s <= 1) return '#EF4444';
  if (s === 2) return '#F59E0B';
  return '#10B981';
});

const strengthColor = (level) => {
  if (level <= 1) return '#EF4444';
  if (level === 2) return '#F59E0B';
  return '#10B981';
};

const onPasswordInput = () => {
  clearError('password');
  if (form.value.confirmPassword) {
    validateField('confirmPassword');
  }
};

// --- Form submission ---
const handleRegister = async () => {
  error.value = '';
  loading.value = true;

  // Validate all fields
  let valid = true;
  ['username', 'email', 'password', 'confirmPassword'].forEach(f => {
    if (!validateField(f)) valid = false;
  });

  if (!valid) {
    loading.value = false;
    return;
  }

  try {
    // RSA encrypt password
    const { data: keyData } = await api.get('/auth/public-key');
    const JSEncrypt = (await import('jsencrypt')).default;
    const enc = new JSEncrypt();
    enc.setPublicKey(`-----BEGIN PUBLIC KEY-----\n${keyData.publicKey}\n-----END PUBLIC KEY-----`);
    const encryptedPassword = enc.encrypt(form.value.password);
    if (!encryptedPassword) {
      error.value = '密码加密失败，请重试';
      fetchCaptcha();
      return;
    }

    const { data } = await api.post('/auth/register', {
      username: form.value.username,
      email: form.value.email,
      password: encryptedPassword,
      full_name: form.value.full_name,
      captcha_id: captchaId.value,
      captcha_answer: form.value.captcha_answer,
    });

    if (data.pending) {
      registeredUsername.value = form.value.username;
      registered.value = true;
    }
  } catch (e) {
    error.value = e.response?.data?.error || '注册失败，请重试';
    fetchCaptcha();
  } finally {
    loading.value = false;
  }
};

onMounted(fetchCaptcha);
</script>
