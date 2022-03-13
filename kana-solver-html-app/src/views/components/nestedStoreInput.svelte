<script lang="ts">
    // This file is licensed under MIT license
    
    import {Input} from 'framework7-svelte';
    import type IStore from '../../minilibs/IStore';
    import LockedStore from '../../minilibs/LockedStore';
    import {onMount} from 'svelte';

    export let boundValue: IStore<string>;
    
    let laterValue: IStore<string> = new LockedStore("");

    onMount(() => {
        laterValue = boundValue;
    });

    let otherProps: Record<string, any> = {};
    for(let i in $$props){
        if(i == "boundValue") continue;
        otherProps[i] = $$props[i];
    }
</script>
<Input bind:value={$laterValue} {...otherProps} />