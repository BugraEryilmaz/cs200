<script lang="ts">
  import type { LedArray_t } from "../types/input";

  const width = 12;
  const height = 10;
  export let ledArray: LedArray_t = {
    r: Array.from({ length: height }, () => 0),
    g: Array.from({ length: height }, () => 0),
    b: Array.from({ length: height }, () => 0),
  };
  let r: number[][];
  let g: number[][];
  let b: number[][];
  $: {
    r = Array.from({ length: width }, (_, widx) =>
      Array.from({ length: height }, (_, hidx) => {
        if (!ledArray.r) return 0;
        return (ledArray.r[hidx] & (1 << widx)) > 0 ? 1 : 0;
      })
    );
    g = Array.from({ length: width }, (_, widx) =>
      Array.from({ length: height }, (_, hidx) => {
        if (!ledArray.g) return 0;
        return (ledArray.g[hidx] & (1 << widx)) > 0 ? 1 : 0;
      })
    );
    b = Array.from({ length: width }, (_, widx) =>
      Array.from({ length: height }, (_, hidx) => {
        if (!ledArray.b) return 0;
        return (ledArray.b[hidx] & (1 << widx)) > 0 ? 1 : 0;
      })
    );
  }
</script>

<!-- Show an array of 1s and 0s depending on the value of leds at each bit -->
{#each r as ledcolumn, i}
  <div class="led-row">
    {#each ledcolumn as led, j}
      <div
        class="led"
        style="background-color: rgb({r[i][j] === 1 ? 255 : 0}, {g[i][j] === 1
          ? 255
          : 0}, {b[i][j] === 1 ? 255 : 0});"
      >
        {led ? "" : ""}
      </div>
    {/each}
  </div>
{/each}

<style>
  .led-row {
    display: inline-block;
    margin: 0;
  }

  .led {
    width: 30px;
    height: 20px;
    border: 1px solid grey;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgb(255, 255, 255);
  }
</style>
