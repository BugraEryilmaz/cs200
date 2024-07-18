<script lang="ts">
    import Apastrophe from "./Apastrophe.svelte";
    import Colon from "./Colon.svelte";
  import SevenSegment from "./SevenSegment.svelte";
  export let values: number[] = [0, 0, 0, 0];
</script>

<div class="SevenSegments">
  <SevenSegment value={values[0]} />
  <SevenSegment value={values[1]} />
  <Colon value={values[4]}/>
  <SevenSegment value={values[2]} />
  <Apastrophe value={values[4]}/>
  <SevenSegment value={values[3]} />
</div>

<style>
  .SevenSegments {
    display: flex;
    overflow: hidden;
    justify-content: left;
  }
</style>
