<template>
  <div class="min-h-[calc(100vh-4rem)] py-8 px-4 relative overflow-hidden">
    <!-- Decorative background -->
    <div class="absolute inset-0">
      <div class="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-15" style="background: #6366F1;"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10" style="background: #C18F2E;"></div>
    </div>

    <div class="max-w-2xl mx-auto relative">
      <!-- Search -->
      <div class="text-center mb-8">
        <div class="section-tag mb-3">证书验真</div>
        <h1 class="text-3xl font-bold text-slate-800 mb-2">证书验证</h1>
        <p class="text-slate-500">输入证书编号，验证证书真伪</p>
      </div>

      <div class="card p-6 mb-8">
        <form @submit.prevent="verify" class="flex gap-3">
          <input
            v-model="certNumber"
            type="text"
            class="input font-mono"
            placeholder="CNB-2026-XXXXXXXX"
            :disabled="!!route.params.certNumber"
          />
          <button type="submit" class="btn-primary whitespace-nowrap" :disabled="loading">
            {{ loading ? '验证中...' : '验证' }}
          </button>
        </form>
        <p class="text-xs text-slate-400 mt-2">证书编号格式：CNB-年份-8位编码</p>
      </div>

      <!-- Result: Not found -->
      <div v-if="result && !result.valid" class="card p-8 text-center" style="border-color: rgba(239,68,68,0.2);">
        <div class="text-5xl mb-4">❌</div>
        <h3 class="text-xl font-bold text-red-600 mb-2">证书无效</h3>
        <p class="text-slate-500">{{ result.error || '未找到该编号对应的证书' }}</p>
      </div>

      <!-- Result: Valid -->
      <div v-if="result && result.valid" class="space-y-4">
        <!-- Valid banner -->
        <div class="card p-6" style="background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04)); border-color: rgba(16,185,129,0.15);">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-2xl"
                 style="background: linear-gradient(135deg, #10B981, #059669); box-shadow: 0 4px 12px -2px rgba(16,185,129,0.3);">✓</div>
            <div>
              <div class="text-lg font-bold text-green-700">证书有效</div>
              <div class="text-sm text-green-600">该证书经 CNB 亚洲互联网学院认证，真实有效</div>
            </div>
          </div>
        </div>

        <!-- Certificate detail -->
        <div class="card overflow-hidden">
          <div class="p-6 border-b border-slate-100/60 text-center" style="background: linear-gradient(135deg, rgba(67,56,202,0.05), rgba(193,143,46,0.03));">
            <div class="text-xs text-cnb-600 tracking-widest font-semibold mb-1">CNB ASIA INTERNET ACADEMY</div>
            <div class="text-xs text-slate-400 mb-4">CNB 亚洲互联网学院</div>
            <div class="text-2xl font-bold text-slate-800 mb-4 font-serif">{{ result.certificate.cert_type_label }}</div>
            <div class="text-sm text-slate-500 mb-2">兹证明</div>
            <div class="text-2xl font-bold text-slate-800 pb-2 inline-block px-8 mb-4" style="border-bottom: 2px solid rgba(193,143,46,0.4);">
              {{ result.certificate.holder_name }}
            </div>
            <div v-if="result.certificate.work_title" class="text-sm text-slate-600">
              作品：{{ result.certificate.work_title }}
            </div>
            <div v-if="result.certificate.skill_level" class="text-sm text-slate-600 mt-1">
              技能等级：{{ skillLevelLabel(result.certificate.skill_level) }}
            </div>
          </div>

          <div class="p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-slate-400">证书编号</div>
              <div class="font-mono text-slate-700 mt-1">{{ result.certificate.cert_number }}</div>
            </div>
            <div>
              <div class="text-slate-400">颁发日期</div>
              <div class="text-slate-700 mt-1">{{ formatDate(result.certificate.issue_date) }}</div>
            </div>
            <div>
              <div class="text-slate-400">持有人</div>
              <div class="text-slate-700 mt-1">@{{ result.certificate.holder_username }}</div>
            </div>
            <div>
              <div class="text-slate-400">验证次数</div>
              <div class="text-slate-700 mt-1">{{ result.certificate.verify_count }} 次</div>
            </div>
            <div class="col-span-2">
              <div class="text-slate-400">安全哈希 (前16位)</div>
              <div class="font-mono text-xs text-slate-600 mt-1 break-all">{{ result.certificate.hash }}</div>
            </div>
          </div>
        </div>

        <div class="text-center text-sm text-slate-400">
          验证时间：{{ new Date().toLocaleString('zh-CN') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';

const route = useRoute();
const certNumber = ref(route.params.certNumber || '');
const result = ref(null);
const loading = ref(false);

const skillLevelLabels = { beginner: '初级', intermediate: '中级', advanced: '高级' };
const skillLevelLabel = (l) => skillLevelLabels[l] || l;
const formatDate = (d) => new Date(d).toLocaleDateString('zh-CN');

const verify = async () => {
  if (!certNumber.value.trim()) return;
  result.value = null;
  loading.value = true;
  try {
    const { data } = await api.get(`/certificates/verify/${certNumber.value.trim()}`);
    result.value = data;
  } catch (e) {
    result.value = {
      valid: false,
      error: e.response?.data?.error || '验证失败，请检查证书编号',
    };
  } finally {
    loading.value = false;
  }
};

watch(() => route.params.certNumber, (val) => {
  if (val) {
    certNumber.value = val;
    verify();
  }
});

onMounted(() => {
  if (certNumber.value) verify();
});
</script>
