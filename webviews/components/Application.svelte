<script lang="ts" type="module">
  import { onMount } from "svelte";
  import type { InputOutputMessage } from "../types/input";
  import LedArray from "./LedArray.svelte";

  let running = false;
  let outputs: { [name: string]: InputOutputMessage } = {};
  let inputs: { [name: string]: InputOutputMessage } = {};

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      console.log(message);
      if (message.type === "terminal-output") {
        const data = message.value as [InputOutputMessage];
        for (let item of data) {
          if (item.type === "binary" && typeof item.value === "string") {
            item.value = item.value === "true";
          } else if (typeof item.value === "string") {
            item.value = Number(item.value);
          }
          if (item.direction === "output") {
            outputs[item.name] = item;
            console.log(item);
          } else if (item.direction === "input") {
            inputs[item.name] = item;
            console.log(item);
            console.log(typeof item.value);
          }
        }
      }
    });
    setTimeout(() => {
      tsvscode.postMessage({
        type: "terminal-input",
        value: '{"command": "getinputs"}',
      });
    }, 10);
  });

  function changeInput(input: string, value: string | number | boolean) {
    tsvscode.postMessage({
      type: "terminal-input",
      value: `{"command": "inputs", "${input}": "${value}"}`,
    });
  }

  function runcycle(getResults: boolean = true) {
    tsvscode.postMessage({
      type: "terminal-input",
      value: `{"command": "runcycle", "getResults": ${getResults}}`,
    });
  }

  function run() {
    if (running) {
      runcycle(false);
      setTimeout(run, 100);
    } else {
      // setTimeout(() => {
      //     runcycle(true);
      // }, 100);
    }
  }
</script>

{#each Object.entries(inputs) as input}
  <div class="menu">
    {#if input[1].type === "binary"}
      <button
        class:notactive={!input[1].value}
        on:click={() => {
          inputs[input[0]].value = !inputs[input[0]].value;
          changeInput(input[0], inputs[input[0]].value);
          console.log(input[1]);
        }}
      >
        {input[0]}
      </button>
    {:else}
      <span>{input[0]}:</span>
      <input type="number" bind:value={input[1]} />
    {/if}
  </div>
{/each}

<button
  on:click={() => {
    runcycle();
  }}
>
  Run Cycle
</button>
<button
  on:click={() => {
    running = !running;
    run();
  }}
>
  {running ? "Stop" : "Run"}
</button>

{#each Object.entries(outputs) as output}
  {#if output[1].type === "ledarray"}
    <LedArray
      width={output[1]?.width}
      height={output[1].height}
      leds={Number(output[1].value)}
    />
  {:else}
    <div class="menu">
      <span>{output[0]}:</span>
      <span>{output[1].value}</span>
    </div>
  {/if}
{/each}

<style>
  .notactive {
    background-color: #cdcdcd;
    color: var(--vscode-button-background);
  }
</style>
