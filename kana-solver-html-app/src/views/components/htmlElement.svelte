<script lang="ts">
    // This file is licensed under MIT license
    import type { AdditionalInfoAray } from "../../handlers/UpdatesHandler";
    import Title from "./htmlElements/TITLE.svelte";
    import Subtitle from "./htmlElements/SUBTITLE.svelte";
    import Strongblock from "./htmlElements/STRONGBLOCK.svelte";
    import Weakblock from "./htmlElements/WEAKBLOCK.svelte";
    import Div from "./htmlElements/DIV.svelte";
    import Url from "./htmlElements/URL.svelte";
    import Paragraph from "./htmlElements/PARAGRAPH.svelte";
    
    export let element: AdditionalInfoAray;

    let render: any;
    
    switch (element[0]) {
        case "TITLE":
            render = Title;
        break;
        case "SUBTITLE":
            render = Subtitle;
        break;
        case "STRONGBLOCK":
            render = Strongblock;
        break;
        case "WEAKBLOCK":
            render = Weakblock;
        break;
        case "TEXT":
            render = Div;
        break;
        case "PARAGRAPH":
            render = Paragraph;
        break;
        case "URL":
            render = Url;
        break;
        default:
            break;
    }

</script>

{#if render == Url}
    {#if element.length < 3}
        <Url url={element[1]}>{element[1]}</Url>
    {:else}
        {#if !Array.isArray(element[2])}
            <Url url={element[1]}>{element[2]}</Url>
        {/if}
    {/if}
{:else}
    <svelte:component this={render} >
        {#each element as el, i}
            {#if i != 0}
                {#if Array.isArray(element[i])}
                    <svelte:self element={element[i]}/>
                {:else}
                    <span>{el} </span>
                {/if}
            {/if}
        {/each}
    </svelte:component>
{/if}