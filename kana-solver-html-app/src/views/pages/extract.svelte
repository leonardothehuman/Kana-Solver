<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, Button, ListButton, ListItem, BlockTitle, BlockHeader, ListGroup} from "framework7-svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import { f7 } from 'framework7-svelte';
    import type { Router } from "framework7/types";
    import keys from "../../keys";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import SpinnerManipulator from "../commonImplementations/spinnerManipulator";
    import type {ExtractDetailsProps} from "./extractDetails";
    import { getContext, onMount } from "svelte";
    import type { IInstalledUtau } from "../../handlers/IInstalledUtauHandler";
    import { ExtractPresenter, IExtractView } from "../../presenters/extractPresenter";
    import UtauItem from "../components/extractPage/utauItem.svelte";
    import {f7ConfirmPromisse} from "../../minilibs/f7extender";
    import type ISettingsHandler from "../../handlers/ISettingsHandler";
    import type { GlobalInterface } from "../../App";
    import LockedStore from "../../minilibs/LockedStore";
    import type IReadOnlyStore from "../../minilibs/IReadOnlyStore";
    import type IStore from "../../minilibs/IStore";

    export let f7router: Router.Router;

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let settingsHandler: ISettingsHandler = getContext(keys.settingsHandler);
    let globalInterface: GlobalInterface = getContext(keys.globalInterface);

    let externalInterface: IExtractView = {
        goToExtractPage: (props: ExtractDetailsProps) => {
            f7router.navigate("/extract-details/", {props: props});
        },
        emitAlert: globalInterface.emitAlert,
        showSpinner: globalInterface.showSpinner,
        askConfirmation: globalInterface.askConfirmation
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let fileSystemHandler = new modelsAndHandlers.FileSystemHandler(pathStringHandler);
    let installedUtauHandler = new modelsAndHandlers.InstalledUtauHandler(fileSystemHandler, pathStringHandler);
    let zipHandler = new modelsAndHandlers.ZipHandler(pathStringHandler);
    let extractModel = new modelsAndHandlers.ExtractModel(
        pathStringHandler,
        installedUtauHandler,
        fileSystemHandler,
        zipHandler,
        settingsHandler
    );
    let extractPresenter = new ExtractPresenter(externalInterface, extractModel);

    let usersUtau: IReadOnlyStore<IInstalledUtau[]> = new LockedStore([]);
    let systemUtau: IReadOnlyStore<IInstalledUtau[]> = new LockedStore([]);
    let selectedVoicBank: IStore<string> = new LockedStore("");
    onMount(async () => {
		//TODO: verify what happens if the utau installed location was never configured
        await extractPresenter.loadUtauList();
        usersUtau = extractPresenter.usersUtau;
        systemUtau = extractPresenter.systemUtau;
        selectedVoicBank = extractPresenter.selectedVoicBank;
    });

    let listArguments: any = {
        mediaList: true
    }
</script>
<style lang="less">
    @import "../less/globalMixins.less";

    .content-container{
        .m-container();
    }
    .content-container :global(.item-text){
        display: block;
        max-height: fit-content;
    }
    .content-container :global(.list-group ul){
        padding-left: 0px;
    }

    .content-container :global(.list.media-list ul::before){
        z-index: 150;
    }
</style>
<Page>
    <Navbar title="Extractor" backLink />
    <div class="content-container">
    <BlockTitle>Install UTAU</BlockTitle>
    <BlockHeader>Select a new Utauloid to install (You can drag a file here)</BlockHeader>
    <List>
        <PathSelectField
            label="Utauloid to install"
            extensionList={['*.zip', '*.uar']}
            extensionLabels={{
                '*.zip': "ZIP files",
                '*.uar': "UTAU archive"
            }}
            bind:selectedPath={$selectedVoicBank}
            selectDirectory={false}></PathSelectField>
        <!-- <ListItem
            title="Install"
            link="#"
            reloadDetail
            on:click={() => {extractPresenter.loadUtauInstallationPage()}}
            color="green"
        >
            <i slot="media" class="f7-icons" >square_arrow_down_on_square</i>
        </ListItem> -->
        <ListButton
            on:click={() => {extractPresenter.loadUtauInstallationPage()}}
            title="Install" color="deeppurple" >
        </ListButton>
    </List>

    <!-- TODO: Centralize this -->
    {#if $usersUtau.length <= 0 && $systemUtau.length <= 0}
        <BlockTitle>No utau has been found</BlockTitle>
        <BlockHeader>Install a new utau or configure the correct installation path</BlockHeader>
    {:else}
        <BlockTitle>Installed UTAU</BlockTitle>
        <List {...listArguments}>
            {#if $usersUtau.length > 0}
                <ListGroup>
                    <ListItem groupTitle title="On user directory"></ListItem>
                    {#each $usersUtau as utau (utau)}
                        <UtauItem
                            utau={utau}
                            actionText="Uninstall"
                            actionCallback={() => {extractPresenter.uninstallUtau(utau)}}
                        ></UtauItem>
                    {/each}
                </ListGroup>
            {/if}
            {#if $systemUtau.length > 0}
                <ListGroup>
                    <ListItem groupTitle title="On system directory (may require administrator privileges to uninstall)"></ListItem>
                    {#each $systemUtau as utau (utau)}
                        <UtauItem
                            utau={utau}
                            actionText="Uninstall"
                            actionCallback={() => {extractPresenter.uninstallUtau(utau)}}
                        ></UtauItem>
                    {/each}
                </ListGroup>
            {/if}
        </List>
    {/if}
    </div>
</Page>