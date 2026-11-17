<script setup lang="ts">
import type { GameMeta } from '~/games/registry'
import { Background as IslandBackground, Button as IslandButton, Card as IslandCard, Divider as IslandDivider, Icon as IslandIcon, Tag as IslandTag, Title as IslandTitle, Notification } from 'animal-island-vue'
import { games } from '~/games/registry'

const router = useRouter()
const readyGames = games.filter(game => game.available)
const multi = games.filter(game => game.multiplayer).length

function randomGame() {
  const game = readyGames[Math.floor(Math.random() * readyGames.length)]
  if (game)
    router.push(game.to)
}

function visitGame(event: MouseEvent, game: GameMeta) {
  if (!game.available) {
    event.preventDefault()
    Notification.info('这款小游戏正在制作中，敬请期待 ✨')
  }
}

function browseGames() {
  document.querySelector('#games')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
</script>

<template>
  <main class="page-wrap island-home">
    <section class="welcome-section" aria-labelledby="welcome-title">
      <IslandBackground type="sprinkles" class="welcome-paper">
        <div class="welcome-copy">
          <IslandTitle color="app-green" size="small">
            欢迎来到小游戏岛
          </IslandTitle>
          <p class="island-eyebrow">
            A LITTLE ISLAND, A LITTLE JOY
          </p>
          <h1 id="welcome-title">
            今天，也来<br>岛上<span class="play-word">玩一会儿<svg viewBox="0 0 200 15" aria-hidden="true"><path d="M4 9 Q70 0 196 8 M20 14 Q100 6 178 12" /></svg></span>。
          </h1>
          <p class="welcome-description">
            把忙碌暂时放在岸边。<br>一个人动动脑，或叫上朋友，轻松开一局。
          </p>
          <div class="welcome-actions">
            <IslandButton type="primary" size="large" @click="browseGames">
              <template #icon>
                <IslandIcon name="Play" :size="22" />
              </template>
              挑一个，开始玩
            </IslandButton>
            <IslandButton type="text" @click="randomGame">
              <template #icon>
                <IslandIcon name="Compass" :size="22" />
              </template>
              随便逛逛
            </IslandButton>
          </div>
          <div class="island-facts">
            <span><IslandIcon name="Flag" :size="18" /> {{ readyGames.length }} 个快乐据点</span>
            <span><IslandIcon name="Users" :size="18" /> {{ multi }} 款可约朋友</span>
            <span><IslandIcon name="Leaf" :size="18" /> 打开就能玩</span>
          </div>
        </div>
        <div class="welcome-scene">
          <IslandScene />
        </div>
      </IslandBackground>
      <span class="paper-hole paper-hole-left" aria-hidden="true" />
      <span class="paper-hole paper-hole-right" aria-hidden="true" />
    </section>

    <section id="games" class="game-map" aria-labelledby="games-title">
      <div class="map-heading">
        <div>
          <p class="island-eyebrow">
            PICK YOUR LITTLE ADVENTURE
          </p>
          <h2 id="games-title">
            <IslandTitle variant="layer" color="app-teal">
              小岛游玩地图
            </IslandTitle>
          </h2>
        </div>
        <p class="map-note">
          <IslandIcon name="Map" :size="28" /> 选一站，快乐就出发
        </p>
      </div>
      <div class="game-grid">
        <RouterLink
          v-for="(game, index) in games"
          :key="game.id"
          :to="game.to"
          class="game-card-link"
          :aria-label="`${game.name}，${game.available ? '开始游玩' : '即将上线'}`"
          @click="visitGame($event, game)"
        >
          <IslandCard :pattern="game.color" hoverable class="game-card" :class="`game-card-${game.id}`">
            <div class="card-topline">
              <span class="stop-number">STOP 0{{ index + 1 }}</span>
              <IslandTag size="small" :color="game.multiplayer ? 'app-teal' : 'purple'" variant="soft">
                {{ game.multiplayer ? '可联机' : '一个人也好玩' }}
              </IslandTag>
            </div>
            <GamePreview :game="game.id" />
            <h3>
              <IslandTitle :color="game.color" size="small">
                {{ game.name }}
              </IslandTitle>
            </h3>
            <p class="game-description">
              {{ game.desc }}
            </p>
            <IslandDivider type="hairline" />
            <div class="card-bottomline">
              <span><IslandIcon name="Users" :size="17" /> {{ game.players }}</span>
              <span class="start-label">{{ game.available ? '开始游玩' : '即将上线' }} <IslandIcon name="ArrowRight" :size="22" /></span>
            </div>
          </IslandCard>
        </RouterLink>
      </div>
    </section>

    <footer class="island-footer">
      <IslandDivider icon="Leaf" :icon-size="20" :icon-gap="36" />
      <p><IslandIcon name="CoffeeCup" :size="24" /> 不赶时间，玩得开心就好。</p>
      <span>小游戏岛 · 随时欢迎你回来</span>
    </footer>
  </main>
</template>

<style scoped>
.island-home {
  padding-top: 36px;
}
.welcome-section {
  position: relative;
}
.welcome-paper {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 20px;
  padding: 52px 42px 42px;
  border: 2px solid #e6dab9;
  border-radius: 16px 52px 16px 52px;
  box-shadow:
    0 8px 0 #b3c5a5,
    0 16px 30px #617e5912;
}
.welcome-copy {
  position: relative;
  z-index: 1;
}
.welcome-copy::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: -24px -15px;
  border-radius: 50%;
  background: #fdf3e3;
  filter: blur(18px);
}
.island-eyebrow {
  margin: 23px 0 14px;
  color: #7b9678;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.2em;
}
h1 {
  margin: 0;
  color: #695136;
  font-size: clamp(34px, 4vw, 49px);
  font-weight: 900;
  line-height: 1.5;
  letter-spacing: 0.02em;
}
.play-word {
  position: relative;
  white-space: nowrap;
  color: #4f8a69;
}
.play-word svg {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 15px;
  fill: none;
  stroke: #e3ba59;
  stroke-width: 4;
  stroke-linecap: round;
}
.welcome-description {
  margin: 22px 0;
  color: #998768;
  font-size: 15px;
  line-height: 1.9;
}
.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.welcome-actions :deep(.animal-btn--primary) {
  background: #7bbd98;
  border-color: #7bbd98;
  color: #fffdf0;
  box-shadow: 0 5px #4d8a6b;
}
.island-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
  color: #96866c;
  font-size: 11px;
}
.island-facts span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.welcome-scene {
  display: flex;
  justify-content: center;
  padding: 12px;
}
.paper-hole {
  position: absolute;
  top: 15px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b6bd98;
  box-shadow: inset 0 2px 2px #7a8b5b66;
}
.paper-hole-left {
  left: 24px;
}
.paper-hole-right {
  right: 30px;
}
.game-map {
  padding-top: 48px;
  scroll-margin-top: 88px;
}
.map-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin: 0 10px 30px;
}
.map-heading .island-eyebrow {
  margin: 0 0 14px;
}
h2 {
  margin: 0;
  font-size: inherit;
}
.map-note {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #809474;
  font-size: 13px;
}
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.game-card-link {
  display: block;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  border-radius: 24px;
}
.game-card-link:focus-visible {
  outline: 3px solid var(--app-accent);
  outline-offset: 6px;
}
.game-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 18px 18px 14px;
  border-width: 2px;
  border-radius: 24px 24px 32px 24px;
  box-shadow: 0 6px 0 #8f8b6e24;
}
.card-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.stop-number {
  font-size: 10px;
  letter-spacing: 0.12em;
  font-weight: 900;
  color: #9c947d;
}
h3 {
  margin: 10px 0 18px;
  text-align: center;
}
.game-description {
  flex: 1;
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.85;
  color: #8a785e;
}
.card-bottomline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  color: #9b886b;
  font-size: 11px;
}
.card-bottomline > span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.card-bottomline .start-label {
  color: #5a8d70;
  font-size: 12px;
  font-weight: 800;
}
.island-footer {
  max-width: 420px;
  margin: 48px auto 0;
  text-align: center;
  color: #8f9a7f;
}
.island-footer p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 18px 0 6px;
  font-size: 14px;
}
.island-footer > span {
  font-size: 11px;
  letter-spacing: 0.1em;
}
html.dark .welcome-paper {
  border-color: #66755b;
  background-color: #303b30;
  box-shadow: 0 8px 0 #1b2921;
}
html.dark .welcome-copy::before {
  background: #303b30;
}
html.dark h1 {
  color: #f1e6cb;
}
html.dark .play-word {
  color: #abd4a4;
}
html.dark .welcome-description,
html.dark .game-description {
  color: #c0c4ae;
}
html.dark .island-facts,
html.dark .map-note,
html.dark .stop-number,
html.dark .card-bottomline,
html.dark .island-footer {
  color: #aaba9d;
}
html.dark .start-label {
  color: #a7d5b6;
}
@media (max-width: 1000px) {
  .welcome-paper {
    padding: 42px 28px 32px;
  }
  .game-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .welcome-paper {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 36px 24px 28px;
  }
  .welcome-copy {
    text-align: center;
  }
  .welcome-copy::before {
    inset: -12px;
  }
  .welcome-actions,
  .island-facts {
    justify-content: center;
  }
  .welcome-scene {
    padding: 10px 16px;
  }
  .map-note {
    display: none;
  }
}
@media (max-width: 480px) {
  .island-home {
    padding-top: 20px;
  }
  .welcome-paper {
    padding: 34px 16px 24px;
    border-radius: 14px 32px 14px 32px;
  }
  h1 {
    font-size: 32px;
  }
  .island-eyebrow {
    font-size: 8px;
  }
  .welcome-scene {
    padding: 8px;
  }
  .game-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .game-card {
    padding: 20px 24px;
  }
  .game-map {
    padding-top: 38px;
  }
  .map-heading {
    margin-left: 7px;
  }
}
</style>
