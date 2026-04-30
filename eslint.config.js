import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  unocss: true,
  formatters: true,
  rules: {
    'node/prefer-global/process': 'off',
  },
  ignores: [
    'dist',
  ],
})
