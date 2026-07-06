<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ auth.isAdmin ? '作品管理（全部用户）' : '我的作品' }}</h1>
        <p class="text-slate-500 mt-1">{{ auth.isAdmin ? '管理所有用户提交的作品' : '管理已提交的作品' }}</p>
      </div>
      <router-link to="/submit-work" class="btn-primary">提交新作品</router-link>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-400">加载中...</div>

    <div v-else-if="works.length === 0" class="card p-12 text-center">
      <div class="text-5xl mb-4">📭</div>
      <h3 class="text-lg font-bold text-slate-700 mb-2">{{ auth.isAdmin ? '暂无任何作品' : '还没有提交作品' }}</h3>
      <p class="text-slate-500 mb-4">{{ auth.isAdmin ? '用户提交作品后将显示在这里' : '提交你的作品，审核通过后可获得证书' }}</p>
      <router-link v-if="!auth.isAdmin" to="/submit-work" class="btn-primary">立即提交</router-link>
    </div>

    <div v-else class="space-y-3">
      <div v-for="work in works" :key="work.id" class="card-hover p-5 cursor-pointer" @click="showWorkDetail(work)">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2 flex-wrap">
              <span class="text-xl">{{ categoryIcon(work.category) }}</span>
              <h3 class="font-bold text-slate-800 truncate">{{ work.title }}</h3>
              <span :class="statusBadge(work.status)">{{ statusLabel(work.status) }}</span>
              <span class="badge bg-slate-100 text-slate-500">{{ categoryLabel(work.category) }}</span>
            </div>
            <p v-if="work.description" class="text-sm text-slate-500 line-clamp-2 mb-2">{{ work.description }}</p>
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span v-if="auth.isAdmin && work.username" class="text-cnb-600">
                👤 {{ work.full_name || work.username }}（{{ work.email }}）
              </span>
              <span v-else>提交于 {{ formatDate(work.submitted_at) }}</span>
              <span v-if="auth.isAdmin">·</span>
              <span v-if="auth.isAdmin">{{ formatDate(work.submitted_at) }}</span>
              <span v-if="work.reviewed_at">·</span>
              <span v-if="work.reviewed_at">审核于 {{ formatDate(work.reviewed_at) }}</span>
              <a v-if="work.work_url" :href="work.work_url" target="_blank" class="text-cnb-600 hover:underline" @click.stop>查看链接 →</a>
            </div>
            <div v-if="work.review_note && work.status !== 'pending'" class="mt-2 text-sm p-2 rounded-lg"
                 :style="work.status === 'approved' ? 'background: rgba(16,185,129,0.06); color: #059669;' : 'background: rgba(239,68,68,0.06); color: #DC2626;'">
              审核意见：{{ work.review_note }}
            </div>
          </div>
          <div class="flex flex-col gap-2" @click.stop>
            <button v-if="work.status === 'pending' && !auth.isAdmin" @click="deleteWork(work.id)" class="btn-ghost text-sm text-red-500 hover:bg-red-50/50">删除</button>
            <button v-if="auth.isAdmin" @click="adminDeleteWork(work)" class="btn-ghost text-sm text-red-500 hover:bg-red-50/50">删除</button>
          </div>
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
              <div class="flex items-center gap-2 mt-1 flex-wrap">
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
            <router-link v-if="selectedWork.status === 'approved'" to="/my-certificates" class="btn-secondary flex-1 text-center" @click="selectedWork = null">
              查看证书
            </router-link>
            <a v-if="selectedWork.work_url" :href="selectedWork.work_url" target="_blank" class="btn-primary flex-1 text-center">
              打开作品链接
            </a>
            <button v-if="auth.isAdmin" @click="adminDeleteWork(selectedWork); selectedWork = null" class="btn bg-red-500 text-white hover:bg-red-600">
              删除作品
            </button>
            <button v-if="!auth.isAdmin && selectedWork.status === 'pending'" @click="deleteWork(selectedWork.id); selectedWork = null" class="btn bg-red-500 text-white hover:bg-red-600">
              删除作品
            </button>
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
const works = ref([]);
const loading = ref(true);
const selectedWork = ref(null);

const categories = { design: '设计', development: '开发', writing: '写作', video: '视频', other: '其他' };
const categoryIcons = { design: '🎨', development: '💻', writing: '✍️', video: '🎬', other: '📦' };
const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };

const categoryLabel = (c) => categories[c] || c;
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

const loadWorks = async () => {
  loading.value = true;
  try {
    if (auth.isAdmin) {
      const { data } = await api.get('/admin/works');
      works.value = data.works;
    } else {
      const { data } = await api.get('/works/my');
      works.value = data.works;
    }
  } catch (e) {
    console.error('Load works error:', e);
  } finally {
    loading.value = false;
  }
};

const deleteWork = async (id) => {
  if (!confirm('确定删除这个作品吗？')) return;
  try {
    await api.delete(`/works/${id}`);
    works.value = works.value.filter(w => w.id !== id);
    selectedWork.value = null;
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
};

const adminDeleteWork = async (work) => {
  if (!confirm(`确定删除作品「${work.title}」吗？\n\n此操作不可恢复。关联的证书将保留但解除与该作品的关联。`)) return;
  try {
    await api.delete(`/admin/works/${work.id}`);
    works.value = works.value.filter(w => w.id !== work.id);
    selectedWork.value = null;
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
};

onMounted(loadWorks);

watch(() => route.path, (newPath) => {
  if (newPath === '/my-works') {
    loadWorks();
  }
});
</script>
