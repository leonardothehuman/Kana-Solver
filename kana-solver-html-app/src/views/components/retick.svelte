<script lang="ts">
    //Workaround to fix a memory leak that happens when you put framework7's ListItem inside a foreach
    import { tick } from "svelte";

	export let monitor: any;
    export let display: boolean = true;

    let letmounted = true;
    let width: number = 0;
    let height: number = 0;
	async function updtd(a: any){
        await tick();
        if(containerDiv == null) return;
        a = a;
        width = containerDiv.clientWidth;
        height = containerDiv.clientHeight;
        letmounted = false;
        await tick();
        letmounted = true;
		await tick();
	}
	$: {
		updtd(monitor);
	}

    let containerDiv: HTMLDivElement|null;
</script>

{#if display == true && letmounted == true}
    <div bind:this={containerDiv}>
        <slot></slot>
    </div>
{:else if display == true}
    <div bind:this={containerDiv} style={`width: ${width}px; height: ${height}px`}></div>
{:else}
    <div bind:this={containerDiv}></div>
{/if}