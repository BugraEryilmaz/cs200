<script lang="ts">
    export let value: number = 0;
</script>

<div class="apastrophe">
    <div class="dot1" class:active={Math.floor((value / 4) % 2) == 1}></div>
</div>

<style>
    .apastrophe {
        display: block;
        overflow: hidden;
        justify-content: left;
    }

    .apastrophe div.dot1 {
        position: relative;
        width: 12px;
        height: 12px;
        top: 30px;
        background-color: black;
        border-radius: 50%;
    }
</style>
