<script lang="ts" type="module">
  import { onMount } from "svelte";
  import type {
    BoardUpdate_t,
    LedArray_t,
    UpdateInput_t,
  } from "../types/input";
  import LedArray from "./LedArray.svelte";
  import SevenSegmentArray from "./SevenSegmentArray.svelte";

  let ledArray: LedArray_t = {
    width: 12,
    height: 10,
    value: 0,
    direction: "output",
  };
  let enable: Boolean = false;

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      console.log(message);
      if (message.type === "boardUpdate") {
        // parse the body of the message
        const data = message.body as BoardUpdate_t;
        if (data.ledArray) ledArray = data.ledArray;
        console.log(data);
      }
    });
  });

  function changeInput(input: string, value: number) {
    let args: UpdateInput_t = {
      name: input,
      value: value,
      type: "number",
    };
    tsvscode.postMessage({
      command: "updateInput",
      arguments: args,
    });
  }
</script>

<button
  class:notactive={!enable}
  on:click={() => {
    enable = !enable;
    changeInput("enable", enable ? 1 : 0);
    console.log("enable " + enable);
  }}
>
  enable
</button>

<SevenSegmentArray values={[0, 1, 2, 3]} />

<LedArray
  width={ledArray.width}
  height={ledArray.height}
  leds={Number(ledArray.value)}
/>

<style>
  .notactive {
    background-color: #cdcdcd;
    color: var(--vscode-button-background);
  }
</style>
