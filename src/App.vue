<script setup lang="ts">
const activeTab = ref<'commands' | 'checklist'>('commands')

const stack = [
  'Vite 8',
  'Vue 3',
  'TypeScript',
  'Element Plus',
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
  'Antfu Flat ESLint 配置',
  '@ 别名映射到 src',
]

const readyCount = computed(() => stack.length)
</script>

<template>
  <main class="page-shell">
    <section class="hero-panel">
      <p class="eyebrow">
        Vite + Vue 3 + TypeScript + Element Plus
      </p>
      <h1>一个已经带好工程规范的前端起点</h1>
      <p class="hero-copy">
        当前项目已完成 UI 库接入、自动导入、路径别名和 Antfu ESLint 规范，可以直接开始写业务。
      </p>
      <div class="hero-actions">
        <el-button type="primary" size="large">
          开始开发
        </el-button>
        <el-button plain size="large">
          查看依赖栈
        </el-button>
      </div>
    </section>

    <el-alert
      title="已启用 Element Plus 组件自动注册与 Vue API 自动导入"
      type="success"
      :closable="false"
      show-icon
    />

    <section class="stats-grid">
      <el-card shadow="hover" class="stat-card">
        <el-statistic title="已接入能力" :value="readyCount" />
        <p class="stat-text">
          基础工程能力已经到位，后续只需要补业务模块。
        </p>
      </el-card>

      <el-card shadow="hover" class="stat-card">
        <el-statistic title="常用命令" :value="commands.length" />
        <p class="stat-text">
          开发、检查和构建命令已经预置完成。
        </p>
      </el-card>
    </section>

    <section class="content-grid">
      <el-card shadow="never" class="feature-card">
        <template #header>
          <div class="card-header">
            <span>技术栈</span>
            <el-tag type="warning" effect="light">
              已就绪
            </el-tag>
          </div>
        </template>

        <div class="tag-group">
          <el-tag
            v-for="item in stack"
            :key="item"
            class="stack-tag"
            effect="plain"
            round
          >
            {{ item }}
          </el-tag>
        </div>
      </el-card>

      <el-card shadow="never" class="feature-card">
        <template #header>
          <div class="card-header">
            <span>项目面板</span>
            <el-tag type="success" effect="light">
              自动导入示例
            </el-tag>
          </div>
        </template>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="开发命令" name="commands">
            <ul class="info-list">
              <li v-for="item in commands" :key="item.value" class="info-item">
                <span>{{ item.name }}</span>
                <code>{{ item.value }}</code>
              </li>
            </ul>
          </el-tab-pane>

          <el-tab-pane label="初始化清单" name="checklist">
            <ul class="check-list">
              <li v-for="item in checklist" :key="item">
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

<style scoped>
.page-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0 64px;
}

.hero-panel {
  padding: 40px;
  border: 1px solid rgba(102, 73, 50, 0.14);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(245, 183, 110, 0.28), transparent 32%),
    linear-gradient(135deg, rgba(255, 248, 238, 0.98), rgba(250, 239, 226, 0.92));
  box-shadow: 0 24px 60px rgba(77, 52, 33, 0.12);
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9a5c1f;
}

h1 {
  margin: 0;
  font-size: clamp(36px, 5vw, 62px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #24170f;
}

.hero-copy {
  max-width: 720px;
  margin: 20px 0 0;
  font-size: 18px;
  line-height: 1.75;
  color: rgba(36, 23, 15, 0.76);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.stats-grid,
.content-grid {
  display: grid;
  gap: 18px;
  margin-top: 18px;
}

.stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.content-grid {
  grid-template-columns: 1.1fr 1fr;
}

.stat-card,
.feature-card {
  border-radius: 24px;
  border-color: rgba(102, 73, 50, 0.12);
  background: rgba(255, 252, 247, 0.88);
  backdrop-filter: blur(14px);
}

.stat-text {
  margin: 12px 0 0;
  color: rgba(36, 23, 15, 0.68);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-weight: 700;
  color: #24170f;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stack-tag {
  margin: 0;
}

.info-list,
.check-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list {
  display: grid;
  gap: 12px;
}

.info-item,
.check-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(250, 241, 230, 0.72);
}

.check-list {
  display: grid;
  gap: 12px;
}

.check-list li {
  justify-content: flex-start;
}

code {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(36, 23, 15, 0.08);
  color: #24170f;
  font-size: 14px;
}

@media (max-width: 900px) {
  .page-shell {
    width: min(100% - 24px, 1120px);
    padding: 28px 0 40px;
  }

  .hero-panel {
    padding: 28px;
  }

  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .info-item,
  .check-list li,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
