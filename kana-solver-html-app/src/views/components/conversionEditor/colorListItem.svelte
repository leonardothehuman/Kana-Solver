<script lang="ts">
    import {onMount} from 'svelte';
    import type IStore from '../../../minilibs/IStore';
    import LockedStore from '../../../minilibs/LockedStore';

    export let boundValue: IStore<boolean>;
    export let trueColor: string|null = null;
    export let falseColor: string|null = null;

    let laterValue: IStore<boolean> = new LockedStore(false);

    function generateColorString(t: string|null){
        if(t == null) return "";
        return "background-color: "+t+";opacity: 0.35;";
    }
    let currentColorString = generateColorString(falseColor);
    $:{
        currentColorString = generateColorString(falseColor);
        if($laterValue == true){
            currentColorString = generateColorString(trueColor);
        }
    }

    onMount(async() => {
        laterValue = boundValue;
        // laterValue.subscribe((v: boolean)=>{
        //     console.log(v);
        // });
    });
</script>
<style lang="less">
    .tint-item{
        width: 100%;
        height: 100%;
        position: absolute;
    }
</style>
<div class="tint-item" style={currentColorString} ></div>