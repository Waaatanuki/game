<script setup lang="ts">
import { Background as IslandBackground, Icon as IslandIcon, Title as IslandTitle } from 'animal-island-vue'
</script>

<template>
  <div class="island-postcard" aria-hidden="true">
    <span class="postcard-tape" />
    <IslandBackground type="dots-dark-green" class="postcard-scene">
      <IslandIcon name="Sun" :size="64" class="scene-sun" />
      <IslandIcon name="Cloud" :size="76" class="scene-cloud" />
      <div class="island-ground" />
      <IslandIcon name="Tree" :size="146" class="scene-tree" />
      <IslandIcon name="Flower" :size="42" class="scene-flower" />
      <IslandIcon name="Bear" :size="118" class="scene-bear" />
      <IslandIcon name="Fox" :size="108" class="scene-fox" />
      <div class="scene-game">
        <GamePreview game="tictactoe" />
      </div>
      <IslandIcon name="Leaf" :size="36" class="scene-leaf" />
      <span class="scene-sparkle">✦</span>
    </IslandBackground>
    <div class="postcard-caption">
      <IslandTitle variant="tab" color="app-yellow" size="small">
        今日营业 · 快乐不限量
      </IslandTitle>
      <span>留一点时间，给简单的快乐。</span>
    </div>
  </div>
</template>

<style scoped>
.island-postcard {
  position: relative;
  width: min(100%, 390px);
  padding: 12px;
  border: 2px solid #e4d9bd;
  border-radius: 8px 8px 28px 8px;
  background: #fffdf2;
  box-shadow: 5px 8px 0 #c5b99b55;
  transform: rotate(4deg);
}
.postcard-tape {
  position: absolute;
  top: -15px;
  left: calc(50% - 45px);
  z-index: 2;
  width: 90px;
  height: 30px;
  background: repeating-linear-gradient(90deg, #f1d27ebf 0 7px, #f7e1a9bf 7px 14px);
  transform: rotate(-8deg);
  clip-path: polygon(0 0, 100% 5%, 98% 23%, 100% 40%, 97% 63%, 100% 83%, 98% 100%, 0 95%, 3% 75%, 0 56%, 3% 34%);
}
.postcard-scene {
  height: 278px;
  min-height: 0;
  overflow: hidden;
  border-radius: 4px 4px 18px 4px;
}
.postcard-scene > :not(.island-ground) {
  position: absolute;
}
.island-ground {
  position: absolute;
  left: 7%;
  right: 7%;
  bottom: 28px;
  height: 118px;
  border: 7px solid #edddab;
  border-radius: 50%;
  background: #8fb785;
  box-shadow:
    0 9px 0 #d8be83,
    0 17px 0 #89beb0;
  transform: rotate(-7deg);
}
.scene-sun {
  top: 18px;
  right: 27px;
  transform: rotate(12deg);
}
.scene-cloud {
  top: 28px;
  left: 25px;
}
.scene-tree {
  top: 45px;
  left: 38px;
  transform: rotate(-8deg);
}
.scene-bear {
  bottom: 48px;
  left: 37px;
  transform: rotate(-5deg);
}
.scene-fox {
  bottom: 49px;
  right: 33px;
  transform: rotate(8deg);
}
.scene-flower {
  bottom: 24px;
  right: 20px;
  transform: rotate(13deg);
}
.scene-leaf {
  top: 101px;
  right: 25px;
  transform: rotate(30deg);
}
.scene-game {
  left: calc(50% - 75px);
  bottom: 4px;
  width: 150px;
  transform: scale(0.6) rotate(-7deg);
}
.scene-sparkle {
  top: 42px;
  left: 49%;
  color: #fffce5;
  font-size: 32px;
}
.postcard-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px 0 6px;
  color: #9a8766;
  font-size: 12px;
}
@media (max-width: 400px) {
  .postcard-scene {
    height: 250px;
  }
  .scene-tree {
    left: 10px;
  }
  .scene-bear {
    left: 10px;
  }
  .scene-fox {
    right: 10px;
  }
}
</style>
