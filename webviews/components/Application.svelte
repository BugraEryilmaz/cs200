<script lang="ts" type="module">
  import { onMount } from "svelte";
  import type {
    BoardUpdate_t,
    LedArray_t,
    SevenSegment_t,
    UpdateInput_t,
  } from "../types/input";
  import LedArray from "./LedArray.svelte";
  import SevenSegmentArray from "./SevenSegmentArray.svelte";

  let ledArray: LedArray_t = {};

  let sevenSegment: SevenSegment_t = {};

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data;
      console.log(message);
      if (message.type === "boardUpdate") {
        // parse the body of the message
        const data = message.body as BoardUpdate_t;
        ledArray = data.ledArray;
        sevenSegment = data.sevenSegment;
        console.log(data);
      }
    });
  });

  function changeInput(input: string, value: number) {
    let args: UpdateInput_t = {
      joystick: {},
      button: {},
    };
    tsvscode.postMessage({
      command: "updateInput",
      arguments: args,
    });
  }
</script>

<SevenSegmentArray
  zero={sevenSegment.zero}
  one={sevenSegment.one}
  two={sevenSegment.two}
  three={sevenSegment.three}
/>

<LedArray {ledArray} />

<style>
  .notactive {
    background-color: #cdcdcd;
    color: var(--vscode-button-background);
  }
</style>
