<script lang="ts">
  export let value: number = 0;
  let switches: boolean[] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];
  $: {
    value = switches.reduce((acc, val, idx) => {
      return acc + (val ? 1 << (7 - idx) : 0);
    }, 0);
  }
</script>

<div class="dipswitch">
  {#each switches as switchValue, idx}
    <div class="item">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span
        class="switch"
        class:on={switchValue}
        on:click={() => {
          switchValue = !switchValue;
        }}
      >
        <span class="knob"></span>
      </span>
      <span class="symbol"> {idx + 1} </span>
    </div>
  {/each}
</div>

<style>
  .dipswitch {
    display: inline-block;
    /* background: rgb(255, 0, 0); */
    overflow: hidden;
    padding: 5px;
    border-radius: 2px;
    box-shadow: inset 0 -4px 15px rgba(0, 0, 0, 0.25);
  }
  .dipswitch .item {
    float: left;
    width: 10px;
    margin-right: 5px;
  }
  .dipswitch .item:last-child {
    margin-right: 0;
  }
  .dipswitch .symbol {
    text-align: center;
    color: white;
    font-size: 12px;
    line-height: 20px;
    margin-top: 4px;
    font-family: sans-serif;
    display: block;
    text-shadow: 0 2px 1px rgba(0, 0, 0, 0.1);
  }
  .dipswitch .switch {
    display: block;
    position: relative;
    width: 10px;
    height: 40px;
    background: #ccc;
    overflow: hidden;
    border-radius: 2px;
    cursor: pointer;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.4);
  }
  .dipswitch .switch.on {
    background: var(--vscode-button-background);
    transition: all 0.2s;
  }
  .dipswitch .switch .knob {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 50%;
    background: white;
    box-shadow:
      inset 0 0 5px rgba(0, 0, 0, 0.2),
      0 -5px 20px rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    transition: all 0.2s;
  }
  .dipswitch .switch:hover .knob {
    box-shadow:
      inset 0 0 5px rgba(0, 0, 0, 0.2),
      0 -5px 20px rgba(0, 0, 0, 0.6);
  }
  .dipswitch .switch.on .knob {
    top: 0;
    box-shadow:
      inset 0 0 5px rgba(0, 0, 0, 0.2),
      0 5px 20px rgba(0, 0, 0, 0.3);
  }
  .dipswitch .switch.on:hover .knob {
    box-shadow:
      inset 0 0 5px rgba(0, 0, 0, 0.2),
      0 5px 20px rgba(0, 0, 0, 0.6);
  }
</style>
