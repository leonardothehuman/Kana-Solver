<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, BlockTitle, BlockHeader, List, ListGroup, ListItem} from "framework7-svelte";
    import { getContext, onDestroy, onMount, tick } from "svelte";
    import { f7 } from 'framework7-svelte';
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import keys from "../../keys";
    import { sleep } from "../../minilibs/helpers";
    import { IUtauConversorView, UtauConversorPresenter } from "../../presenters/utauConversorPresenter";
    import SpinnerManipulator from "../commonImplementations/spinnerManipulator";
    import {f7ConfirmPromisse, f7ConfirmYNPromisse} from "../../minilibs/f7extender";
    import type IReadOnlyStore from "../../minilibs/IReadOnlyStore";
    import LockedStore from "../../minilibs/LockedStore";
    import type { IInstalledUtau } from "../../handlers/IInstalledUtauHandler";
    import UtauItem from "../components/extractPage/utauItem.svelte";
    import type { UtauConversorDetailsProps } from "./utauConversorDetails";
    import type { Router } from "framework7/types";

    export let f7router: Router.Router;

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);

    let externalInterface: IUtauConversorView = {
        goToConversionPage: (props: UtauConversorDetailsProps) => {
            f7router.navigate("/utau-conversor-details/", {props: props});
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
    let presenter = new UtauConversorPresenter(
        externalInterface,
        new modelsAndHandlers.UtauConversorModel(
            pathStringHandler,
            fileSystemHandler,
            new modelsAndHandlers.InstalledUtauHandler(fileSystemHandler, pathStringHandler)
        )
    );
    
    let usersUtau: IReadOnlyStore<IInstalledUtau[]> = new LockedStore([]);
    let systemUtau: IReadOnlyStore<IInstalledUtau[]> = new LockedStore([]);

    onMount(async() => {
        await presenter.init();
        usersUtau = presenter.usersUtau;
        systemUtau = presenter.systemUtau;
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
    <Navbar title="UTAU Conversor" backLink />
    <div class="content-container">
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
                                actionText="Convert ..."
                                revertActionText="Revert"
                                actionCallback={() => {presenter.loadUtauConvertPage(utau)}}
                                revertActionCallback={() => {presenter.revertUtau(utau)}}
                                actionClick={(u) => {presenter.openUtauDirectory(u)}}
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
                                actionText="Convert ..."
                                revertActionText="Revert"
                                actionCallback={() => {presenter.loadUtauConvertPage(utau)}}
                                revertActionCallback={() => {presenter.revertUtau(utau)}}
                                actionClick={(u) => {presenter.openUtauDirectory(u)}}
                            ></UtauItem>
                        {/each}
                    </ListGroup>
                {/if}
            </List>
        {/if}
    </div>
</Page>