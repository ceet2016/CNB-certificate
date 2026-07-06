<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden text-white" style="background: linear-gradient(135deg, #13102F 0%, #1A1749 40%, #1E1B4B 100%);">
      <!-- Mesh gradient decoration -->
      <div class="absolute inset-0">
        <div class="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: #6366F1;"></div>
        <div class="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-15" style="background: #C18F2E;"></div>
        <div class="absolute top-1/2 right-0 w-72 h-72 rounded-full blur-3xl opacity-10" style="background: #818CF8;"></div>
      </div>

      <!-- Grid pattern overlay -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 40px 40px;"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div class="text-center">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 glass-dark">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span class="text-sm text-slate-300">cnb.asia 亚洲创作者认证平台</span>
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            认证你的<span class="text-gradient-gold">数字创造力</span>
          </h1>
          <p class="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            CNB亚洲互联网学院为创作者颁发权威证书——<br class="hidden sm:block" />
            让每一份作品都有证可循，让每一项技能都被认可。
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link to="/register" class="btn-gold text-base px-8 py-3">
              立即注册，申请证书
            </router-link>
            <router-link to="/verify" class="btn glass-dark text-white hover:bg-white/15 text-base px-8 py-3">
              验证证书
            </router-link>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
          <div v-for="stat in stats" :key="stat.label" class="text-center p-4 rounded-2xl glass-dark">
            <div class="text-3xl lg:text-4xl font-bold text-gradient-gold">{{ stat.value }}</div>
            <div class="text-sm text-slate-400 mt-1">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Certificate Types -->
    <section class="py-20 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="section-tag mb-3">认证体系</div>
          <h2 class="text-3xl font-bold text-slate-800 mb-3">四大证书类型</h2>
          <p class="text-slate-500">覆盖创作全生命周期的认证体系</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="cert in certTypes" :key="cert.title"
               class="card-hover p-6 group">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                 :class="cert.bg">
              <span class="text-2xl">{{ cert.icon }}</span>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">{{ cert.title }}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">{{ cert.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-20 relative" style="background: linear-gradient(180deg, rgba(238, 242, 255, 0.4) 0%, rgba(245, 243, 239, 0.3) 100%);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="section-tag mb-3">流程指引</div>
          <h2 class="text-3xl font-bold text-slate-800 mb-3">四步获得认证</h2>
          <p class="text-slate-500">简单高效的证书申请流程</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div v-for="(step, i) in steps" :key="i" class="relative text-center">
            <div class="w-16 h-16 mx-auto rounded-2xl text-white flex items-center justify-center text-2xl font-bold mb-4"
                 style="background: linear-gradient(135deg, #4F46E5, #312E81); box-shadow: 0 8px 20px -4px rgba(79,70,229,0.3);">
              {{ i + 1 }}
            </div>
            <div v-if="i < steps.length - 1" class="hidden md:block absolute top-8 left-1/2 w-full h-0.5" style="background: linear-gradient(90deg, rgba(99,102,241,0.3), rgba(193,143,46,0.1)); z-index: -1;"></div>
            <h3 class="font-bold text-slate-800 mb-2">{{ step.title }}</h3>
            <p class="text-sm text-slate-500">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="section-tag mb-3">核心优势</div>
            <h2 class="text-3xl font-bold text-slate-800 mb-6">为什么选择 CNB 认证？</h2>
            <div class="space-y-3">
              <div v-for="feature in features" :key="feature.title" class="flex gap-4 p-4 rounded-xl hover:bg-cnb-50/40 transition">
                <div class="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                     style="background: linear-gradient(135deg, rgba(67,56,202,0.08), rgba(99,102,241,0.12)); color: #4338CA;">
                  {{ feature.icon }}
                </div>
                <div>
                  <h3 class="font-bold text-slate-800">{{ feature.title }}</h3>
                  <p class="text-sm text-slate-500 mt-1">{{ feature.desc }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Certificate preview -->
          <div class="relative">
            <div class="card p-8" style="background: linear-gradient(135deg, rgba(238,242,255,0.5), rgba(245,243,239,0.3));">
              <div class="rounded-2xl p-6 relative" style="border: 2px solid rgba(193,143,46,0.25); box-shadow: 0 0 32px -8px rgba(193,143,46,0.2);">
                <div class="text-center mb-4">
                  <div class="text-xs tracking-widest font-semibold text-cnb-600">CNB ASIA INTERNET ACADEMY</div>
                  <div class="text-xs text-slate-400 mt-0.5">CNB 亚洲互联网学院</div>
                </div>
                <div class="text-2xl font-bold text-center text-slate-800 mb-4 tracking-wider font-serif">作 品 完 成 证 书</div>
                <div class="text-center text-sm text-slate-500 mb-2">兹证明</div>
                <div class="text-center text-xl font-bold text-slate-800 pb-1 mb-4 inline-block px-8" style="border-bottom: 2px solid rgba(193,143,46,0.4);">张 创 作</div>
                <div class="text-center text-sm text-slate-600">作品：智能数据可视化平台</div>
                <div class="flex justify-between items-end mt-6">
                  <div class="text-xs text-slate-400">
                    <div class="w-16 h-16 rounded-lg flex items-center justify-center text-xs" style="background: rgba(67,56,202,0.06);">QR</div>
                    <div class="mt-1">扫码验证</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-cnb-700">CNB Academy</div>
                    <div class="text-xs text-slate-400">授权签发</div>
                  </div>
                </div>
                <div class="text-xs text-slate-400 text-center mt-4 font-mono">CNB-2026-A1B2C3D4</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 text-white relative overflow-hidden" style="background: linear-gradient(135deg, #4338CA 0%, #1A1749 100%);">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style="background: #C18F2E;"></div>
        <div class="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl" style="background: #6366F1;"></div>
      </div>
      <div class="relative max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-4">准备好认证你的作品了吗？</h2>
        <p class="text-lg text-slate-300 mb-8">加入 CNB 亚洲互联网学院，让你的创造力被世界看见</p>
        <router-link to="/register" class="btn-gold text-base px-8 py-3">
          免费注册，开始认证
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
const stats = [
  { value: '4', label: '证书类型' },
  { value: '5+', label: '作品分类' },
  { value: 'SHA-256', label: '安全哈希' },
  { value: '7×24', label: '在线验证' },
];

const certTypes = [
  { title: '作品完成证书', desc: '提交作品经审核后颁发完成认证，适用于课程结业、黑客松等场景。', icon: '✅', bg: 'bg-blue-50' },
  { title: '技能认证证书', desc: '针对特定技能考核，颁发初级/中级/高级技能等级证书。', icon: '🏆', bg: 'bg-amber-50' },
  { title: '原创性存证证书', desc: '通过哈希时间戳技术证明作品在特定时间点已存在并归属某人。', icon: '🔐', bg: 'bg-green-50' },
  { title: '优质作品表彰证书', desc: '由专家委员会评选的优秀作品，颁发金奖、优秀奖等荣誉证书。', icon: '🎖️', bg: 'bg-purple-50' },
];

const steps = [
  { title: '注册账号', desc: '填写基本信息，完成注册' },
  { title: '提交作品', desc: '上传作品链接或文件' },
  { title: '审核认证', desc: '系统或专家审核通过' },
  { title: '获得证书', desc: '下载PDF，公开验证' },
];

const features = [
  { title: '唯一编号 + SHA-256 哈希', desc: '每张证书拥有全球唯一编号和加密哈希，杜绝伪造。', icon: '🔑' },
  { title: '公开验证页面', desc: '任何人可通过证书编号在线验证真伪，透明可信。', icon: '🔍' },
  { title: '精美 PDF 证书', desc: '专业设计的证书模板，含二维码，可下载、打印、分享。', icon: '📄' },
  { title: '数字徽章展示', desc: '将证书嵌入个人网站、简历、LinkedIn，提升个人品牌。', icon: '🏅' },
];
</script>
