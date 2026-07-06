<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">提交作品</h1>
      <p class="text-slate-500 mt-1">提交你的作品，审核通过后将自动颁发证书</p>
    </div>

    <div class="card p-6">
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="label">作品标题 <span class="text-red-500">*</span></label>
          <input v-model="form.title" type="text" class="input" placeholder="给你的作品起个名字" required />
        </div>

        <div>
          <label class="label">作品分类 <span class="text-red-500">*</span></label>
          <select v-model="form.category" class="input" required>
            <option value="">请选择分类</option>
            <option v-for="(label, value) in categories" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>

        <div>
          <label class="label">作品链接类型</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button v-for="(label, value) in workTypes" :key="value"
              type="button"
              @click="form.work_type = value"
              :class="form.work_type === value ? 'text-white shadow-md' : 'text-slate-600 hover:bg-slate-900/5'"
              class="px-3 py-2 rounded-xl border text-sm transition font-medium"
              :style="form.work_type === value ? 'background: linear-gradient(135deg, #4F46E5, #4338CA); border-color: #4338CA;' : 'border-color: rgba(224,220,210,0.8); background: rgba(245,243,239,0.4);'"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div>
          <label class="label">作品链接</label>
          <input v-model="form.work_url" type="url" class="input" placeholder="https://github.com/your/repo" />
          <p class="text-xs text-slate-400 mt-1">提交 GitHub、Behance、网盘等链接便于审核</p>
        </div>

        <div>
          <label class="label">作品描述</label>
          <textarea v-model="form.description" rows="5" class="input" placeholder="简要描述你的作品、技术栈、创意亮点等..."></textarea>
        </div>

        <div v-if="error" class="text-red-600 text-sm p-3 rounded-xl" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">{{ error }}</div>
        <div v-if="success" class="text-green-600 text-sm p-3 rounded-xl" style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15);">{{ success }}</div>

        <div class="flex gap-3">
          <button type="submit" :disabled="loading" class="btn-primary flex-1 py-3 disabled:opacity-50">
            {{ loading ? '提交中...' : '提交作品' }}
          </button>
          <router-link to="/my-works" class="btn-secondary py-3">取消</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const categories = { design: '设计', development: '开发', writing: '写作', video: '视频', other: '其他' };
const workTypes = { url: '网页链接', github: 'GitHub', behance: 'Behance', file: '文件链接' };

const form = ref({ title: '', category: '', work_type: 'url', work_url: '', description: '' });
const error = ref('');
const success = ref('');
const loading = ref(false);

const handleSubmit = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;
  try {
    await api.post('/works', form.value);
    success.value = '作品提交成功！等待审核中...';
    setTimeout(() => router.push('/my-works'), 1500);
  } catch (e) {
    error.value = e.response?.data?.error || '提交失败，请重试';
  } finally {
    loading.value = false;
  }
};
</script>
