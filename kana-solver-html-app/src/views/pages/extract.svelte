<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    //TODO: Benefits from using store
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

    export let f7router: Router.Router;

    let userUtauList: IInstalledUtau[] = [];
    let systemUtauList: IInstalledUtau[] = [];
    let selectedUtauVoicebank = '';

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);

    let externalInterface: IExtractView = {
        emitAlert: (text: string, title: string) => {
            return new Promise((resolve, reject) => {
                f7.dialog.alert(text, title, () => {resolve()});
            });
        },
        showSpinner: async(title: string) => {
            let dialog = f7.dialog.preloader(title);
            return new SpinnerManipulator(dialog);
        },
        goToExtractPage: (props: ExtractDetailsProps) => {
            f7router.navigate("/extract-details/", {props: props});
        },
        askConfirmation: (text: string, title: string) => {
            return f7ConfirmPromisse(f7, text, title);
        },

        setUsersUtau: (ul: IInstalledUtau[], onlyOnChange: boolean) => {
            if(userUtauList == ul && onlyOnChange == true) return false;
            userUtauList = ul;
            return true;
        },
        setSystemUtau: (ul: IInstalledUtau[], onlyOnChange: boolean) => {
            if(systemUtauList == ul && onlyOnChange == true) return false;
            systemUtauList = ul;
            return true;
        },
        setSelectedVoicebank: (vb: string, onlyOnChange: boolean) => {
            if(selectedUtauVoicebank == vb && onlyOnChange == true) return false;
            selectedUtauVoicebank = vb;
            return true;
        }
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let fileSystemHandler = new modelsAndHandlers.FileSystemHandler(pathStringHandler);
    let installedUtauHandler = new modelsAndHandlers.InstalledUtauHandler(fileSystemHandler, pathStringHandler);
    let zipHandler = new modelsAndHandlers.ZipHandler(pathStringHandler);
    let extractModel = new modelsAndHandlers.ExtractModel(
        pathStringHandler,
        installedUtauHandler,
        fileSystemHandler,
        zipHandler
    );
    let extractPresenter = new ExtractPresenter(externalInterface, extractModel);

    onMount(async () => {
		//TODO: verify what happens if the utau installed location was never configured
        await extractPresenter.loadUtauList();
    });

    $: extractPresenter.selectedVoicBank = selectedUtauVoicebank;

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
            bind:selectedPath={selectedUtauVoicebank}
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
    {#if userUtauList.length <= 0 && systemUtauList.length <= 0}
        <BlockTitle>No utau has been found</BlockTitle>
        <BlockHeader>Install a new utau or configure the correct installation path</BlockHeader>
    {:else}
        <BlockTitle>Installed UTAU</BlockTitle>
        <List {...listArguments}>
            {#if userUtauList.length > 0}
                <ListGroup>
                    <ListItem groupTitle title="On user directory"></ListItem>
                    {#each userUtauList as utau (utau)}
                        <UtauItem
                            utau={utau}
                            actionText="Uninstall"
                            actionCallback={() => {extractPresenter.uninstallUtau(utau)}}
                        ></UtauItem>
                    {/each}
                </ListGroup>
            {/if}
            {#if systemUtauList.length > 0}
                <ListGroup>
                    <ListItem groupTitle title="On system directory (may require administrator privileges to uninstall)"></ListItem>
                    {#each systemUtauList as utau (utau)}
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