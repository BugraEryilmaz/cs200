<script lang="ts">
  import SevenSegment from "./SevenSegment.svelte";
  export let values: number[] = [0, 0, 0, 0];
</script>

<div class="SevenSegments">
  <SevenSegment value={values[0]} />
  <SevenSegment value={values[1]} />
  <SevenSegment value={values[2]} />
  <SevenSegment value={values[3]} />
</div>

<style>
  .SevenSegments {
    display: block;
    overflow: hidden;
    justify-content: left;
  }
</style>
