<script lang="ts" type="module">
    import { onMount } from "svelte";

    let running = false;
    let outputs: { [name: string]: number | boolean } = {};
    let inputs: { [name: string]: number | boolean } = {};

    onMount(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            console.log(message);
            if (message.type === "terminal-output") {
                if (message.value.hasOwnProperty("inputs")) {
                    // for each input, add it to the inputs object
                    for (var prop in message.value.inputs) {
                        if (message.value.inputs.hasOwnProperty(prop)) {
                            // do stuff
                            // check if the input is a boolean
                            if (typeof message.value.inputs[prop] === "boolean")
                                inputs[prop] = message.value.inputs[prop];
                            else if (message.value.inputs[prop] === "true")
                                inputs[prop] = true;
                            else if (message.value.inputs[prop] === "false")
                                inputs[prop] = false;
                            else
                                inputs[prop] = Number(
                                    message.value.inputs[prop]
                                );
                            console.log(inputs);
                            console.log(message.value.inputs[prop]);
                            console.log(typeof inputs[prop]);
                        }
                    }
                }
                if (message.value.hasOwnProperty("outputs")) {
                    // for each output, add it to the outputs object
                    for (var prop in message.value.outputs) {
                        if (message.value.outputs.hasOwnProperty(prop)) {
                            // do stuff
                            // check if the input is a boolean
                            if (
                                typeof message.value.outputs[prop] === "boolean"
                            )
                                outputs[prop] = message.value.outputs[prop];
                            else
                                outputs[prop] = Number(
                                    message.value.outputs[prop]
                                );
                            console.log(outputs);
                            console.log(message.value.outputs[prop]);
                            console.log(typeof outputs[prop]);
                        }
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

    function changeInput(input: string, value: number | boolean) {
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
        {#if typeof input[1] === "boolean"}
            <button
                class:notactive={!input[1]}
                on:click={() => {
                    inputs[input[0]] = !inputs[input[0]];
                    changeInput(input[0], inputs[input[0]]);
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
    <div class="menu">
        <span>{output[0]}:</span>
        <span>{output[1]}</span>
    </div>
{/each}

<style>
    .notactive {
        background-color: #cdcdcd;
        color: var(--vscode-button-background);
    }
</style>
