<script lang="ts">
    import {ListItem, Button} from "framework7-svelte";
    import type { IInstalledUtau } from "../../../handlers/IInstalledUtauHandler";

    export let utau: IInstalledUtau;
    export let uninstallCallback: (u: IInstalledUtau) => void;

    let audioTag: HTMLAudioElement;
    let canPlay = false;
</script>

<style lang="less">
    .buttons-container{
        float: right;
    }
    .buttons-container :global(a.button){
        margin-bottom: 5px;
        width: 110px;
    }
    .buttons-container :global(p){
        margin: 5px 0;
    }
</style>
<ListItem 
    title={utau.name} after=""
    subtitle={"Directory: "+utau.directoryName}
>
    <div slot="media">
        {#if utau.imageUri == ""}
            <i style="font-size:100px; color:var(--f7-list-item-after-text-color);" class="f7-icons">person</i>
        {:else}
            <img src={utau.imageUri} alt={utau.name}} width="100" height="100" />
        {/if}
    </div>
    
    <div slot="text">
        <!-- TODO: add key to each -->
        {#each utau.description as line}
            <p>{line}</p>
        {/each}
    </div>
    <!-- after-end -->
    <div slot="inner-start" class="buttons-container">
        <Button on:click={() => {uninstallCallback(utau)}} fill small>Uninstall</Button>
        {#if utau.sampleUri != ""}
            {#if canPlay}
                <Button onClick={() => {audioTag.play()}} outline small>
                    <i class="f7-icons">play</i>
                    Sample
                </Button>
            {/if}
            <audio on:canplay={() => {canPlay = true}} bind:this={audioTag}>
                <source src={utau.sampleUri} />
            </audio>
        {/if}
    </div>
</ListItem>