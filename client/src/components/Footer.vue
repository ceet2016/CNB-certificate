<template>
  <footer class="mt-auto relative overflow-hidden" style="background: linear-gradient(135deg, #1A1749 0%, #13102F 100%);">
    <!-- Decorative glow -->
    <div class="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10" style="background: #C18F2E;"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10" style="background: #6366F1;"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-2">
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                 style="background: linear-gradient(135deg, #6366F1, #4338CA);">
              C
            </div>
            <div>
              <div class="text-base font-bold text-white">CNB亚洲互联网学院</div>
              <div class="text-xs text-cnb-300">CNB Asia Internet Academy</div>
            </div>
          </div>
          <p class="text-sm text-slate-400 max-w-md leading-relaxed">
            认证你的数字创造力。为亚洲创作者提供权威的作品认证与技能评估服务，让每一份作品都有证可循。
          </p>
          <p class="text-sm mt-3 font-medium text-gradient-gold">cnb.asia</p>
        </div>

        <!-- Links -->
        <div>
          <h4 class="text-sm font-semibold text-white mb-3">快速链接</h4>
          <ul class="space-y-2 text-sm text-slate-400">
            <li><router-link to="/" class="hover:text-cnb-gold transition">首页</router-link></li>
            <li><router-link to="/certificates" class="hover:text-cnb-gold transition">证书类型</router-link></li>
            <li><router-link to="/verify" class="hover:text-cnb-gold transition">证书验证</router-link></li>
            <li><router-link to="/register" class="hover:text-cnb-gold transition">免费注册</router-link></li>
          </ul>
        </div>

        <!-- Info -->
        <div>
          <h4 class="text-sm font-semibold text-white mb-3">关于我们</h4>
          <ul class="space-y-2 text-sm text-slate-400">
            <li>CNB证书为技能认证与作品完成证明</li>
            <li>非国家学历或职业资格证书</li>
            <li>每个证书均可公开验证</li>
          </ul>
        </div>
      </div>

      <div class="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p class="text-xs text-slate-500">&copy; {{ new Date().getFullYear() }} CNB Asia Internet Academy. All rights reserved.</p>
        <p class="text-xs text-slate-500">让每一份作品都有证可循</p>
      </div>
    </div>
  </footer>
</template>
