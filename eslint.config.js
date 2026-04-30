import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  ignores: [
    'dist',
    'auto-imports.d.ts',
    'components.d.ts',
  ],
})
