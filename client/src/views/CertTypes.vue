<template>
  <div class="py-12 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="section-tag mb-3">认证体系</div>
        <h1 class="text-3xl font-bold text-slate-800 mb-3">证书类型</h1>
        <p class="text-slate-500 max-w-2xl mx-auto">CNB亚洲互联网学院提供四种权威证书，覆盖创作全生命周期的认证需求</p>
      </div>

      <!-- Certificate types -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div v-for="cert in certTypes" :key="cert.title" class="card-hover p-8">
          <div class="flex items-start gap-4 mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                 :class="cert.bg">
              {{ cert.icon }}
            </div>
            <div>
              <h3 class="text-xl font-bold text-slate-800">{{ cert.title }}</h3>
              <p class="text-sm text-cnb-600 mt-1">{{ cert.enTitle }}</p>
            </div>
          </div>
          <p class="text-slate-600 leading-relaxed mb-4">{{ cert.desc }}</p>
          <div class="space-y-2">
            <div v-for="use in cert.useCases" :key="use" class="flex items-start gap-2 text-sm text-slate-500">
              <span class="text-cnb-gold mt-0.5">✦</span>
              <span>{{ use }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Process -->
      <div class="card p-8">
        <h2 class="text-xl font-bold text-slate-800 mb-6 text-center">证书含金量保障</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="item in qualityItems" :key="item.title" class="text-center">
            <div class="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-xl mb-3"
                 style="background: linear-gradient(135deg, rgba(67,56,202,0.08), rgba(99,102,241,0.12)); color: #4338CA;">
              {{ item.icon }}
            </div>
            <h3 class="font-bold text-slate-800 mb-2">{{ item.title }}</h3>
            <p class="text-sm text-slate-500">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-12 text-center">
        <router-link to="/register" class="btn-primary text-base px-8 py-3">立即申请证书</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
const certTypes = [
  {
    title: '作品完成证书',
    enTitle: 'Work Completion Certificate',
    icon: '✅',
    bg: 'bg-blue-50',
    desc: '用户提交作品（设计图、代码、文章、视频等），经审核后颁发的完成认证证书。',
    useCases: [
      '在线课程结业认证',
      '黑客松/创意挑战赛参赛证明',
      '项目完成能力佐证',
    ],
  },
  {
    title: '技能认证证书',
    enTitle: 'Skill Certification',
    icon: '🏆',
    bg: 'bg-amber-50',
    desc: '针对特定技能（如 Python 数据分析、UI/UX 设计、短视频剪辑）进行考核，通过后颁发等级证书。',
    useCases: [
      '初级/中级/高级技能等级认证',
      '求职简历加分项',
      '自由职业者技能证明',
    ],
  },
  {
    title: '原创性存证证书',
    enTitle: 'Originality Certificate',
    icon: '🔐',
    bg: 'bg-green-50',
    desc: '通过 SHA-256 哈希和时间戳技术，证明作品在特定时间点已存在并归属于某人，简易版权保护。',
    useCases: [
      '作品原创性存证',
      '防止抄袭纠纷',
      '创作时间溯源',
    ],
  },
  {
    title: '优质作品表彰证书',
    enTitle: 'Excellence Award',
    icon: '🎖️',
    bg: 'bg-purple-50',
    desc: '由学院专家委员会评选出的优秀作品，颁发金奖、优秀奖等荣誉证书，提升创作者声誉。',
    useCases: [
      '创意大赛获奖认证',
      '优秀作品官方表彰',
      '个人品牌信誉提升',
    ],
  },
];

const qualityItems = [
  { icon: '👨‍🏫', title: '专家委员会', desc: '邀请行业知名专家担任评审，为证书背书' },
  { icon: '🔍', title: '透明审核', desc: '公开审核标准与流程，确保证书公正性' },
  { icon: '🔐', title: '加密防伪', desc: 'SHA-256 哈希 + 唯一编号，杜绝伪造' },
];
</script>
