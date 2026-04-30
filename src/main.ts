import { createApp } from 'vue'

import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '~/style.css'

createApp(App).mount('#app')
