<!-- This file is licensed under MIT license -->

<script lang="ts">
    import {BlockTitle} from "framework7-svelte";
</script>
<style lang="less">
    h1{
        margin: 0px;
        text-align: center;
    }
</style>
<BlockTitle>
    <h1>
        <slot />
    </h1>
</BlockTitle>