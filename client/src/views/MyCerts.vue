<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">我的证书</h1>
      <p class="text-slate-500 mt-1">查看和管理你获得的证书</p>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-400">加载中...</div>

    <div v-else-if="certs.length === 0" class="card p-12 text-center">
      <div class="text-5xl mb-4">📜</div>
      <h3 class="text-lg font-bold text-slate-700 mb-2">还没有获得证书</h3>
      <p class="text-slate-500 mb-4">提交作品并通过审核后，将自动获得证书</p>
      <router-link to="/submit-work" class="btn-primary">提交作品</router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="cert in certs" :key="cert.id" class="card-hover cursor-pointer" @click="showDetail(cert)">
        <!-- Certificate header -->
        <div class="p-6 border-b border-slate-100/60" style="background: linear-gradient(135deg, rgba(67,56,202,0.05), rgba(193,143,46,0.03));">
          <div class="flex items-start justify-between mb-3">
            <div class="text-3xl">{{ certTypeIcon(cert.cert_type) }}</div>
            <span v-if="cert.status === 'active'" class="badge bg-green-50 text-green-600">✓ 有效</span>
            <span v-else class="badge bg-red-50 text-red-600">已撤销</span>
          </div>
          <h3 class="font-bold text-lg text-slate-800">{{ certTypeLabel(cert.cert_type) }}</h3>
          <p v-if="cert.work_title" class="text-sm text-slate-500 mt-1">{{ cert.work_title }}</p>
          <div v-if="cert.skill_level" class="mt-2">
            <span class="badge bg-cnb-50 text-cnb-700">{{ skillLevelLabel(cert.skill_level) }}</span>
          </div>
        </div>

        <!-- Certificate info -->
        <div class="p-5 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">持有人</span>
            <span class="font-medium text-slate-700">{{ cert.holder_name }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">颁发日期</span>
            <span class="text-slate-700">{{ formatDate(cert.issue_date) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">证书编号</span>
            <span class="font-mono text-xs text-slate-700">{{ cert.cert_number }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-5 pb-5 flex gap-2" @click.stop>
          <button @click="showDetail(cert)" class="btn-ghost text-sm flex-1">
            查看详情
          </button>
          <button v-if="cert.status === 'active'" @click="downloadCert(cert)" class="btn-secondary text-sm flex-1" :disabled="downloading === cert.id">
            {{ downloading === cert.id ? '生成中...' : '下载 PDF' }}
          </button>
          <router-link v-if="cert.status === 'active'" :to="`/verify/${cert.cert_number}`" class="btn-ghost text-sm">
            验证
          </router-link>
        </div>
      </div>
    </div>

    <!-- Certificate Detail Modal -->
    <div v-if="selectedCert" class="modal-backdrop" @click.self="selectedCert = null">
      <div class="modal-panel max-w-2xl">
        <button @click="selectedCert = null" class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 text-xl transition-colors hover:bg-slate-900/5">
          ×
        </button>

        <!-- Certificate preview header -->
        <div class="p-8 border-b border-slate-100/60 text-center" style="background: linear-gradient(135deg, rgba(67,56,202,0.05), rgba(193,143,46,0.03));">
          <div class="text-xs text-cnb-600 tracking-widest font-semibold mb-1">CNB ASIA INTERNET ACADEMY</div>
          <div class="text-xs text-slate-400 mb-6">CNB 亚洲互联网学院</div>
          <div class="text-3xl mb-2">{{ certTypeIcon(selectedCert.cert_type) }}</div>
          <div class="text-2xl font-bold text-slate-800 mb-6 font-serif">{{ certTypeLabel(selectedCert.cert_type) }}</div>

          <div class="text-sm text-slate-500 mb-2">兹证明</div>
          <div class="text-2xl font-bold text-slate-800 pb-2 inline-block px-8 mb-4" style="border-bottom: 2px solid rgba(193,143,46,0.4);">
            {{ selectedCert.holder_name }}
          </div>
          <div v-if="selectedCert.work_title" class="text-sm text-slate-600 mt-2">
            作品：{{ selectedCert.work_title }}
          </div>
          <div v-if="selectedCert.skill_level" class="text-sm text-slate-600 mt-1">
            技能等级：{{ skillLevelLabel(selectedCert.skill_level) }}
          </div>

          <div class="mt-4">
            <span v-if="selectedCert.status === 'active'" class="badge bg-green-50 text-green-600">✓ 有效</span>
            <span v-else class="badge bg-red-50 text-red-600">⚠ 已撤销</span>
          </div>
        </div>

        <!-- Certificate details -->
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">证书编号</div>
              <div class="font-mono text-slate-700 break-all">{{ selectedCert.cert_number }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">颁发日期</div>
              <div class="text-slate-700">{{ formatDate(selectedCert.issue_date) }}</div>
            </div>
            <div v-if="selectedCert.expiry_date" class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">有效期至</div>
              <div class="text-slate-700">{{ formatDate(selectedCert.expiry_date) }}</div>
            </div>
            <div v-if="selectedCert.work_category" class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">作品分类</div>
              <div class="text-slate-700">{{ workCategoryLabel(selectedCert.work_category) }}</div>
            </div>
          </div>

          <!-- Security hash -->
          <div class="rounded-xl p-3" style="background: rgba(193,143,46,0.06); border: 1px solid rgba(193,143,46,0.12);">
            <div class="text-amber-600 text-xs mb-1 font-medium">安全哈希 (SHA-256 防伪)</div>
            <div class="font-mono text-xs text-amber-700 break-all">{{ selectedCert.hash }}</div>
          </div>

          <!-- Work description -->
          <div v-if="detailLoading" class="text-center py-4 text-slate-400 text-sm">加载作品信息...</div>
          <div v-if="certDetail && certDetail.work_description" class="rounded-xl p-4" style="background: rgba(67,56,202,0.05);">
            <div class="text-cnb-600 text-xs mb-2 font-medium">作品描述</div>
            <div class="text-sm text-slate-600 whitespace-pre-wrap">{{ certDetail.work_description }}</div>
          </div>

          <!-- Metadata -->
          <div v-if="certDetail && certDetail.metadata && certDetail.metadata !== '{}'" class="rounded-xl p-4" style="background: rgba(245,243,239,0.5);">
            <div class="text-slate-400 text-xs mb-2 font-medium">附加信息</div>
            <pre class="text-xs text-slate-600 whitespace-pre-wrap">{{ formatMetadata(certDetail.metadata) }}</pre>
          </div>

          <!-- Verification info -->
          <div class="rounded-xl p-4" style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12);">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-green-600 text-sm font-medium">公开验证</span>
            </div>
            <div class="text-xs text-slate-500 mb-2">任何人可通过以下链接验证此证书真伪：</div>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-xs text-cnb-600 px-3 py-2 rounded-lg break-all" style="background: rgba(255,255,255,0.6); border: 1px solid rgba(67,56,202,0.1);">{{ verifyUrl }}</code>
              <button @click="copyVerifyUrl" class="btn-ghost text-xs whitespace-nowrap">{{ copied ? '已复制' : '复制' }}</button>
            </div>
            <div class="mt-2 text-xs text-slate-400">
              已被验证 {{ verifyCount }} 次
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-3 pt-2">
            <button v-if="selectedCert.status === 'active'" @click="downloadCert(selectedCert)" class="btn-primary flex-1" :disabled="downloading === selectedCert.id">
              {{ downloading === selectedCert.id ? '生成中...' : '⬇ 下载 PDF 证书' }}
            </button>
            <router-link v-if="selectedCert.status === 'active'" :to="`/verify/${selectedCert.cert_number}`" class="btn-secondary flex-1 text-center" @click="selectedCert = null">
              🔍 打开验证页
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';

const route = useRoute();
const certs = ref([]);
const loading = ref(true);
const downloading = ref(null);
const selectedCert = ref(null);
const certDetail = ref(null);
const detailLoading = ref(false);
const verifyCount = ref(0);
const copied = ref(false);

const certTypeLabels = { completion: '作品完成证书', skill: '技能认证证书', copyright: '原创性存证证书', excellence: '优质作品表彰证书' };
const certTypeIcons = { completion: '✅', skill: '🏆', copyright: '🔐', excellence: '🎖️' };
const skillLevelLabels = { beginner: '初级', intermediate: '中级', advanced: '高级' };
const workCategoryLabels = { design: '设计', development: '开发', writing: '写作', video: '视频', other: '其他' };

const certTypeLabel = (t) => certTypeLabels[t] || t;
const certTypeIcon = (t) => certTypeIcons[t] || '📜';
const skillLevelLabel = (l) => skillLevelLabels[l] || l;
const workCategoryLabel = (c) => workCategoryLabels[c] || c;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '永久有效';
const formatMetadata = (m) => {
  try {
    const obj = typeof m === 'string' ? JSON.parse(m) : m;
    return JSON.stringify(obj, null, 2);
  } catch {
    return m;
  }
};

const verifyUrl = computed(() => {
  if (!selectedCert.value) return '';
  return `${window.location.origin}/verify/${selectedCert.value.cert_number}`;
});

const showDetail = async (cert) => {
  selectedCert.value = cert;
  certDetail.value = null;
  detailLoading.value = true;
  try {
    const { data } = await api.get(`/certificates/${cert.id}`);
    certDetail.value = data.certificate;

    try {
      const { data: vData } = await api.get(`/certificates/verify/${cert.cert_number}`);
      verifyCount.value = vData.certificate?.verify_count || 0;
    } catch {
      verifyCount.value = 0;
    }
  } catch (e) {
    console.error('Load cert detail error:', e);
  } finally {
    detailLoading.value = false;
  }
};

const copyVerifyUrl = async () => {
  try {
    await navigator.clipboard.writeText(verifyUrl.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = verifyUrl.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
};

const downloadCert = async (cert) => {
  downloading.value = cert.id;
  try {
    const response = await api.get(`/certificates/${cert.id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.cert_number}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert('下载失败：' + (e.response?.data?.error || e.message));
  } finally {
    downloading.value = null;
  }
};

onMounted(async () => {
  try {
    const { data } = await api.get('/certificates/my');
    certs.value = data.certificates;
  } catch (e) {
    console.error('Load certs error:', e);
  } finally {
    loading.value = false;
  }
});

watch(() => route.path, (newPath) => {
  if (newPath === '/my-certificates') {
    api.get('/certificates/my').then(({ data }) => {
      certs.value = data.certificates;
    }).catch(() => {});
  }
});
</script>
