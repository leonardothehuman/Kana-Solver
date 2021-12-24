<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, Row, Col, ListInput, ListItem, ListButton, BlockTitle, BlockHeader} from "framework7-svelte";
    import { getContext, onMount, tick } from "svelte";
    import keys from "../../keys";
    import { htmlEntities, sleep } from "../../minilibs/helpers";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import { f7 } from 'framework7-svelte';
    import { deduplicateOptions, IUtauConversorDetailsView, UtauConversorDetailsPresenter } from "../../presenters/utauConversorDetailsPresenter";
    import SpinnerManipulator from "../commonImplementations/spinnerManipulator";
    import { f7ConfirmPromisse, f7ConfirmYNPromisse } from "../../minilibs/f7extender";
    import type IReadOnlyStore from "../../minilibs/IReadOnlyStore";
    import LockedStore from "../../minilibs/LockedStore";
    import ConversionFileSelector from "../components/conversionFileSelector.svelte";
    import type { ConversionItem } from "../../presenters/conversionFileSelectorPresenter";
    import type IStore from "../../minilibs/IStore";
    import type { IInstalledUtau } from "../../handlers/IInstalledUtauHandler";
    import RadioManager from "../../minilibs/radioManager";
    import type { Router } from "framework7/types";

    export let utauInfo: IInstalledUtau;
    export let f7router: Router.Router;

    let radiomanager: RadioManager = new RadioManager();
    
    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);

    let externalInterface: IUtauConversorDetailsView = {
        goBack: () => {
            f7router.back(undefined, {
                force: true
            });
        },
        showSpinner: async(title: string) => {
            let dialog = f7.dialog.preloader(title);
            await sleep(50);
            return new SpinnerManipulator(dialog);
        },
        askConfirmation: (text: string, title: string) => {
            return f7ConfirmPromisse(f7, text, title);
        },
        askConfirmationYN: (text: string, title: string) => {
            return f7ConfirmYNPromisse(f7, text, title);
        },
        emitAlert: (text: string, title: string) => {
            return new Promise((resolve, reject) => {
                f7.dialog.alert(text, title, () => {resolve()});
            });
        },
        popup: (text: string, title: string) => {
            return new Promise((resolve, reject) => {
                let popup = f7.popup.create({
                    content: `<div class="popup">
                        <div class="page">
                        <div class="navbar">
                            <div class="navbar-bg"></div>
                            <div class="navbar-inner">
                            <div class="title">${htmlEntities(title)}</div>
                            <div class="right"><a href="#" class="link popup-close">Close</a></div>
                            </div>
                        </div>
                        <div class="page-content">
                            <div class="allow-select temp-view-container warning-messages">
                                ${text}
                            </div>
                        </div>
                        </div>
                    </div>`
                });
                popup.open();
                popup.once("close", () => {
                    resolve();
                });
            });
        },
        prompt: (title: string, text: string, defaultValue: string): Promise<{
            text: string,
            ok: boolean
        }> => {
            return new Promise((resolve, reject) => {
                f7.dialog.prompt(
                    text,
                    title,
                    (t: string) => {
                        resolve({
                            text: t,
                            ok: true
                        })
                    },
                    (t: string) => {
                        resolve({
                            text: t,
                            ok: false
                        })
                    },
                    defaultValue
                );
            });
        }
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let fileSystemHandler = new modelsAndHandlers.FileSystemHandler(pathStringHandler);
    let presenter = new UtauConversorDetailsPresenter(
        utauInfo,
        externalInterface,
        new modelsAndHandlers.UtauConversorDetailsModel(
            pathStringHandler,
            fileSystemHandler,
            new modelsAndHandlers.InstalledUtauHandler(fileSystemHandler, pathStringHandler)
        )
    );

    let utauPath: IReadOnlyStore<string> = new LockedStore("");
    let rootName: IStore<string> = new LockedStore("");
    let utauName: IStore<string> = new LockedStore("");

    let renameFiles: IStore<boolean> = new LockedStore(false);
    let renameAliases: IStore<boolean> = new LockedStore(false);
    let truncateDecimals: IStore<boolean> = new LockedStore(false);
    let conversionItem: IStore<ConversionItem | null> = new LockedStore(null);
    let deduplicateAlias: IStore<deduplicateOptions> = new LockedStore("false");

    onMount(async() => {
        await presenter.init();
        utauPath = presenter.utauPath;
        rootName = presenter.rootName;
        utauName = presenter.utauName;
        renameAliases = presenter.renameAliases;
        renameFiles = presenter.renameFiles;
        conversionItem = presenter.conversionItem;
        deduplicateAlias = presenter.deduplicateAlias;
        truncateDecimals = presenter.truncateDecimals;
    });

    let rootNameInput:HTMLInputElement;
    let caretAdjustmentFinished = true;
    async function adjustCaret(nothing: string){
        if(!caretAdjustmentFinished) return;
        caretAdjustmentFinished = false;
        if(rootNameInput != undefined){
            let oldPosition = rootNameInput.selectionStart;
            await tick();
            rootNameInput.selectionStart = oldPosition;
            rootNameInput.selectionEnd = oldPosition;
        }
        caretAdjustmentFinished = true;
    }
    $:{
        adjustCaret($rootName);
    }

    //Boilerplate to manage radio
    radiomanager.addPopulatable("deduplicate-alias", (v: string) => {
        $deduplicateAlias = v as deduplicateOptions;
    });
    onMount(() => {
        radiomanager.populateRadio("deduplicate-alias", $deduplicateAlias);
    });
    $: {
        radiomanager.populateRadio("deduplicate-alias", $deduplicateAlias);
        //extractDetailsPresenter.destinationType = destinationType;
    }
    //Boilerplate end
</script>
<style lang="less">
    @import "../less/globalMixins.less";
    .content-container{
        .m-container();
    }
</style>
<Page>
    <Navbar title="Convert this file" backLink />
    <div class="content-container">
        <BlockTitle>Conversion File</BlockTitle>
        <BlockHeader>Select the rule to be used on this conversion</BlockHeader>
        <ConversionFileSelector
            listEmpty={false}
            bind:conversionItem={$conversionItem}
            ></ConversionFileSelector>

        <BlockTitle>Rename Root Directory</BlockTitle>
        <BlockHeader>The root directory's name must be specified manually</BlockHeader>
        <List>
            <ListInput
                label="New root directory's name"
                type="text"
                input={false}
                clearButton
            >
                <input bind:this={rootNameInput} type="text" slot="input" bind:value={$rootName} />
            </ListInput>
        </List>

        <BlockTitle>Utau name</BlockTitle>
        <BlockHeader>Change the utau name for something that can be read without japanese locale</BlockHeader>
        <List>
            <ListInput
                label="New Utau Name"
                type="text"
                input={false}
                clearButton
            >
                <input type="text" slot="input" bind:value={$utauName} />
            </ListInput>
        </List>

        <BlockTitle>Duplicated aliases</BlockTitle>
        <BlockHeader>What to do if different input kanas generates the same output romaji ?</BlockHeader>
        <List inlineLabels>
            <ListItem
                radio
                radioIcon="start"
                title="Append number on duplicated aliases"
                value="true"
                name="deduplicate-alias"
                disabled={false}
                on:change={() => {radiomanager.populateVariable("deduplicate-alias")}}
            ></ListItem>
            <ListItem
                radio
                radioIcon="start"
                title="Leave duplicated aliases duplicated"
                value="false"
                name="deduplicate-alias"
                disabled={false}
                on:change={() => {radiomanager.populateVariable("deduplicate-alias")}}
            ></ListItem>
        </List>
        <BlockTitle>Other options</BlockTitle>
        <BlockHeader>You should leave everything here enabled unless you know what you are doing</BlockHeader>
        <List inlineLabels>
            <ListItem checkbox title="Rename File Names" name="conversion-options" bind:checked={$renameFiles}></ListItem>
            <ListItem checkbox title="Rename Aliases" name="conversion-options" bind:checked={$renameAliases}></ListItem>
            <ListItem checkbox title="Truncate Decimal Timings" name="conversion-options" bind:checked={$truncateDecimals}></ListItem>
            <ListButton
                on:click={() => {presenter.convert()}}
                title="Convert !!!" color="deeppurple" >
            </ListButton>
        </List>
    </div>
</Page>