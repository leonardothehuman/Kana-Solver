<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    
    import {ListItem, Button} from "framework7-svelte";
    import type { IInstalledUtau } from "../../../handlers/IInstalledUtauHandler";

    export let utau: IInstalledUtau;
    export let actionText: string;
    export let actionCallback: (u: IInstalledUtau) => void;
    export let revertActionText: string|null = null;
    export let revertActionCallback: (u: IInstalledUtau) => void;
    export let actionClick: (u:IInstalledUtau) => void = null;

    let imageUri = utau.imageUri;

    let audioTag: HTMLAudioElement;
    let canPlay = false;

    function onerror(e: Event){
        imageUri = "";
    }
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
    .title-container :global(a){
        text-decoration: underline;
    }
    .text-content :global(p){
        margin: 5px 0px;
    }
</style>
<ListItem 
    after=""
    subtitle={"Directory: "+utau.directoryName}
>
    <div slot="title" class="title-container">
        {#if actionClick == null}
            {utau.name}
        {:else}
            <a href="#_" on:click={(e) => {e.preventDefault();actionClick(utau);}}>{utau.name}</a>
        {/if}
    </div>
    <div slot="media">
        {#if imageUri == ""}
            <i style="font-size:100px; color:var(--f7-list-item-after-text-color);" class="f7-icons">person</i>
        {:else}
            <img src={imageUri} alt={utau.name} width="100" height="100" on:error={(e) => {onerror(e);}} />
        {/if}
    </div>
    
    <div slot="text">
        <div class="text-content">
            {#each utau.nonStandardFields as line, i (line)}
                <p>{line[0]}: {line[1]}</p>
            {/each}
            {#each utau.description as line (line)}
                <p>{line}</p>
            {/each}
        </div>
    </div>
    <!-- after-end -->
    <div slot="inner-start" class="buttons-container">
        {#if utau.isConverted && revertActionText !== null}
            <Button color="deeporange" on:click={() => {revertActionCallback(utau)}} fill small>{revertActionText}</Button>
        {:else}
            <Button on:click={() => {actionCallback(utau)}} fill small>{actionText}</Button>
        {/if}
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