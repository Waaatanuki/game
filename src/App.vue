<script setup lang="ts">
const activeTab = ref<'commands' | 'checklist'>('commands')

const stack = [
  'Vite 8',
  'Vue 3',
  'TypeScript',
  'Element Plus',
  'UnoCSS',
  'unplugin-auto-import',
  '@antfu/eslint-config',
]

const commands = [
  {
    name: '启动开发环境',
    value: 'pnpm dev',
  },
  {
    name: '类型检查',
    value: 'pnpm typecheck',
  },
  {
    name: '代码检查',
    value: 'pnpm lint',
  },
  {
    name: '自动修复格式',
    value: 'pnpm lint:fix',
  },
  {
    name: '生产构建',
    value: 'pnpm build',
  },
]

const checklist = [
  'Element Plus 组件按需解析',
  'Vue API 自动导入',
  '组件自动注册',
  'UnoCSS 原子化样式',
  'Antfu Flat ESLint 配置',
  '~ 别名映射到 src',
]

const readyCount = computed(() => stack.length)
</script>

<template>
  <main class="page-wrap">
    <section class="hero-shell">
      <div class="pointer-events-none absolute left-[-32px] top-[-52px] h-40 w-40 rounded-full bg-[#f5b76e]/35 blur-3xl" />
      <div class="pointer-events-none absolute right-[-18px] top-10 h-24 w-24 rounded-full bg-[#e0a667]/20 blur-2xl" />

      <div class="relative">
        <p class="mb-3 text-sm text-[#9a5c1f] font-bold tracking-[0.18em] uppercase">
          Vite + Vue 3 + TypeScript + Element Plus
        </p>
        <h1 class="m-0 text-[#24170f] text-[clamp(36px,5vw,62px)] leading-[1.05] tracking-[-0.04em]">
          一个已经带好工程规范的前端起点
        </h1>
        <p class="mt-5 max-w-[720px] text-lg text-[#24170fc2] leading-[1.75]">
          当前项目已完成 UI 库接入、自动导入、路径别名、UnoCSS 与 Antfu ESLint 规范，可以直接开始写业务。
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <el-button type="primary" size="large">
            开始开发
          </el-button>
          <el-button plain size="large">
            查看依赖栈
          </el-button>
        </div>
      </div>
    </section>

    <el-alert
      class="mt-[18px] border border-emerald-200/70 rounded-[20px] shadow-sm"
      title="已启用 Element Plus 组件自动注册与 Vue API 自动导入"
      type="success"
      :closable="false"
      show-icon
    />

    <section class="grid mt-[18px] gap-[18px] md:grid-cols-2">
      <el-card shadow="never" class="panel-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_20px_45px_rgba(77,52,33,0.12)]">
        <el-statistic title="已接入能力" :value="readyCount" />
        <p class="mt-3 text-[#24170fad]">
          基础工程能力已经到位，后续只需要补业务模块。
        </p>
      </el-card>

      <el-card shadow="never" class="panel-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_20px_45px_rgba(77,52,33,0.12)]">
        <el-statistic title="常用命令" :value="commands.length" />
        <p class="mt-3 text-[#24170fad]">
          开发、检查和构建命令已经预置完成。
        </p>
      </el-card>
    </section>

    <section class="grid mt-[18px] gap-[18px] lg:grid-cols-[1.1fr_1fr]">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="section-heading">
            <span>技术栈</span>
            <el-tag type="warning" effect="light">
              已就绪
            </el-tag>
          </div>
        </template>

        <div class="flex flex-wrap gap-3">
          <el-tag
            v-for="item in stack"
            :key="item"
            class="m-0"
            effect="plain"
            round
          >
            {{ item }}
          </el-tag>
        </div>
      </el-card>

      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="section-heading">
            <span>项目面板</span>
            <el-tag type="success" effect="light">
              自动导入示例
            </el-tag>
          </div>
        </template>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="开发命令" name="commands">
            <ul class="grid m-0 list-none gap-3 p-0">
              <li v-for="item in commands" :key="item.value" class="panel-row">
                <span>{{ item.name }}</span>
                <code class="pill-code font-mono">{{ item.value }}</code>
              </li>
            </ul>
          </el-tab-pane>

          <el-tab-pane label="初始化清单" name="checklist">
            <ul class="grid m-0 list-none gap-3 p-0">
              <li v-for="item in checklist" :key="item" class="flex flex-col items-start gap-4 rounded-[16px] bg-[rgba(250,241,230,0.72)] px-4 py-[14px] md:flex-row md:items-center md:justify-start">
                <el-tag type="success" effect="dark">
                  完成
                </el-tag>
                <span>{{ item }}</span>
              </li>
            </ul>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </section>
  </main>
</template>
