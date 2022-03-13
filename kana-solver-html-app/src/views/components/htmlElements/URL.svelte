<!-- This file is licensed under MIT license -->

<script lang="ts">
    import { getContext } from "svelte";

    import type { AdditionalInfoArayOrString } from "../../../handlers/UpdatesHandler";
    import { isString } from "../../../minilibs/helpers";
    import keys from "../../../keys";
    import type ModelsAndHandlers from "../../../modelsAndHandlers";

    export let url: AdditionalInfoArayOrString;

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let networkHandler = new modelsAndHandlers.NetworkHandler();
    
    function openUrl(){
        if (!isString(url)) return;
        networkHandler.openUrlOnBrowser(url);
    }
</script>
<style lang="less">
    span.ab-link{
        color: blue;
        cursor: pointer;
        text-decoration: underline;
    }
    :global(.theme-dark){
        span.ab-link{
            color: lightskyblue;
        }
    }
</style>
{#if isString(url)}
    <span on:click={(e) => {openUrl()}} class="ab-link">
        <slot />
    </span>
    <span>{" "}</span>
{/if}