<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {List, ListItem} from "framework7-svelte";
    import { getContext, onMount, createEventDispatcher, onDestroy } from "svelte";
    import keys from "../../keys";
    import { sleep } from "../../minilibs/helpers";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import { f7 } from 'framework7-svelte';
    import { IUtauConversorDetailsView, UtauConversorDetailsPresenter } from "../../presenters/utauConversorDetailsPresenter";
    import SpinnerManipulator from "../commonImplementations/spinnerManipulator";
    import { f7ConfirmPromisse, f7ConfirmYNPromisse } from "../../minilibs/f7extender";
    import type IReadOnlyStore from "../../minilibs/IReadOnlyStore";
    import LockedStore from "../../minilibs/LockedStore";
    import { ConversionFileSelectorPresenter, ConversionItem, fileDeletedEventArgs, fileSavedAsEventArgs, IConversionFileSelectorView, newFileEventArgs, selectChangeInterceptedEventArgs } from "../../presenters/conversionFileSelectorPresenter";
    import type {conversionFileRepresentation} from "../../presenters/conversionEditorPresenter";
    import type AsyncStoreInterceptor from "../../minilibs/AsyncStoreInterceptor";
    import type AsyncEvent from "../../minilibs/AsyncEvent";
    import type { asyncEventSubscriber } from "../../minilibs/AsyncEvent";
    import type { eventSubscriber } from "../../minilibs/SyncEvent";
    import type { GlobalInterface } from "../../App";

    export let listEmpty: boolean = true;
    export let conversionItemStore: IReadOnlyStore<ConversionItem | null>;
    export let conversionItem: ConversionItem | null = null;
    export let informSaveAs: AsyncEvent<any, fileSavedAsEventArgs> | null = null;
    export let informDelete: AsyncEvent<any, fileDeletedEventArgs> | null = null;
    export let informCreate: AsyncEvent<any, newFileEventArgs> | null = null;
    conversionItemStore = new LockedStore(null);

    const dispatch = createEventDispatcher();
    
    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let installedConversionFileRepresentations: conversionFileRepresentation[] = [];
    let globalInterface: GlobalInterface = getContext(keys.globalInterface);
    
    let externalInterface: IConversionFileSelectorView = {
        setInstalledConversionFileRepresentations: (icf: conversionFileRepresentation[], onlyOnChange: boolean) => {
            if(installedConversionFileRepresentations == icf && onlyOnChange == true) return false;
            installedConversionFileRepresentations = icf;
            return true;
        },
        setConversionItemStore: (cis: IReadOnlyStore<ConversionItem | null>, onlyOnChange: boolean) => {
            if(conversionItemStore == cis && onlyOnChange == true) return false;
            conversionItemStore = cis;
            return true;
        },
        showSpinner: globalInterface.showSpinner,
        emitAlert: globalInterface.emitAlert,
        askConfirmationYN: globalInterface.askConfirmationYN
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let fileSystemHandler = new modelsAndHandlers.FileSystemHandler(pathStringHandler);
    let presenter = new ConversionFileSelectorPresenter(
        listEmpty,
        externalInterface,
        new modelsAndHandlers.ConversionFileSelectorModel(
            pathStringHandler,
            fileSystemHandler
        )
    );

    // let utauPath: IReadOnlyStore<string> = new LockedStore("");

    let selectedConversionFileIndex: AsyncStoreInterceptor<number> = presenter.selectedConversionFileIndex;
    
    let selectChangeInterceptedEvent:eventSubscriber<selectChangeInterceptedEventArgs, ConversionFileSelectorPresenter>;
    let informSaveAsEvent: asyncEventSubscriber<fileSavedAsEventArgs, any> | null = null;
    let informDeleteEvent: asyncEventSubscriber<fileDeletedEventArgs, any> | null = null;
    let informCreateEvent: asyncEventSubscriber<newFileEventArgs, any> | null = null;
    onDestroy(() => {
		presenter.selectChangeIntercepted.removeEventListener(selectChangeInterceptedEvent);
        if(informSaveAsEvent != null) informSaveAs.removeEventListener(informSaveAsEvent);
        if(informDeleteEvent != null) informDelete.removeEventListener(informDeleteEvent);
        if(informCreateEvent != null) informCreate.removeEventListener(informCreateEvent);
	});
    onMount(async() => {
        await presenter.init();
        setBadge($selectedConversionFileIndex);
        selectChangeInterceptedEvent = presenter.selectChangeIntercepted.addEventListener((s, e) => {
            dispatch('selectChangeIntercepted', e);
        });
        if(informSaveAs != null){
            informSaveAsEvent = informSaveAs.addEventListener(async(s, e) => {
                await presenter.informSaveAs(e);
            });
        }
        if(informDelete != null){
            informDeleteEvent = informDelete.addEventListener(async(s, e) => {
                await presenter.informDelete(e);
            });
        }
        if(informCreate != null){
            informCreateEvent = informCreate.addEventListener(async(s, e) => {
                await presenter.informCreate(e);
            });
        }
    });

    let conversionItemUnsubscriber = function(){};
    onDestroy(() => {
		conversionItemUnsubscriber();
	});
    function subscribeUpdate(cfs: IReadOnlyStore<ConversionItem>){
        conversionItemUnsubscriber = cfs.subscribe((cf: ConversionItem) => {
            conversionItem = cf;
        });
    }
    $: {
        subscribeUpdate(conversionItemStore);
    }
    let badge: string | null = null;
    function setBadge(i: number){
        if(installedConversionFileRepresentations[i] == undefined){
            badge = undefined;
            return;
        }
        if(installedConversionFileRepresentations[i].isNew == true){
            badge = " New File ";
            return;
        }
        if(installedConversionFileRepresentations[i].isBuiltIn == true){
            badge = " Built-in ";
            return;
        }
        badge = undefined;
    }
    $:{
        setBadge($selectedConversionFileIndex);
    }
</script>
<style lang="less">
    .element-style{
        :global(.badge){
            position: relative;
            top: -2px;
        }
        :global(.list){
            margin: 0px;
        }
    }
</style>
<div class="element-style">
    <List>
        <!-- bind:this={fileListRef} -->
        <ListItem badge={badge}
            title="Conversion file" smartSelect
            smartSelectParams={{openIn: 'popover', closeOnSelect: true, setValueText: false }}
        >
            <select name="conversionLists" bind:value={$selectedConversionFileIndex}>
                {#each installedConversionFileRepresentations as cfile, i (cfile)}
                    {#if cfile.isNew == true}
                        <option value={i}>{cfile.nameWithoutExtension}</option>
                    {/if}
                {/each}
                <optgroup label="Built-in">
                    {#each installedConversionFileRepresentations as cfile, i}
                        {#if cfile.isBuiltIn == true && cfile.isNew != true}
                            <option value={i}>{cfile.nameWithoutExtension}</option>
                        {/if}
                    {/each}
                </optgroup>
                <optgroup label="Installed">
                    {#each installedConversionFileRepresentations as cfile, i}
                        {#if cfile.isBuiltIn != true}
                            <option value={i}>{cfile.nameWithoutExtension}</option>
                        {/if}
                    {/each}
                </optgroup>
            </select>
            <span slot="after">
                {#if installedConversionFileRepresentations[$selectedConversionFileIndex] != undefined && installedConversionFileRepresentations[$selectedConversionFileIndex].isNew == false}
                    {installedConversionFileRepresentations[$selectedConversionFileIndex].nameWithoutExtension}
                {/if}
            </span>
            <i slot="media" class="f7-icons">archivebox</i>
        </ListItem>
    </List>
</div>