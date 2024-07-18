<script lang="ts">
    export let value: number = 0;
</script>

<div class="colon">
    <div class="dot1" class:active={Math.floor((value / 1) % 2) == 1}></div>
    <div class="dot2" class:active={Math.floor((value / 2) % 2) == 1}></div>
</div>

<style>
    .colon {
        display: block;
        overflow: hidden;
        justify-content: left;
    }

    .colon div.dot1 {
        position: relative;
        width: 12px;
        height: 12px;
        top: 40px;
        background-color: black;
        border-radius: 50%;
    }

    .colon div.dot2 {
        position: relative;
        width: 12px;
        height: 12px;
        top: 60px;
        background-color: black;
        border-radius: 50%;
    }
</style>
