import { defineConfig, presetAttributify, presetIcons, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  // 动态绑定的图标类名（registry.ts 中按字段提供）需要加入 safelist，否则 UnoCSS 扫描不到
  safelist: ['i-carbon-circle-dash', 'i-carbon-progress-bar', 'i-carbon-checkbox', 'i-carbon-jump-link'],
  shortcuts: {
    'fc': 'flex justify-center items-center',
    'page-wrap': 'mx-auto max-w-[1120px] px-3 py-7 md:px-4 md:py-12 lg:py-16',
    'hero-shell': 'relative overflow-hidden rounded-[28px] border border-[#66493224] bg-gradient-to-br from-[#fff8ee] to-[#faefe2] p-7 shadow-[0_24px_60px_rgba(77,52,33,0.12)] md:p-10',
    'panel-card': '!rounded-[24px] !border !border-[#6649321f] !bg-[rgba(255,252,247,0.88)] !shadow-none backdrop-blur-[14px]',
    'panel-row': 'flex flex-col items-start gap-4 rounded-[16px] bg-[rgba(250,241,230,0.72)] px-4 py-[14px] md:flex-row md:items-center md:justify-between',
    'section-heading': 'flex flex-col items-start gap-4 text-[#24170f] font-semibold md:flex-row md:items-center md:justify-between',
    'pill-code': 'rounded-full bg-[rgba(36,23,15,0.08)] px-[10px] py-[6px] text-sm text-[#24170f]',
  },
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
