<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {
        Page, Navbar, List, Button, ListItem,
        f7, BlockTitle, Block, BlockHeader,
        Toolbar, Link
    } from "framework7-svelte";
    import {f7ConfirmPromisse} from "../../minilibs/f7extender";;
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import keys from '../../keys';
    import RadioManager from "../../minilibs/radioManager";
    import {getContext, onMount} from "svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import type { Router } from "framework7/types";
    import ProgressProcess from "../commonImplementations/progressProcess";
    import { ExtractDetailsPresenter, IExtractDetailsView, UtauDestinationType, UtauSourceType } from "../../presenters/extractDetailsPresenter";
    import type IPathStringHandler from "../../handlers/IPathStringshandler";
    import type { UtauZipInfo } from "../../handlers/IZipHandler";
    
    export let fileToExtract: string;
    export let zipProperties: UtauZipInfo;
    export let f7router: Router.Router;

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);

    let radiomanager: RadioManager = new RadioManager();
    let destinationType: UtauDestinationType;
    let sourceType: UtauSourceType;
    let canInstallUtau: boolean;
    let extractionDirectory: string;
    let canInstallFromRoot: boolean;
    let canInstallFromCustom: boolean;

    let externalInterface: IExtractDetailsView = {
        emitAlert: (text: string, title: string) => {
            return new Promise((resolve, reject) => {
                f7.dialog.alert(text, title, () => {resolve()});
            });
        },
        askConfirmation: (text: string, title: string) => {
            return f7ConfirmPromisse(f7, text, title);
        },
        createProgressProcess: (title: string, initialProgress: number) => {
            let dialog = f7.dialog.progress(title, initialProgress);
            return new ProgressProcess(dialog);
        },
        informExtractionSuccess: () => {
            f7router.back();
        },
        setDestinationType: (dt: UtauDestinationType, onlyOnChange: boolean) => {
            if(destinationType == dt && onlyOnChange == true) return false;
            destinationType = dt;
            return true;
        },
        setSourceType: (st: UtauSourceType, onlyOnChange: boolean) => {
            if(sourceType == st && onlyOnChange == true) return false;
            sourceType = st;
            return true;
        },
        setCanInstallUtau: (c: boolean, onlyOnChange: boolean) => {
            if(canInstallUtau == c && onlyOnChange == true) return false;
            canInstallUtau = c;
            return true;
        },
        setExtractionDirectory: (e: string, onlyOnChange: boolean) => {
            if(extractionDirectory == e && onlyOnChange == true) return false;
            extractionDirectory = e;
            return true;
        },
        setCanInstallFromRoot: (c: boolean, onlyOnChange: boolean) => {
            if(canInstallFromRoot == c && onlyOnChange == true) return false;
            canInstallFromRoot = c;
            return true;
        },
        setCanInstallFromCustom: (c: boolean, onlyOnChange: boolean) => {
            if(canInstallFromCustom == c && onlyOnChange == true) return false;
            canInstallFromCustom = c;
            return true;
        },
    }

    let pathStringHandler: IPathStringHandler = new modelsAndHandlers.PathStringHandler();
    let extractDetailsPresenter: ExtractDetailsPresenter = new ExtractDetailsPresenter(
        externalInterface,
        new modelsAndHandlers.ExtractDetailsModel(
            pathStringHandler,
            new modelsAndHandlers.FileSytemHandler(pathStringHandler),
            new modelsAndHandlers.ZipHandler(pathStringHandler),
        ),
        zipProperties,
        fileToExtract
    );

    //Boilerplate to manage radio
    radiomanager.addPopulatable("install-location", (v: string) => {
        destinationType = v as UtauDestinationType;
    });
    onMount(() => {
        radiomanager.populateRadio("install-location", destinationType);
    });
    $: {
        radiomanager.populateRadio("install-location", destinationType);
        extractDetailsPresenter.destinationType = destinationType;
    }
    //--------
    radiomanager.addPopulatable("install-from", (v: string) => {
        sourceType = v as UtauSourceType;
    })
    onMount(() => {
        radiomanager.populateRadio("install-from", sourceType);
    });
    $: {
        radiomanager.populateRadio("install-from", sourceType);
        extractDetailsPresenter.sourceType = sourceType;
    }
    //Boilerplate end
    $: {extractDetailsPresenter.extractionDirectory = extractionDirectory;}
    onMount(() => {
        extractDetailsPresenter.emitMountAlerts();
    });

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
                disabled={!canInstallUtau}
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <ListItem
                radio
                radioIcon="start"
                title="UTAU Directory (may require administrator privileges)"
                value="utau"
                name="install-location"
                disabled={!canInstallUtau}
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
                disabled={destinationType != "other"}
                bind:selectedPath={extractionDirectory}
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
                disabled={!canInstallFromRoot}
                on:change={() => {radiomanager.populateVariable("install-from")}}
            ></ListItem>
            {#if zipProperties.sourceOnZip.trim() != ""}
                <ListItem
                    radio
                    radioIcon="start"
                    title={zipProperties.sourceOnZip}
                    value="custom"
                    name="install-from"
                    disabled={!canInstallFromCustom}
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