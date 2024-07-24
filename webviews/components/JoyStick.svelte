<script lang="ts">
  import type { JoyStick_t } from "../types/input";
  import PushButton from "./pushButton.svelte";

  export let joystick: JoyStick_t = {};
</script>

<div class="joystick">
  <div class="controler top">
    <PushButton size={25} margin={0} bind:value={joystick.up} />
  </div>
  <div class="controler middle">
    <PushButton size={25} margin={0} bind:value={joystick.left} />
    <PushButton size={25} margin={0} bind:value={joystick.pressed} />
    <PushButton size={25} margin={0} bind:value={joystick.right} />
  </div>
  <div class="controler bottom">
    <PushButton size={25} margin={0} bind:value={joystick.down} />
  </div>
</div>

<style>
  .joystick {
    display: grid;
    height: 75px;
    margin-left: 10px;
  }

  .controler {
    width: 75px;
    height: 25px;
    position: relative;
    display: flex;
    justify-content: center;
  }
</style>
