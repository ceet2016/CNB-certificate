<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 p-6 rounded-2xl relative overflow-hidden" style="background: linear-gradient(135deg, rgba(67,56,202,0.06), rgba(193,143,46,0.04));">
      <div class="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20" style="background: #6366F1;"></div>
      <div class="relative flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">管理后台</h1>
          <p class="text-slate-500 mt-1">审核作品、颁发证书、管理用户</p>
        </div>
        <button @click="openChangePassword" class="btn-secondary text-sm flex items-center gap-2">
          <span>🔒</span> 修改密码
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-slate-200/60 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.key"
        @click="activeTab = tab.key"
        :class="activeTab === tab.key ? 'border-cnb-600 text-cnb-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap">
        {{ tab.label }}
        <span v-if="tab.count !== null && tab.count > 0" class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              :class="activeTab === tab.key ? 'text-white' : 'bg-slate-200 text-slate-600'"
              :style="activeTab === tab.key ? 'background: #4F46E5;' : ''">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Stats Tab -->
    <div v-if="activeTab === 'stats'" class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="stat in statCards" :key="stat.label" class="stat-card">
        <div class="absolute top-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center text-lg" :class="stat.bg">{{ stat.icon }}</div>
        <div class="text-3xl font-bold" :class="stat.color">{{ stat.value }}</div>
        <div class="text-sm text-slate-500 mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Pending Users Tab -->
    <div v-if="activeTab === 'pending'" class="space-y-3">
      <div v-if="pendingUsers.length === 0" class="card p-8 text-center text-slate-400">
        暂无待审核用户
      </div>
      <div v-for="u in pendingUsers" :key="u.id" class="card-hover p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="font-bold text-slate-800">{{ u.username }}</span>
              <span class="badge bg-amber-50 text-amber-600">待审核</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-500">
              <div>邮箱：{{ u.email }}</div>
              <div>姓名：{{ u.full_name || '—' }}</div>
              <div>注册时间：{{ formatDateTime(u.created_at) }}</div>
            </div>
            <div v-if="u.registered_ip" class="text-xs text-slate-400 mt-1">注册IP：{{ u.registered_ip }}</div>
          </div>
          <div class="flex flex-col gap-2 min-w-[120px]">
            <button @click="approveUser(u.id)" class="btn text-white text-sm" style="background: linear-gradient(135deg, #10B981, #059669);">
              ✓ 通过
            </button>
            <button @click="rejectUser(u.id)" class="btn text-white text-sm" style="background: linear-gradient(135deg, #EF4444, #DC2626);">
              ✕ 拒绝
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Works Tab -->
    <div v-if="activeTab === 'works'" class="space-y-3">
      <div v-if="works.length === 0" class="card p-8 text-center text-slate-400">暂无作品</div>
      <div v-for="work in works" :key="work.id" class="card-hover p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-bold text-slate-800">{{ work.title }}</span>
              <span :class="statusBadge(work.status)">{{ statusLabel(work.status) }}</span>
              <span class="badge bg-slate-100 text-slate-500">{{ categoryLabel(work.category) }}</span>
            </div>
            <p v-if="work.description" class="text-sm text-slate-500 mb-2">{{ work.description }}</p>
            <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>提交人：{{ work.full_name || work.username }} ({{ work.email }})</span>
              <span>·</span>
              <span>{{ formatDate(work.submitted_at) }}</span>
              <a v-if="work.work_url" :href="work.work_url" target="_blank" class="text-cnb-600 hover:underline">查看作品 →</a>
            </div>
            <div v-if="work.review_note" class="mt-2 text-sm p-2 rounded-lg text-slate-600" style="background: rgba(245,243,239,0.5);">
              审核意见：{{ work.review_note }}
            </div>
          </div>

          <div class="flex flex-col gap-2 min-w-[200px]">
            <template v-if="work.status === 'pending'">
              <textarea v-model="reviewNotes[work.id]" rows="2" class="input text-sm" placeholder="审核意见（可选）"></textarea>
              <p class="text-xs text-slate-400">通过后将自动颁发证书</p>
              <div class="flex gap-2">
                <button @click="reviewWork(work.id, 'approved')" class="btn text-white text-sm flex-1" style="background: linear-gradient(135deg, #10B981, #059669);">通过</button>
                <button @click="reviewWork(work.id, 'rejected')" class="btn text-white text-sm flex-1" style="background: linear-gradient(135deg, #EF4444, #DC2626);">拒绝</button>
              </div>
            </template>
            <button @click="deleteWork(work)" class="btn-ghost text-sm text-red-500 hover:bg-red-50/50">删除作品</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Certificates Tab -->
    <div v-if="activeTab === 'certs'">
      <div class="card p-5 mb-6">
        <h3 class="font-bold text-slate-800 mb-4">手动颁发证书</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <select v-model="issueForm.user_id" class="input text-sm">
            <option value="">选择用户</option>
            <option v-for="u in approvedUsers" :key="u.id" :value="u.id">{{ u.username }} ({{ u.email }})</option>
          </select>
          <select v-model="issueForm.cert_type" class="input text-sm">
            <option value="">证书类型</option>
            <option v-for="(label, value) in certTypeLabels" :key="value" :value="value">{{ label }}</option>
          </select>
          <input v-model="issueForm.holder_name" type="text" class="input text-sm" placeholder="持有人姓名" />
          <input v-model="issueForm.work_title" type="text" class="input text-sm" placeholder="作品名称（可选）" />
          <select v-model="issueForm.skill_level" class="input text-sm">
            <option value="">技能等级（可选）</option>
            <option value="beginner">初级</option>
            <option value="intermediate">中级</option>
            <option value="advanced">高级</option>
          </select>
          <input v-model="issueForm.work_id" type="number" class="input text-sm" placeholder="关联作品ID（可选）" />
        </div>
        <button @click="issueCert" :disabled="issuing" class="btn-primary text-sm">
          {{ issuing ? '颁发中...' : '颁发证书' }}
        </button>
      </div>

      <div class="table-container overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-slate-500 text-xs uppercase" style="background: rgba(245,243,239,0.5);">
            <tr>
              <th class="text-left px-4 py-3">编号</th>
              <th class="text-left px-4 py-3">类型</th>
              <th class="text-left px-4 py-3">持有人</th>
              <th class="text-left px-4 py-3">作品</th>
              <th class="text-left px-4 py-3">日期</th>
              <th class="text-left px-4 py-3">状态</th>
              <th class="text-left px-4 py-3 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100/60">
            <tr v-for="cert in certs" :key="cert.id" class="hover:bg-cnb-50/30 transition">
              <td class="px-4 py-3">
                <button @click="showCertDetail(cert)" class="font-mono text-xs text-cnb-600 hover:text-cnb-800 hover:underline transition" title="点击查看证书详情">
                  {{ cert.cert_number }}
                </button>
              </td>
              <td class="px-4 py-3">{{ certTypeLabel(cert.cert_type) }}</td>
              <td class="px-4 py-3">{{ cert.holder_name }}</td>
              <td class="px-4 py-3 text-slate-500 max-w-[150px] truncate">{{ cert.work_title || '—' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ formatDate(cert.issue_date) }}</td>
              <td class="px-4 py-3">
                <span v-if="cert.status === 'active'" class="badge bg-green-50 text-green-600">有效</span>
                <span v-else class="badge bg-red-50 text-red-600">已撤销</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2 whitespace-nowrap">
                  <button @click="showCertDetail(cert)" class="text-cnb-600 hover:underline text-xs">查看</button>
                  <button v-if="cert.status === 'active'" @click="revokeCert(cert.id)" class="text-orange-500 hover:underline text-xs">撤销</button>
                  <button @click="openEditCert(cert)" class="text-blue-500 hover:underline text-xs">修改</button>
                  <button @click="deleteCert(cert)" class="text-red-500 hover:underline text-xs">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="table-container overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-slate-500 text-xs uppercase" style="background: rgba(245,243,239,0.5);">
          <tr>
            <th class="text-left px-4 py-3">用户名</th>
            <th class="text-left px-4 py-3">邮箱</th>
            <th class="text-left px-4 py-3">姓名</th>
            <th class="text-left px-4 py-3">角色</th>
            <th class="text-left px-4 py-3">状态</th>
            <th class="text-left px-4 py-3">作品</th>
            <th class="text-left px-4 py-3">证书</th>
            <th class="text-left px-4 py-3">注册时间</th>
            <th class="text-left px-4 py-3 whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100/60">
          <tr v-for="u in users" :key="u.id" class="hover:bg-cnb-50/30 transition">
            <td class="px-4 py-3 font-medium">{{ u.username }}</td>
            <td class="px-4 py-3 text-slate-500">{{ u.email }}</td>
            <td class="px-4 py-3">{{ u.full_name || '—' }}</td>
            <td class="px-4 py-3">
              <span v-if="u.role === 'admin'" class="badge bg-cnb-50 text-cnb-700">管理员</span>
              <span v-else class="badge bg-slate-100 text-slate-600">用户</span>
            </td>
            <td class="px-4 py-3">
              <span v-if="u.status === 'approved'" class="badge bg-green-50 text-green-600">已通过</span>
              <span v-else-if="u.status === 'pending'" class="badge bg-amber-50 text-amber-600">待审核</span>
              <span v-else-if="u.status === 'rejected'" class="badge bg-red-50 text-red-600">已拒绝</span>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ u.work_count }}</td>
            <td class="px-4 py-3 text-slate-500">{{ u.cert_count }}</td>
            <td class="px-4 py-3 text-slate-500">{{ formatDate(u.created_at) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-2 whitespace-nowrap">
                <button v-if="u.status === 'pending'" @click="approveUser(u.id)" class="text-green-600 hover:underline text-xs">通过</button>
                <button v-if="u.status === 'pending'" @click="rejectUser(u.id)" class="text-red-500 hover:underline text-xs">拒绝</button>
                <button v-if="u.status === 'approved' && u.role !== 'admin'" @click="revokeUser(u.id)" class="text-orange-500 hover:underline text-xs">撤回</button>
                <button v-if="u.status === 'rejected'" @click="approveUser(u.id)" class="text-green-600 hover:underline text-xs">恢复</button>
                <button v-if="u.role !== 'admin'" @click="openResetPassword(u)" class="text-blue-500 hover:underline text-xs">重置密码</button>
                <button v-if="u.role !== 'admin'" @click="openDeleteUser(u)" class="text-red-500 hover:underline text-xs">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== Modal: Certificate Detail ===== -->
    <div v-if="certDetailModal.show" class="modal-backdrop" @click.self="certDetailModal.show = false">
      <div class="modal-panel max-w-2xl">
        <button @click="certDetailModal.show = false" class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 text-xl transition-colors hover:bg-slate-900/5">
          ×
        </button>
        <div class="p-8 border-b border-slate-100/60 text-center" style="background: linear-gradient(135deg, rgba(67,56,202,0.05), rgba(193,143,46,0.03));">
          <div class="text-xs text-cnb-600 tracking-widest font-semibold mb-1">CNB ASIA INTERNET ACADEMY</div>
          <div class="text-xs text-slate-400 mb-6">CNB 亚洲互联网学院</div>
          <div class="text-3xl mb-2">{{ certTypeIcon(certDetailModal.cert?.cert_type) }}</div>
          <div class="text-2xl font-bold text-slate-800 mb-6 font-serif">{{ certTypeLabel(certDetailModal.cert?.cert_type) }}</div>
          <div class="text-sm text-slate-500 mb-2">兹证明</div>
          <div class="text-2xl font-bold text-slate-800 pb-2 inline-block px-8 mb-4" style="border-bottom: 2px solid rgba(193,143,46,0.4);">
            {{ certDetailModal.cert?.holder_name }}
          </div>
          <div v-if="certDetailModal.cert?.work_title" class="text-sm text-slate-600 mt-2">作品：{{ certDetailModal.cert.work_title }}</div>
          <div v-if="certDetailModal.cert?.skill_level" class="text-sm text-slate-600 mt-1">技能等级：{{ skillLevelLabel(certDetailModal.cert.skill_level) }}</div>
          <div class="mt-4">
            <span v-if="certDetailModal.cert?.status === 'active'" class="badge bg-green-50 text-green-600">✓ 有效</span>
            <span v-else class="badge bg-red-50 text-red-600">⚠ 已撤销</span>
          </div>
        </div>
        <div class="p-6 space-y-4">
          <div v-if="certDetailModal.cert?.username" class="rounded-xl p-4" style="background: rgba(67,56,202,0.05);">
            <div class="text-cnb-600 text-xs mb-2 font-medium">证书持有者</div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-slate-400">用户名：</span><span class="text-slate-700">{{ certDetailModal.cert.username || '—' }}</span></div>
              <div><span class="text-slate-400">邮箱：</span><span class="text-slate-700">{{ certDetailModal.cert.email || '—' }}</span></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">证书编号</div>
              <div class="font-mono text-slate-700 break-all">{{ certDetailModal.cert?.cert_number }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">颁发日期</div>
              <div class="text-slate-700">{{ formatDate(certDetailModal.cert?.issue_date) }}</div>
            </div>
            <div v-if="certDetailModal.cert?.expiry_date" class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">有效期至</div>
              <div class="text-slate-700">{{ formatDate(certDetailModal.cert.expiry_date) }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: rgba(245,243,239,0.5);">
              <div class="text-slate-400 text-xs mb-1">证书类型</div>
              <div class="text-slate-700">{{ certTypeLabel(certDetailModal.cert?.cert_type) }}</div>
            </div>
          </div>
          <div class="rounded-xl p-3" style="background: rgba(193,143,46,0.06); border: 1px solid rgba(193,143,46,0.12);">
            <div class="text-amber-600 text-xs mb-1 font-medium">安全哈希 (SHA-256 防伪)</div>
            <div class="font-mono text-xs text-amber-700 break-all">{{ certDetailModal.cert?.hash }}</div>
          </div>
          <div class="rounded-xl p-4" style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12);">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-green-600 text-sm font-medium">公开验证</span>
            </div>
            <div class="text-xs text-slate-500 mb-2">任何人可通过以下链接验证此证书真伪：</div>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-xs text-cnb-600 px-3 py-2 rounded-lg break-all" style="background: rgba(255,255,255,0.6); border: 1px solid rgba(67,56,202,0.1);">{{ certVerifyUrl }}</code>
              <button @click="copyCertUrl" class="btn-ghost text-xs whitespace-nowrap">{{ certDetailModal.copied ? '已复制' : '复制' }}</button>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <router-link v-if="certDetailModal.cert?.status === 'active'" :to="`/verify/${certDetailModal.cert.cert_number}`" class="btn-secondary flex-1 text-center" @click="certDetailModal.show = false">
              🔍 打开验证页
            </router-link>
            <button @click="openEditCert(certDetailModal.cert); certDetailModal.show = false" class="btn text-white flex-1" style="background: linear-gradient(135deg, #3B82F6, #2563EB);">
              ✏ 修改证书
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== Modal: Edit Certificate ===== -->
    <div v-if="editModal.show" class="modal-backdrop" @click.self="editModal.show = false">
      <div class="modal-panel max-w-lg p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-4">修改证书</h3>
        <div class="space-y-4">
          <div>
            <label class="label">证书编号（不可修改）</label>
            <input :value="editModal.cert?.cert_number" type="text" class="input" style="background: rgba(245,243,239,0.5);" disabled />
          </div>
          <div>
            <label class="label">持有人姓名</label>
            <input v-model="editModal.form.holder_name" type="text" class="input" />
          </div>
          <div>
            <label class="label">证书类型</label>
            <select v-model="editModal.form.cert_type" class="input">
              <option v-for="(label, value) in certTypeLabels" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="label">作品名称</label>
            <input v-model="editModal.form.work_title" type="text" class="input" />
          </div>
          <div>
            <label class="label">技能等级</label>
            <select v-model="editModal.form.skill_level" class="input">
              <option value="">无</option>
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>
          <div>
            <label class="label">状态</label>
            <select v-model="editModal.form.status" class="input">
              <option value="active">有效</option>
              <option value="revoked">已撤销</option>
            </select>
          </div>
          <div>
            <label class="label">过期日期（可选）</label>
            <input v-model="editModal.form.expiry_date" type="date" class="input" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="editModal.show = false" class="btn text-slate-600 flex-1" style="background: rgba(245,243,239,0.6);">取消</button>
          <button @click="saveCertEdit" :disabled="editModal.loading" class="btn-primary flex-1">
            {{ editModal.loading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal: Delete User ===== -->
    <div v-if="deleteUserModal.show" class="modal-backdrop" @click.self="deleteUserModal.show = false">
      <div class="modal-panel max-w-md p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-2">删除用户</h3>
        <p class="text-sm text-slate-500 mb-4">
          确定要删除用户 <span class="font-bold text-slate-700">{{ deleteUserModal.user?.username }}</span>（{{ deleteUserModal.user?.email }}）吗？
        </p>
        <div class="rounded-xl p-4 mb-4" style="background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.15);">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" v-model="deleteUserModal.cascade" class="mt-0.5 rounded" />
            <div>
              <div class="text-sm font-medium text-amber-800">同时删除该用户的所有作品和证书</div>
              <div class="text-xs text-amber-600 mt-1">
                勾选：将彻底删除该用户的 {{ deleteUserModal.user?.work_count }} 个作品和 {{ deleteUserModal.user?.cert_count }} 个证书<br/>
                不勾选：仅删除用户账号，作品和证书将保留在系统中
              </div>
            </div>
          </label>
        </div>
        <div class="flex gap-3">
          <button @click="deleteUserModal.show = false" class="btn text-slate-600 flex-1" style="background: rgba(245,243,239,0.6);">取消</button>
          <button @click="confirmDeleteUser" :disabled="deleteUserModal.loading"
            class="btn text-white flex-1" style="background: linear-gradient(135deg, #EF4444, #DC2626);">
            {{ deleteUserModal.loading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal: Reset Password ===== -->
    <div v-if="resetPwdModal.show" class="modal-backdrop" @click.self="resetPwdModal.show = false">
      <div class="modal-panel max-w-md p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-1">重置用户密码</h3>
        <p class="text-sm text-slate-500 mb-5">
          为用户 <span class="font-bold text-slate-700">{{ resetPwdModal.user?.username }}</span>（{{ resetPwdModal.user?.email }}）设置新密码。
          <br/>密码将通过RSA加密传输。
        </p>
        <div class="space-y-4">
          <div>
            <label class="label">新密码 <span class="text-red-500">*</span></label>
            <input v-model="resetPwdModal.form.new_password" type="password" class="input" placeholder="至少8位，需含字母和数字" required />
          </div>
          <div>
            <label class="label">确认密码 <span class="text-red-500">*</span></label>
            <input v-model="resetPwdModal.form.confirm_password" type="password" class="input" placeholder="再次输入新密码" required />
          </div>
          <div v-if="resetPwdModal.error" class="text-red-600 text-sm p-3 rounded-xl" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">{{ resetPwdModal.error }}</div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="resetPwdModal.show = false" class="btn text-slate-600 flex-1" style="background: rgba(245,243,239,0.6);">取消</button>
          <button @click="confirmResetPassword" :disabled="resetPwdModal.loading" class="btn-primary flex-1">
            {{ resetPwdModal.loading ? '重置中...' : '确认重置' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== Modal: Change Password ===== -->
    <div v-if="pwdModal.show" class="modal-backdrop" @click.self="pwdModal.show = false">
      <div class="modal-panel max-w-md p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-1">修改管理员密码</h3>
        <p class="text-sm text-slate-500 mb-5">请输入当前密码和新密码，密码将通过RSA加密传输</p>
        <div class="space-y-4">
          <div>
            <label class="label">当前密码</label>
            <input v-model="pwdModal.form.current_password" type="password" class="input" placeholder="输入当前密码" required />
          </div>
          <div>
            <label class="label">新密码</label>
            <input v-model="pwdModal.form.new_password" type="password" class="input" placeholder="至少6位" required />
          </div>
          <div>
            <label class="label">确认新密码</label>
            <input v-model="pwdModal.form.confirm_password" type="password" class="input" placeholder="再次输入新密码" required />
          </div>
          <div>
            <label class="label">验证码</label>
            <div class="flex gap-3 items-center">
              <div class="flex-1">
                <input v-model="pwdModal.form.captcha_answer" type="text" class="input" placeholder="输入计算结果" required />
              </div>
              <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl select-none cursor-pointer min-w-[140px] justify-center transition hover:scale-[1.02]"
                   style="background: linear-gradient(135deg, rgba(67,56,202,0.08), rgba(99,102,241,0.12)); border: 1px solid rgba(67,56,202,0.15);"
                   @click="refreshPwdCaptcha" title="点击刷新验证码">
                <span class="text-lg font-bold text-cnb-700 tracking-wider font-mono" style="font-family: 'Courier New', monospace; letter-spacing: 2px; text-decoration: line-through; text-decoration-color: rgba(67,56,202,0.2);">
                  {{ pwdModal.captchaQuestion || '加载中...' }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="pwdModal.error" class="text-red-600 text-sm p-3 rounded-xl" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">{{ pwdModal.error }}</div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="pwdModal.show = false" class="btn text-slate-600 flex-1" style="background: rgba(245,243,239,0.6);">取消</button>
          <button @click="changePassword" :disabled="pwdModal.loading" class="btn-primary flex-1">
            {{ pwdModal.loading ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const activeTab = ref('stats');
const stats = ref({});
const works = ref([]);
const certs = ref([]);
const users = ref([]);
const pendingUsers = ref([]);
const reviewNotes = reactive({});
const issuing = ref(false);

const issueForm = ref({ user_id: '', cert_type: '', holder_name: '', work_title: '', skill_level: '', work_id: '' });

const editModal = ref({
  show: false, cert: null, loading: false,
  form: { holder_name: '', cert_type: '', work_title: '', skill_level: '', status: 'active', expiry_date: '' },
});

const certDetailModal = ref({ show: false, cert: null, copied: false });

const deleteUserModal = ref({ show: false, user: null, cascade: false, loading: false });

const resetPwdModal = ref({
  show: false, user: null, loading: false, error: '',
  form: { new_password: '', confirm_password: '' },
});

const pwdModal = ref({
  show: false, loading: false, error: '', captchaId: '', captchaQuestion: '',
  form: { current_password: '', new_password: '', confirm_password: '', captcha_answer: '' },
});

const certTypeLabels = { completion: '作品完成证书', skill: '技能认证证书', copyright: '原创性存证证书', excellence: '优质作品表彰证书' };
const certTypeIcons = { completion: '✅', skill: '🏆', copyright: '🔐', excellence: '🎖️' };
const categoryLabels = { design: '设计', development: '开发', writing: '写作', video: '视频', other: '其他' };
const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
const skillLevelLabels = { beginner: '初级', intermediate: '中级', advanced: '高级' };

const certTypeLabel = (t) => certTypeLabels[t] || t;
const certTypeIcon = (t) => certTypeIcons[t] || '📜';
const categoryLabel = (c) => categoryLabels[c] || c;
const statusLabel = (s) => statusLabels[s] || s;
const statusBadge = (s) => ({
  pending: 'badge bg-amber-50 text-amber-600',
  approved: 'badge bg-green-50 text-green-600',
  rejected: 'badge bg-red-50 text-red-600',
}[s] || 'badge bg-slate-100 text-slate-600');
const skillLevelLabel = (l) => skillLevelLabels[l] || l;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('zh-CN') : '—';

const pendingCount = computed(() => works.value.filter(w => w.status === 'pending').length);
const pendingUserCount = computed(() => pendingUsers.value.length);
const approvedUsers = computed(() => users.value.filter(u => u.status === 'approved' || u.role === 'admin'));

const tabs = computed(() => [
  { key: 'stats', label: '概览', count: null },
  { key: 'pending', label: '用户审核', count: pendingUserCount.value || null },
  { key: 'works', label: '作品审核', count: pendingCount.value || null },
  { key: 'certs', label: '证书管理', count: null },
  { key: 'users', label: '用户管理', count: null },
]);

const statCards = computed(() => [
  { label: '注册用户', value: stats.value.users || 0, color: 'text-cnb-600', icon: '👥', bg: 'bg-cnb-50' },
  { label: '待审核用户', value: stats.value.pending_users || 0, color: 'text-amber-500', icon: '⏳', bg: 'bg-amber-50' },
  { label: '提交作品', value: stats.value.works || 0, color: 'text-blue-500', icon: '📁', bg: 'bg-blue-50' },
  { label: '待审核作品', value: stats.value.pending_works || 0, color: 'text-orange-500', icon: '📋', bg: 'bg-orange-50' },
  { label: '已颁发证书', value: stats.value.certificates || 0, color: 'text-green-500', icon: '📜', bg: 'bg-green-50' },
  { label: '验证次数', value: stats.value.verifications || 0, color: 'text-purple-500', icon: '🔍', bg: 'bg-purple-50' },
]);

const certVerifyUrl = computed(() => {
  if (!certDetailModal.value.cert) return '';
  return `${window.location.origin}/verify/${certDetailModal.value.cert.cert_number}`;
});

const loadAll = async () => {
  try {
    const [statsRes, worksRes, certsRes, usersRes, pendingRes] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/works'),
      api.get('/admin/certificates'),
      api.get('/admin/users'),
      api.get('/admin/pending-users'),
    ]);
    stats.value = statsRes.data.stats;
    works.value = worksRes.data.works;
    certs.value = certsRes.data.certificates;
    users.value = usersRes.data.users;
    pendingUsers.value = pendingRes.data.users;
  } catch (e) {
    console.error('Admin load error:', e);
  }
};

// --- User approval actions ---
const approveUser = async (userId) => {
  try {
    await api.put(`/admin/users/${userId}/approve`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '操作失败');
  }
};

const rejectUser = async (userId) => {
  if (!confirm('确定拒绝该用户的注册申请？拒绝后用户将无法登录。')) return;
  try {
    await api.put(`/admin/users/${userId}/reject`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '操作失败');
  }
};

const revokeUser = async (userId) => {
  if (!confirm('确定撤回该用户的审核状态？撤回后用户将无法登录，直到再次审核通过。')) return;
  try {
    await api.put(`/admin/users/${userId}/revoke`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '操作失败');
  }
};

// --- Reset password ---
const openResetPassword = (user) => {
  resetPwdModal.value = {
    show: true, user, loading: false, error: '',
    form: { new_password: '', confirm_password: '' },
  };
};

const confirmResetPassword = async () => {
  const f = resetPwdModal.value.form;
  resetPwdModal.value.error = '';

  if (!f.new_password || !f.confirm_password) {
    resetPwdModal.value.error = '请填写所有字段';
    return;
  }
  if (f.new_password.length < 8) {
    resetPwdModal.value.error = '密码至少需要8位';
    return;
  }
  if (!/[a-zA-Z]/.test(f.new_password) || !/[0-9]/.test(f.new_password)) {
    resetPwdModal.value.error = '密码必须包含字母和数字';
    return;
  }
  if (f.new_password !== f.confirm_password) {
    resetPwdModal.value.error = '两次输入的密码不一致';
    return;
  }

  resetPwdModal.value.loading = true;
  try {
    await auth.fetchPublicKey();
    const encPassword = auth.encryptPassword(f.new_password);
    await api.post(`/admin/users/${resetPwdModal.value.user.id}/reset-password`, {
      new_password: encPassword,
    });
    resetPwdModal.value.show = false;
    alert('密码已重置成功！');
  } catch (e) {
    resetPwdModal.value.error = e.response?.data?.error || '重置失败，请重试';
  } finally {
    resetPwdModal.value.loading = false;
  }
};

// --- Work review actions ---
const reviewWork = async (id, status) => {
  try {
    await api.put(`/admin/works/${id}/review`, {
      status,
      review_note: reviewNotes[id] || '',
    });
    await loadAll();
    delete reviewNotes[id];
  } catch (e) {
    alert(e.response?.data?.error || '操作失败');
  }
};

const issueCert = async () => {
  const f = issueForm.value;
  if (!f.user_id || !f.cert_type || !f.holder_name) {
    alert('请填写用户、证书类型和持有人姓名');
    return;
  }
  issuing.value = true;
  try {
    await api.post('/certificates/issue', f);
    issueForm.value = { user_id: '', cert_type: '', holder_name: '', work_title: '', skill_level: '', work_id: '' };
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '颁发失败');
  } finally {
    issuing.value = false;
  }
};

const revokeCert = async (id) => {
  if (!confirm('确定撤销此证书？撤销后证书将变为无效状态（可后续恢复）。')) return;
  try {
    await api.put(`/admin/certificates/${id}/revoke`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '撤销失败');
  }
};

const deleteCert = async (cert) => {
  if (!confirm(`确定彻底删除证书 ${cert.cert_number}？\n\n此操作不可恢复，证书及其验证记录将被永久删除。`)) return;
  try {
    await api.delete(`/admin/certificates/${cert.id}`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
};

const showCertDetail = (cert) => {
  certDetailModal.value = { show: true, cert, copied: false };
};

const copyCertUrl = async () => {
  try {
    await navigator.clipboard.writeText(certVerifyUrl.value);
    certDetailModal.value.copied = true;
    setTimeout(() => { certDetailModal.value.copied = false; }, 2000);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = certVerifyUrl.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    certDetailModal.value.copied = true;
    setTimeout(() => { certDetailModal.value.copied = false; }, 2000);
  }
};

const openEditCert = (cert) => {
  editModal.value = {
    show: true, cert, loading: false,
    form: {
      holder_name: cert.holder_name,
      cert_type: cert.cert_type,
      work_title: cert.work_title || '',
      skill_level: cert.skill_level || '',
      status: cert.status,
      expiry_date: cert.expiry_date ? cert.expiry_date.split(' ')[0].split('T')[0] : '',
    },
  };
};

const saveCertEdit = async () => {
  editModal.value.loading = true;
  try {
    await api.put(`/admin/certificates/${editModal.value.cert.id}`, editModal.value.form);
    editModal.value.show = false;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '修改失败');
  } finally {
    editModal.value.loading = false;
  }
};

const openDeleteUser = (user) => {
  deleteUserModal.value = { show: true, user, cascade: false, loading: false };
};

const confirmDeleteUser = async () => {
  deleteUserModal.value.loading = true;
  try {
    const cascade = deleteUserModal.value.cascade;
    await api.delete(`/admin/users/${deleteUserModal.value.user.id}?cascade=${cascade}`);
    deleteUserModal.value.show = false;
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  } finally {
    deleteUserModal.value.loading = false;
  }
};

const deleteWork = async (work) => {
  if (!confirm(`确定删除作品「${work.title}」吗？\n\n此操作不可恢复。关联的证书将保留但解除与该作品的关联。`)) return;
  try {
    await api.delete(`/admin/works/${work.id}`);
    await loadAll();
  } catch (e) {
    alert(e.response?.data?.error || '删除失败');
  }
};

// --- Change Password ---
const fetchPwdCaptcha = async () => {
  try {
    const { data } = await api.get('/auth/captcha');
    pwdModal.value.captchaId = data.id;
    pwdModal.value.captchaQuestion = data.question;
    pwdModal.value.form.captcha_answer = '';
  } catch {
    pwdModal.value.captchaQuestion = '获取失败';
  }
};

const refreshPwdCaptcha = () => fetchPwdCaptcha();

const openChangePassword = () => {
  pwdModal.value = {
    show: true, loading: false, error: '', captchaId: '', captchaQuestion: '',
    form: { current_password: '', new_password: '', confirm_password: '', captcha_answer: '' },
  };
  fetchPwdCaptcha();
};

const changePassword = async () => {
  const f = pwdModal.value.form;
  pwdModal.value.error = '';

  if (!f.current_password || !f.new_password || !f.confirm_password) {
    pwdModal.value.error = '请填写所有密码字段';
    return;
  }
  if (f.new_password.length < 6) {
    pwdModal.value.error = '新密码至少6位';
    return;
  }
  if (f.new_password !== f.confirm_password) {
    pwdModal.value.error = '两次输入的新密码不一致';
    return;
  }
  if (!f.captcha_answer) {
    pwdModal.value.error = '请输入验证码';
    return;
  }

  pwdModal.value.loading = true;
  try {
    await auth.fetchPublicKey();
    const encCurrent = auth.encryptPassword(f.current_password);
    const encNew = auth.encryptPassword(f.new_password);

    await api.put('/admin/change-password', {
      current_password: encCurrent,
      new_password: encNew,
      captcha_id: pwdModal.value.captchaId,
      captcha_answer: f.captcha_answer,
    });

    pwdModal.value.show = false;
    alert('密码修改成功！下次登录请使用新密码。');
  } catch (e) {
    pwdModal.value.error = e.response?.data?.error || '修改失败，请重试';
    fetchPwdCaptcha();
  } finally {
    pwdModal.value.loading = false;
  }
};

onMounted(loadAll);

watch(() => route.path, (newPath) => {
  if (newPath === '/admin') {
    loadAll();
  }
});
</script>
