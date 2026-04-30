<script setup lang="ts">
import { games } from '~/games/registry'

const router = useRouter()

function open(to: string, available: boolean) {
  if (!available)
    return ElMessage.info('这款小游戏正在制作中，敬请期待 ✨')
  router.push(to)
}

const total = games.length
const ready = games.filter(g => g.available).length
const multi = games.filter(g => g.multiplayer).length
</script>

<template>
  <div class="page-wrap">
    <section class="hero-shell">
      <div class="pointer-events-none absolute left-[-32px] top-[-52px] h-40 w-40 rounded-full bg-amber-400/30 blur-3xl" />
      <div class="pointer-events-none absolute right-[-18px] top-10 h-24 w-24 rounded-full bg-orange-400/25 blur-2xl" />

      <div class="relative">
        <p class="hero-eyebrow">
          MINI GAMES · 在浏览器里随手开局
        </p>
        <h1 class="hero-title">
          挑一款小游戏，开始游玩
        </h1>
        <p class="hero-desc">
          点击任意一款即可进入对应界面。多人游戏通过 WebRTC 直连完成，无需服务器。
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <el-tag round size="large" type="warning" effect="light">
            共 {{ total }} 款
          </el-tag>
          <el-tag round size="large" type="success" effect="light">
            可游玩 {{ ready }} 款
          </el-tag>
          <el-tag round size="large" type="primary" effect="light">
            支持联机 {{ multi }} 款
          </el-tag>
        </div>
      </div>
    </section>

    <section class="grid mt-[22px] gap-[18px] lg:grid-cols-3 sm:grid-cols-2">
      <article
        v-for="game in games"
        :key="game.id"
        class="game-card group"
        :class="{ 'opacity-70': !game.available }"
        @click="open(game.to, game.available)"
      >
        <div class="game-card-glow" :class="`bg-gradient-to-br ${game.accent}`" />

        <div class="relative flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="game-icon">
              <i :class="game.icon" />
            </div>
            <el-tag
              v-if="game.multiplayer"
              size="small"
              type="primary"
              effect="light"
              round
            >
              联机
            </el-tag>
            <el-tag
              v-else
              size="small"
              type="info"
              effect="plain"
              round
            >
              单机
            </el-tag>
          </div>

          <div>
            <h3 class="m-0 text-xl text-[color:var(--app-text)] font-semibold">
              {{ game.name }}
            </h3>
            <p class="mt-2 text-sm text-[color:var(--app-text-muted)] leading-[1.7]">
              {{ game.desc }}
            </p>
          </div>

          <div class="flex items-center justify-between text-xs text-[color:var(--app-text-muted)]">
            <span class="inline-flex items-center gap-1">
              <i class="i-carbon-user-multiple" />
              {{ game.players }}
            </span>
            <span
              class="inline-flex items-center gap-1 text-[color:var(--app-accent)] font-semibold transition-transform group-hover:translate-x-1"
            >
              {{ game.available ? '开始游玩' : '即将上线' }}
              <i class="i-carbon-arrow-right" />
            </span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.hero-eyebrow {
  margin-bottom: 12px;
  color: var(--app-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.hero-title {
  margin: 0;
  color: var(--app-text);
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1.05;
  letter-spacing: -0.04em;
}
.hero-desc {
  margin-top: 18px;
  max-width: 720px;
  color: var(--app-text-muted);
  font-size: 17px;
  line-height: 1.75;
}
.game-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 22px;
  border-radius: 22px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 40px rgba(15, 15, 30, 0.18);
  border-color: var(--app-accent);
}
.game-card-glow {
  position: absolute;
  inset: -40% -40% auto auto;
  width: 220px;
  height: 220px;
  border-radius: 9999px;
  filter: blur(60px);
  opacity: 0.55;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.game-card:hover .game-card-glow {
  opacity: 0.85;
}
.game-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 24px;
  align-items: center;
  justify-content: center;
}
</style>
