import { defineConfig, presetAttributify, presetIcons, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  // 动态绑定的图标类名（registry.ts 中按字段提供）需要加入 safelist，否则 UnoCSS 扫描不到
  safelist: ['i-carbon-circle-dash', 'i-carbon-progress-bar', 'i-carbon-checkbox', 'i-carbon-jump-link', 'i-carbon-table-split'],
  shortcuts: {
    fc: 'flex justify-center items-center',
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
