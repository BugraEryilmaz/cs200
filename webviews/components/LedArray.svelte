<script lang="ts">
  export let width: number | undefined;
  export let height: number | undefined;
  export let leds: number;
  let ledArray: boolean[][] = [];
  $: {
    if (width !== undefined && height !== undefined) {
      if (ledArray.length !== height) {
        ledArray = new Array(height);
        for (let i = 0; i < height; i++) {
          ledArray[i] = new Array(width).fill(false);
        }
        console.log("ledArray.length !== height");
      }

      if (ledArray[0].length !== width) {
        ledArray = new Array(height);
        for (let i = 0; i < height; i++) {
          ledArray[i] = new Array(width).fill(false);
        }
        console.log("ledArray[0].length !== width");
      }

      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          ledArray[j][i] =
            (leds & (1 << ((height - j - 1) * width + width - i - 1))) !== 0;
          console.log("ledArray j:" + j + " i:" + i + " " + ledArray[j][i]);
          console.log(ledArray);
        }
      }
      console.log(ledArray);
    }
  }
</script>

<!-- Show an array of 1s and 0s depending on the value of leds at each bit -->
{#each ledArray as ledrow, i}
  <div class="led-row">
    {#each ledrow as led, j}
      <div class="led" style="background-color: {led ? 'red' : 'black'};">
        {led ? "1" : "0"}
      </div>
    {/each}
  </div>
{/each}

<style>
  .led-row {
    display: flex;
  }

  .led {
    width: 20px;
    height: 20px;
    border: 1px solid black;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
