<script lang="ts">
  import SevenSegment from "./SevenSegment.svelte";
  export let zero: number = 0;
  export let one: number = 0;
  export let two: number = 0;
  export let three: number = 0;
</script>

<div class="SevenSegments">
  <SevenSegment value={three} />
  <SevenSegment value={two} />
  <SevenSegment value={one} />
  <SevenSegment value={zero} />
</div>

<style>
  .SevenSegments {
    display: flex;
    overflow: hidden;
    justify-content: left;
  }
</style>
