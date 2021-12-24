<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, ListButton, BlockTitle, BlockHeader} from "framework7-svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import { getContext, onMount} from "svelte";
    import { f7 } from 'framework7-svelte';
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import ConversionFileSelector from "../components/conversionFileSelector.svelte";
    import keys from "../../keys";
    import { IUstConversorView, UstConversorPresenter } from "../../presenters/ustConversorPresenter";
    import type { Router } from "framework7/types";
    import type IStore from "../../minilibs/IStore";
    import LockedStore from "../../minilibs/LockedStore";
    import type { ConversionItem } from "../../presenters/conversionFileSelectorPresenter";
    import SpinnerManipulator from "../commonImplementations/spinnerManipulator";
    import { sleep } from "../../minilibs/helpers";
    import type IReadOnlyStore from "../../minilibs/IReadOnlyStore";

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);

    let externalInterface: IUstConversorView = {
        scrollTo: (x: number, y: number) => {
            mainContainer.scrollTo(x, y);
        },
        showSpinner: async(title: string) => {
            let dialog = f7.dialog.preloader(title);
            await sleep(50);
            return new SpinnerManipulator(dialog);
        },
        emitAlert: (text: string, title: string) => {
            return new Promise<void>((resolve, reject) => {
                f7.dialog.alert(text, title, () => {resolve()});
            });
        }
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let fileSystemHandler = new modelsAndHandlers.FileSystemHandler(pathStringHandler);
    let presenter = new UstConversorPresenter(
        externalInterface,
        new modelsAndHandlers.UstConversorModel(
            pathStringHandler,
            fileSystemHandler
        )
    );
    
    let ustFilePath: IStore<string> = new LockedStore("");
    let conversionRules: IStore<ConversionItem | null> = new LockedStore(null);
    let canConvertCharset: IReadOnlyStore<boolean> = new LockedStore(false);
    let canSaveKanaVCV: IReadOnlyStore<boolean> = new LockedStore(false);
    let canSaveRomajiVCV: IReadOnlyStore<boolean> = new LockedStore(false);
    let mainContainer: HTMLDivElement;

    onMount(async() => {
        await presenter.init();
        ustFilePath = presenter.ustFilePath;
        conversionRules = presenter.conversionRules;
        canConvertCharset = presenter.canConvertCharset;
        canSaveKanaVCV = presenter.canSaveKanaVCV;
        canSaveRomajiVCV = presenter.canSaveRomajiVCV;
    });
</script>
<style lang="less">
    @import "../less/globalMixins.less";
    .content-container{
        .m-container();
    }
</style>
<Page>
    <Navbar title="UST conversor" backLink />
    <div class="content-container" bind:this={mainContainer}>
        <BlockTitle>1. Select a ust file to convert</BlockTitle>
        <BlockHeader>You can drag a file here</BlockHeader>
        <List>
            <PathSelectField
                label="Ust to convert"
                extensionList={['*.ust']}
                extensionLabels={{
                    '*.ust': "UST file"
                }}
                bind:selectedPath={$ustFilePath}
                selectDirectory={false}></PathSelectField>
        </List>

        <BlockTitle>2. Select a rule for the conversion</BlockTitle>
        <BlockHeader>It's recomended to use the same rule you have used to convert the voicebank</BlockHeader>
        <ConversionFileSelector
            listEmpty={false}
            bind:conversionItem={$conversionRules}
            ></ConversionFileSelector>

        <BlockTitle>3. (optional) Convert the existing charset</BlockTitle>
        <List inlineLabels>
            <ListButton
                on:click={() => {
                    if(!$canConvertCharset) return;
                    presenter.kanaToRomaji();
                }}
                title="Convert kana to romaji" 
                color={$canConvertCharset ? "deeppurple" : "gray"} >
            </ListButton>
            <ListButton
                on:click={() => {
                    if(!$canConvertCharset) return;
                    presenter.romajiToKana();
                }}
                title="Convert romaji to kana" 
                color={$canConvertCharset ? "deeppurple" : "gray"} >
            </ListButton>
        </List>

        <BlockTitle>4. Save on the desired format</BlockTitle>
        <BlockHeader>You must specify the current charset to export as VCV</BlockHeader>
        <List inlineLabels>
            <ListButton
                on:click={() => {presenter.saveCV()}}
                title="Save CV" color="deeppurple" >
            </ListButton>
            <ListButton
                on:click={() => {
                    if(!$canSaveRomajiVCV) return;
                    presenter.saveRomajiVCV();
                }}
                title="Save romaji VCV"
                color={$canSaveRomajiVCV ? "deeppurple" : "gray"} >
            </ListButton>
            <ListButton
                on:click={() => {
                    if(!$canSaveKanaVCV) return;
                    presenter.saveKanaVCV()
                }}
                title="Save kana VCV"
                color={$canSaveKanaVCV ? "deeppurple" : "gray"} >
            </ListButton>
        </List>
    </div>
</Page>