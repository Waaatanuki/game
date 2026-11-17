<script setup lang="ts">
defineProps<{ game: string }>()

const sudoku = ['2', '', '7', '', '5', '', '4', '', '9']
const marks = ['×', '', '○', '', '×', '', '○', '', '×']
</script>

<template>
  <div class="game-preview" :class="`preview-${game}`" aria-hidden="true">
    <div v-if="game === 'gomoku'" class="mini-gomoku">
      <span v-for="n in 25" :key="n" :class="{ black: [7, 12, 17].includes(n), white: [8, 13, 19].includes(n) }" />
    </div>
    <div v-else-if="game === 'halma'" class="mini-halma">
      <span v-for="n in 25" :key="n" :class="{ red: [1, 2, 3, 6, 7, 11].includes(n), blue: [15, 19, 20, 23, 24, 25].includes(n) }" />
    </div>
    <div v-else class="mini-squares" :class="{ 'mini-sudoku': game === 'sudoku' }">
      <span v-for="(mark, i) in game === 'sudoku' ? sudoku : marks" :key="i" :class="{ circle: mark === '○' }">{{ mark }}</span>
    </div>
  </div>
</template>

<style scoped>
.game-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
}
.mini-gomoku {
  display: grid;
  grid-template-columns: repeat(5, 23px);
  grid-template-rows: repeat(5, 23px);
  padding: 8px;
  border: 5px solid #c6985e;
  border-radius: 12px;
  background:
    repeating-linear-gradient(0deg, transparent 0 22px, #b48d58 22px 23px) 8px 8px / 23px 23px,
    repeating-linear-gradient(90deg, transparent 0 22px, #b48d58 22px 23px) 8px 8px / 23px 23px,
    #edce95;
  box-shadow: 0 6px 0 #a77c4b;
  transform: rotate(-7deg) scale(0.9);
}
.mini-gomoku span {
  width: 18px;
  height: 18px;
  margin: 2px;
  border-radius: 50%;
}
.mini-gomoku .black {
  background: #4d5147;
  box-shadow:
    inset 2px 2px 0 #717667,
    0 2px 2px #927b50;
}
.mini-gomoku .white {
  background: #fffdf0;
  box-shadow:
    inset -2px -2px 0 #d7d2ba,
    0 2px 2px #927b50;
}
.mini-halma {
  display: grid;
  grid-template-columns: repeat(5, 18px);
  gap: 7px;
  padding: 12px;
  border-radius: 24px;
  background: #fcf3dd;
  box-shadow: 0 6px 0 #c6bca3;
  transform: rotate(7deg) scale(0.9);
}
.mini-halma span {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e9ddc4;
  box-shadow: inset 0 2px 0 #d7c9ae;
}
.mini-halma .red {
  background: #e8847a;
  box-shadow:
    inset 2px 2px 0 #f5b0a4,
    0 2px 0 #b45e60;
}
.mini-halma .blue {
  background: #8aafd0;
  box-shadow:
    inset 2px 2px 0 #b7d3e6,
    0 2px 0 #5d849f;
}
.mini-squares {
  display: grid;
  grid-template-columns: repeat(3, 36px);
  grid-template-rows: repeat(3, 36px);
  gap: 3px;
  padding: 9px;
  background: #a8c6c9;
  border-radius: 16px;
  box-shadow: 0 6px 0 #7f9fa7;
  transform: rotate(7deg);
}
.mini-squares span {
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: #fffbee;
  color: #cb7966;
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}
.mini-squares .circle {
  color: #669c98;
}
.mini-sudoku {
  background: #b3a5c7;
  box-shadow: 0 6px 0 #9181a8;
  transform: rotate(-5deg);
}
.mini-sudoku span {
  color: #89749b;
  font-size: 22px;
}
</style>
