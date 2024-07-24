<script lang="ts">
  export let value: boolean = false;
  export let size = 50;
  export let margin = 10;
</script>

<button
  class="pushButtons"
  style="width: {size}px; height: {size}px; margin: {margin}px;"
  class:active={value}
  on:mousedown|preventDefault={() => {
    value = true;
  }}
  on:mouseup|preventDefault={() => {
    value = false;
  }}
  on:mouseleave|preventDefault={() => {
    value = false;
  }}
>
</button>

<style>
  .pushButtons {
    background-color: #cdcdcd;
    color: var(--vscode-button-background);
  }
  .pushButtons:active {
    color: #cdcdcd;
    background-color: var(--vscode-button-background);
  }
</style>
