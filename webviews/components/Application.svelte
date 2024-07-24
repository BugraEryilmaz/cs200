<script lang="ts" type="module">
  import { onMount } from "svelte";
  import type {
    BoardUpdate_t,
    Buttons_t,
    JoyStick_t,
    LedArray_t,
    SevenSegment_t,
    UpdateInput_t,
  } from "../types/input";
  import LedArray from "./LedArray.svelte";
  import SevenSegmentArray from "./SevenSegmentArray.svelte";
  import PushButton from "./pushButton.svelte";
  import DipSwitches from "./dipSwitches.svelte";
  import JoyStick from "./JoyStick.svelte";

  let ledArray: LedArray_t = {};

  let sevenSegment: SevenSegment_t = {};
  let button: Buttons_t = {};
  let joystick: JoyStick_t = {};
  let dip_switches: number = 0;

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

  $: {
    changeInput(button, joystick, dip_switches);
  }

  function changeInput(
    button: Buttons_t,
    joystick: JoyStick_t,
    dip_switches: number
  ) {
    let args: UpdateInput_t = {
      button: button,
      joystick: joystick,
      dip_switches: dip_switches,
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

<div class="ledArrRow">
  <LedArray {ledArray} />
  <div class="rightButtons">
    <PushButton bind:value={button.top}></PushButton>
    <PushButton bind:value={button.bottom}></PushButton>
  </div>
</div>

<div class="dipSwitchRow">
  <DipSwitches bind:value={dip_switches}></DipSwitches>
  <PushButton bind:value={button.left}></PushButton>
  <PushButton bind:value={button.center}></PushButton>
  <PushButton bind:value={button.right}></PushButton>
  <JoyStick bind:joystick></JoyStick>
</div>

<style>
  .dipSwitchRow {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .rightButtons {
    display: grid;
    justify-content: center;
    align-items: center;
  }
  .ledArrRow {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
</style>
