<script lang="ts">
  // 7 bits for each segment a, b, c, d, e, f, g
  export let value: number = 0;
</script>

<div class="display-container display-size-12">
  <div class="segment-x segment-a" class:active={value % 2 == 1}>
    <span class="segment-border"></span>
  </div>
  <div
    class="segment-y segment-b"
    class:active={Math.floor((value / 2) % 2) == 1}
  >
    <span class="segment-border"></span>
  </div>
  <div
    class="segment-y segment-c"
    class:active={Math.floor((value / 4) % 2) == 1}
  >
    <span class="segment-border"></span>
  </div>
  <div
    class="segment-x segment-d"
    class:active={Math.floor((value / 8) % 2) == 1}
  >
    <span class="segment-border"></span>
  </div>
  <div
    class="segment-y segment-e"
    class:active={Math.floor((value / 16) % 2) == 1}
  >
    <span class="segment-border"></span>
  </div>
  <div
    class="segment-y segment-f"
    class:active={Math.floor((value / 32) % 2) == 1}
  >
    <span class="segment-border"></span>
  </div>
  <div
    class="segment-x segment-g"
    class:active={Math.floor((value / 64) % 2) == 1}
  >
    <span class="segment-border"></span>
  </div>
  <div class="dot" class:active={Math.floor((value / 128) % 2) == 1}></div>
</div>

<style>
  .display-container div.segment-x,
  .display-container div.segment-y {
    position: relative;
  }

  .display-container div.dot {
    position: relative;
    width: 12px;
    height: 12px;
    background-color: black;
    border-radius: 50%;
    top: -100px;
    left: 60px;
  }

  .display-container div.dot.active {
    background-color: green;
  }

  .display-container span.segment-border {
    display: block;
    position: relative;
  }
  .display-container.display-size-12 {
    display: block;
    margin-bottom: 10px;
  }

  .display-container {
    display: block;
    position: relative;
    margin: 10px;
    margin-right: 5px;
    margin-left: 5px;
    float: left;
  }

  .display-container.display-size-12 {
    width: 70px;
    height: 110px;
  }

  .display-container.display-size-12 .segment-x {
    width: 36px;
    left: 6px;
    border-bottom: 6px solid black;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
  }

  .display-container.display-size-12 .segment-x .segment-border {
    top: 11px;
    left: -6px;
    right: 0px;
    width: 36px;
    border-top: 6px solid black;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
  }

  .display-container.display-size-12 .segment-y {
    height: 36px;
    width: 0;
    border-right: 6px solid black;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }

  .display-container.display-size-12 .segment-y .segment-border {
    position: relative;
    left: 5px;
    height: 36px;
    margin-top: -6px;
    border-left: 6px solid black;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }

  .display-container.display-size-12 .segment-x.active {
    border-bottom: 6px solid green;
  }

  .display-container.display-size-12 .segment-x.active .segment-border {
    border-top: 6px solid green;
  }

  .display-container.display-size-12 .segment-y.active {
    border-right: 6px solid green;
  }

  .display-container.display-size-12 .segment-y.active .segment-border {
    border-left: 6px solid green;
  }

  .display-container.display-size-12 .segment-a {
    top: 0;
    left: 12px;
  }

  .display-container.display-size-12 .segment-b {
    top: 2px;
    left: 45px;
  }

  .display-container.display-size-12 .segment-c {
    top: 4px;
    left: 45px;
  }

  .display-container.display-size-12 .segment-d {
    top: -6px;
    left: 12px;
  }

  .display-container.display-size-12 .segment-e {
    top: -44px;
    left: 4px;
  }

  .display-container.display-size-12 .segment-f {
    top: -116px;
    left: 4px;
  }

  .display-container.display-size-12 .segment-g {
    top: -128px;
    left: 12px;
  }
</style>
