<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Pending approval notice -->
    <div v-if="!auth.isApproved" class="mb-6 p-6 rounded-2xl flex items-start gap-4"
         style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
      <span class="text-3xl flex-shrink-0">⏳</span>
      <div>
        <h2 class="text-lg font-bold text-amber-800">账号待审核</h2>
        <p class="text-sm text-amber-600 mt-1">
          您的账号正在等待管理员审核。审核通过前，您无法提交作品或查看证书。请在审核通过后再使用相关功能。
        </p>
      </div>
    </div>

    <!-- Welcome -->
    <div class="mb-8 p-6 rounded-2xl relative overflow-hidden" style="background: linear-gradient(135deg, rgba(67,56,202,0.06), rgba(193,143,46,0.04));">
      <div class="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20" style="background: #6366F1;"></div>
      <div class="relative">
        <h1 class="text-2xl font-bold text-slate-800">
          欢迎回来，{{ auth.user?.full_name || auth.user?.username }}
        </h1>
        <p class="text-slate-500 mt-1">
          {{ auth.isAdmin ? '管理系统作品和证书' : '管理你的作品和证书' }}
        </p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat-card">
        <div class="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background: rgba(67,56,202,0.08);">📁</div>
        <div class="text-3xl font-bold text-cnb-600">{{ stats.works }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ auth.isAdmin ? '全部作品' : '提交作品' }}</div>
      </div>
      <div class="stat-card">
        <div class="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background: rgba(245,158,11,0.08);">⏳</div>
        <div class="text-3xl font-bold text-amber-500">{{ stats.pending }}</div>
        <div class="text-sm text-slate-500 mt-1">待审核</div>
      </div>
      <div class="stat-card">
        <div class="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background: rgba(16,185,129,0.08);">✅</div>
        <div class="text-3xl font-bold text-green-500">{{ stats.approved }}</div>
        <div class="text-sm text-slate-500 mt-1">已通过</div>
      </div>
      <div class="stat-card">
        <div class="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background: rgba(139,92,246,0.08);">📜</div>
        <div class="text-3xl font-bold text-violet-500">{{ stats.certs }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ auth.isAdmin ? '全部证书' : '获得证书' }}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <router-link to="/submit-work" class="card-hover p-6 flex items-center gap-4 group">
        <div class="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300"
             style="background: linear-gradient(135deg, #6366F1, #4338CA); box-shadow: 0 4px 12px -2px rgba(79,70,229,0.3);">
          📤
        </div>
        <div>
          <div class="font-bold text-slate-800">提交新作品</div>
          <div class="text-sm text-slate-500">上传作品申请认证</div>
        </div>
      </router-link>
      <router-link to="/verify" class="card-hover p-6 flex items-center gap-4 group">
        <div class="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300"
             style="background: linear-gradient(135deg, #475569, #1E293B); box-shadow: 0 4px 12px -2px rgba(71,85,105,0.3);">
          🔍
        </div>
        <div>
          <div class="font-bold text-slate-800">验证证书</div>
          <div class="text-sm text-slate-500">通过编号验证证书真伪</div>
        </div>
      </router-link>
    </div>

    <!-- Recent Works -->
    <div class="card p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-slate-800">{{ auth.isAdmin ? '最近作品（全部用户）' : '最近作品' }}</h2>
        <router-link to="/my-works" class="text-sm text-cnb-600 hover:underline font-medium">查看全部 →</router-link>
      </div>
      <div v-if="recentWorks.length === 0" class="text-center py-8 text-slate-400">
        还没有提交作品，<router-link to="/submit-work" class="text-cnb-600 font-medium">立即提交</router-link>
      </div>
      <div v-else class="space-y-2">
        <div v-for="work in recentWorks" :key="work.id"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-cnb-50/40 transition cursor-pointer"
          @click="showWorkDetail(work)">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background: rgba(67,56,202,0.06);">{{ categoryIcon(work.category) }}</div>
            <div>
              <div class="font-medium text-slate-800">{{ work.title }}</div>
              <div class="text-xs text-slate-400">
                {{ categoryLabel(work.category) }} · {{ formatDate(work.submitted_at) }}
                <span v-if="auth.isAdmin && work.username" class="ml-1 text-cnb-600">· {{ work.full_name || work.username }}</span>
              </div>
            </div>
          </div>
          <span :class="statusBadge(work.status)">{{ statusLabel(work.status) }}</span>
        </div>
      </div>
    </div>

    <!-- Recent Certificates -->
    <div class="card p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-bold text-slate-800">{{ auth.isAdmin ? '最近证书（全部）' : '最近证书' }}</h2>
        <router-link to="/my-certificates" class="text-sm text-cnb-600 hover:underline font-medium">查看全部 →</router-link>
      </div>
      <div v-if="recentCerts.length === 0" class="text-center py-8 text-slate-400">
        还没有获得证书，提交作品审核通过后即可获得
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="cert in recentCerts" :key="cert.id" class="rounded-xl p-4 transition-all hover:shadow-card" style="background: rgba(245,243,239,0.4); border: 1px solid rgba(224,220,210,0.4);">
          <div class="flex items-center justify-between mb-2">
            <span class="text-lg">{{ certTypeIcon(cert.cert_type) }}</span>
            <span class="badge bg-green-50 text-green-600" v-if="cert.status === 'active'">有效</span>
            <span class="badge bg-red-50 text-red-600" v-else>已撤销</span>
          </div>
          <div class="font-bold text-sm text-slate-800">{{ certTypeLabel(cert.cert_type) }}</div>
          <div class="text-xs text-slate-500 mt-1 truncate">{{ cert.work_title || '—' }}</div>
          <div v-if="auth.isAdmin && cert.holder_name" class="text-xs text-cnb-600 mt-1">{{ cert.holder_name }}</div>
          <div class="text-xs text-slate-400 mt-2 font-mono">{{ cert.cert_number }}</div>
        </div>
      </div>
    </div>

    <!-- ===== Work Detail Modal ===== -->
    <div v-if="selectedWork" class="modal-backdrop" @click.self="selectedWork = null">
      <div class="modal-panel max-w-2xl">
        <button @click="selectedWork = null" class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 text-xl transition-colors hover:bg-slate-900/5">
          ×
        </button>

        <div class="p-8 border-b border-slate-100/60" style="background: linear-gradient(135deg, rgba(67,56,202,0.04), rgba(193,143,46,0.03));">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style="background: rgba(67,56,202,0.08);">{{ categoryIcon(selectedWork.category) }}</div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">{{ selectedWork.title }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <span :class="statusBadge(selectedWork.status)">{{ statusLabel(selectedWork.status) }}</span>
                <span class="badge bg-slate-100 text-slate-500">{{ categoryLabel(selectedWork.category) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="auth.isAdmin && (selectedWork.username || selectedWork.email)" class="rounded-xl p-4" style="background: rgba(67,56,202,0.05);">
            <div class="text-cnb-600 text-xs mb-2 font-medium">提交人信息</div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-400">用户名：</span>
                <span class="text-slate-700">{{ selectedWork.username || '—' }}</span>
              </div>
              <div>
                <span class="text-slate-400">姓名：</span>
                <span class="text-slate-700">{{ selectedWork.full_name || '—' }}</span>
              </div>
              <div>
                <span class="text-slate-400">邮箱：</span>
                <span class="text-slate-700">{{ selectedWork.email || '—' }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedWork.description" class="rounded-xl p-4" style="background: rgba(245,243,239,0.5);">
            <div class="text-slate-400 text-xs mb-2 font-medium">作品描述</div>
            <div class="text-sm text-slate-600 whitespace-pre-wrap">{{ selectedWork.description }}</div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">提交时间</div>
              <div class="text-slate-700">{{ formatDate(selectedWork.submitted_at) }}</div>
            </div>
            <div v-if="selectedWork.reviewed_at" class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">审核时间</div>
              <div class="text-slate-700">{{ formatDate(selectedWork.reviewed_at) }}</div>
            </div>
          </div>

          <div v-if="selectedWork.work_url" class="rounded-xl p-4" style="background: rgba(67,56,202,0.05);">
            <div class="text-cnb-600 text-xs mb-2 font-medium">作品链接</div>
            <a :href="selectedWork.work_url" target="_blank" class="text-sm text-cnb-700 hover:underline break-all">{{ selectedWork.work_url }}</a>
          </div>

          <div v-if="selectedWork.review_note && selectedWork.status !== 'pending'" class="rounded-xl p-4"
               :style="selectedWork.status === 'approved' ? 'background: rgba(16,185,129,0.06);' : 'background: rgba(239,68,68,0.06);'">
            <div class="text-xs mb-2 font-medium" :class="selectedWork.status === 'approved' ? 'text-green-600' : 'text-red-600'">审核意见</div>
            <div class="text-sm text-slate-600 whitespace-pre-wrap">{{ selectedWork.review_note }}</div>
          </div>

          <div class="flex gap-3 pt-2">
            <router-link v-if="selectedWork.status === 'approved'" :to="`/my-certificates`" class="btn-secondary flex-1 text-center" @click="selectedWork = null">
              查看证书
            </router-link>
            <a v-if="selectedWork.work_url" :href="selectedWork.work_url" target="_blank" class="btn-primary flex-1 text-center">
              打开作品链接
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const route = useRoute();
const stats = ref({ works: 0, pending: 0, approved: 0, certs: 0 });
const recentWorks = ref([]);
const recentCerts = ref([]);
const selectedWork = ref(null);

const certTypeLabels = { completion: '作品完成证书', skill: '技能认证证书', copyright: '原创性存证证书', excellence: '优质作品表彰证书' };
const certTypeIcons = { completion: '✅', skill: '🏆', copyright: '🔐', excellence: '🎖️' };
const categoryLabels = { design: '设计', development: '开发', writing: '写作', video: '视频', other: '其他' };
const categoryIcons = { design: '🎨', development: '💻', writing: '✍️', video: '🎬', other: '📦' };
const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };

const certTypeLabel = (t) => certTypeLabels[t] || t;
const certTypeIcon = (t) => certTypeIcons[t] || '📜';
const categoryLabel = (c) => categoryLabels[c] || c;
const categoryIcon = (c) => categoryIcons[c] || '📦';
const statusLabel = (s) => statusLabels[s] || s;
const statusBadge = (s) => ({
  pending: 'badge bg-amber-50 text-amber-600',
  approved: 'badge bg-green-50 text-green-600',
  rejected: 'badge bg-red-50 text-red-600',
}[s] || 'badge bg-slate-100 text-slate-600');

const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '—';

const showWorkDetail = (work) => {
  selectedWork.value = work;
};

const loadData = async () => {
  try {
    if (auth.isAdmin) {
      const [worksRes, certsRes] = await Promise.all([
        api.get('/admin/works'),
        api.get('/admin/certificates'),
      ]);
      const works = worksRes.data.works;
      const certs = certsRes.data.certificates;
      recentWorks.value = works.slice(0, 5);
      recentCerts.value = certs.slice(0, 6);
      stats.value = {
        works: works.length,
        pending: works.filter(w => w.status === 'pending').length,
        approved: works.filter(w => w.status === 'approved').length,
        certs: certs.length,
      };
    } else {
      const [worksRes, certsRes] = await Promise.all([
        api.get('/works/my'),
        api.get('/certificates/my'),
      ]);
      const works = worksRes.data.works;
      const certs = certsRes.data.certificates;
      recentWorks.value = works.slice(0, 5);
      recentCerts.value = certs.slice(0, 6);
      stats.value = {
        works: works.length,
        pending: works.filter(w => w.status === 'pending').length,
        approved: works.filter(w => w.status === 'approved').length,
        certs: certs.length,
      };
    }
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
};

onMounted(loadData);

watch(() => route.path, (newPath) => {
  if (newPath === '/dashboard') {
    loadData();
  }
});
</script>
