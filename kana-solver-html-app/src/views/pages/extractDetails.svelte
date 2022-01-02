<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {
        Page, Navbar, List, Button, ListItem,
        f7, BlockTitle, Block, BlockHeader,
        Toolbar, Link
    } from "framework7-svelte";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import keys from '../../keys';
    import RadioManager from "../../minilibs/radioManager";
    import {getContext, onMount} from "svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import type { Router } from "framework7/types";
    import { ExtractDetailsPresenter, IExtractDetailsView, UtauDestinationType, UtauSourceType } from "../../presenters/extractDetailsPresenter";
    import type IPathStringHandler from "../../handlers/IPathStringshandler";
    import type { UtauZipInfo } from "../../handlers/IZipHandler";
    import type ISettingsHandler from "../../handlers/ISettingsHandler";
    import type { GlobalInterface } from "../../App";
    import type IStore from "../../minilibs/IStore";
    import LockedStore from "../../minilibs/LockedStore";
    import type IPathHandler from "../../handlers/IPathHandler";
    
    export let fileToExtract: string;
    export let zipProperties: UtauZipInfo;
    export let f7router: Router.Router;

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let settingsHandler: ISettingsHandler = getContext(keys.settingsHandler);
    let globalInterface: GlobalInterface = getContext(keys.globalInterface);
    let pathHandler: IPathHandler = getContext(keys.pathHandler);

    let radiomanager: RadioManager = new RadioManager();
    
    let externalInterface: IExtractDetailsView = {
        informExtractionSuccess: () => {
            f7router.back(undefined, {
                force: true
            });
        },
        emitAlert: globalInterface.emitAlert,
        askConfirmation: globalInterface.askConfirmation,
        createProgressProcess: globalInterface.createProgressProcess,
        popup: globalInterface.popup
    }

    let pathStringHandler: IPathStringHandler = new modelsAndHandlers.PathStringHandler();
    let extractDetailsPresenter: ExtractDetailsPresenter = new ExtractDetailsPresenter(
        externalInterface,
        new modelsAndHandlers.ExtractDetailsModel(
            pathStringHandler,
            new modelsAndHandlers.FileSystemHandler(pathStringHandler),
            new modelsAndHandlers.ZipHandler(pathStringHandler),
            settingsHandler,
            pathHandler
        ),
        zipProperties,
        fileToExtract
    );

    let destinationType: IStore<UtauDestinationType> = new LockedStore("users");
    let sourceType: IStore<UtauSourceType> = new LockedStore("custom");
    let canInstallUtau: IStore<boolean> = new LockedStore(true);
    let extractionDirectory: IStore<string> = new LockedStore("");
    let canInstallFromRoot: IStore<boolean> = new LockedStore(true);
    let canInstallFromCustom: IStore<boolean> = new LockedStore(true);
    onMount(async() => {
        //await presenter.init();
        extractDetailsPresenter.emitMountAlerts();
        destinationType = extractDetailsPresenter.destinationType;
        sourceType = extractDetailsPresenter.sourceType;
        canInstallUtau = extractDetailsPresenter.canInstallUtau;
        extractionDirectory = extractDetailsPresenter.extractionDirectory;
        canInstallFromRoot = extractDetailsPresenter.canInstallFromRoot;
        canInstallFromCustom = extractDetailsPresenter.canInstallFromCustom;
    });

    //Boilerplate to manage radio
    radiomanager.addPopulatable("install-location", (v: string) => {
        $destinationType = v as UtauDestinationType;
    });
    onMount(() => {
        radiomanager.populateRadio("install-location", $destinationType);
    });
    $: {
        radiomanager.populateRadio("install-location", $destinationType);
        //extractDetailsPresenter.destinationType = destinationType;
    }
    //--------
    radiomanager.addPopulatable("install-from", (v: string) => {
        $sourceType = v as UtauSourceType;
    })
    onMount(() => {
        radiomanager.populateRadio("install-from", $sourceType);
    });
    $: {
        radiomanager.populateRadio("install-from", $sourceType);
        //extractDetailsPresenter.sourceType = sourceType;
    }
    //Boilerplate end
</script>
<style lang="less">
    @import "../less/globalMixins.less";

    .content-container{
        .m-container();
        :global(input[disabled] ~ div.item-inner){
            color: var(--f7-list-item-after-text-color);
        }
    }

    .content-container :global(.list){
        .m-no-border-list();
    }
    .content-container :global(.block){
        .m-smaller-border-block();
    }
</style>
<Page>
    <Navbar title="Install UTAU" backLink />
    <div class="content-container">
        <BlockTitle>Destination</BlockTitle>
        <BlockHeader>Where will the archive be installed / extracted</BlockHeader>
        <List>
            <ListItem
                radio
                radioIcon="start"
                title="Users Directory"
                value="users"
                name="install-location"
                disabled={!$canInstallUtau}
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <ListItem
                radio
                radioIcon="start"
                title="UTAU Directory (may require administrator privileges)"
                value="utau"
                name="install-location"
                disabled={!$canInstallUtau}
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <ListItem
                radio
                radioIcon="start"
                title="Other directory"
                value="other"
                name="install-location"
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <PathSelectField
                label="Extract to:"
                disabled={$destinationType != "other"}
                bind:selectedPath={$extractionDirectory}
                selectDirectory={true}></PathSelectField>
        </List>

        <BlockTitle>Extraction source</BlockTitle>
        <BlockHeader>Origin of the zip content</BlockHeader>
        <Block>
            <p>ZIP root: Extract everything without install</p>
            {#if zipProperties.sourceOnZip.trim() != ""}
                <p>{zipProperties.sourceOnZip}: Install following the manifest file</p>
            {/if}
        </Block>
        <List>
            <ListItem
                radio
                radioIcon="start"
                title="ZIP root"
                value="root"
                name="install-from"
                disabled={!$canInstallFromRoot}
                on:change={() => {radiomanager.populateVariable("install-from")}}
            ></ListItem>
            {#if zipProperties.sourceOnZip.trim() != ""}
                <ListItem
                    radio
                    radioIcon="start"
                    title={zipProperties.sourceOnZip}
                    value="custom"
                    name="install-from"
                    disabled={!$canInstallFromCustom}
                    on:change={() => {radiomanager.populateVariable("install-from")}}
                ></ListItem>
            {/if}
        </List>
    </div>
    <Toolbar position="bottom" >
        <Link></Link>
        <Link iconF7="square_arrow_down_on_square" on:click={() => {extractDetailsPresenter.installUtau()}} text="Install" />
    </Toolbar>
</Page>