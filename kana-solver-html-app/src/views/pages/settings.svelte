<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, ListItem, BlockTitle, BlockHeader} from "framework7-svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import { getContext, onMount } from "svelte";
    import keys from "../../keys";
    import type ISettingsHandler from "../../handlers/ISettingsHandler";
    import type { colorSchemeOptions } from "../../handlers/ISettingsHandler";
    import { ISettingsView, SettingsPresenter } from "../../presenters/settingsPresenter";
    import type IStore from "../../minilibs/IStore";
    import LockedStore from "../../minilibs/LockedStore";
    import RadioManager from "../../minilibs/radioManager";

    let radiomanager: RadioManager = new RadioManager();

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let settingsHandler: ISettingsHandler = getContext(keys.settingsHandler);

    let externalInterface: ISettingsView = {
        // scrollTo: (x: number, y: number) => {
        //     mainContainer.scrollTo(x, y);
        // },
        // showSpinner: async(title: string) => {
        //     let dialog = f7.dialog.preloader(title);
        //     await sleep(50);
        //     return new SpinnerManipulator(dialog);
        // },
        // emitAlert: (text: string, title: string) => {
        //     return new Promise<void>((resolve, reject) => {
        //         f7.dialog.alert(text, title, () => {resolve()});
        //     });
        // }
    }

    let presenter = new SettingsPresenter(
        externalInterface,
        new modelsAndHandlers.SettingsModel(settingsHandler)
    );
    
    let UTAUInstallationDirectory: IStore<string> = new LockedStore("");
    let ColorScheme: IStore<colorSchemeOptions> = new LockedStore("system");

    onMount(async() => {
        await presenter.init();
        UTAUInstallationDirectory = presenter.UTAUInstallationDirectory;
        ColorScheme = presenter.ColorScheme;
    });

    //Boilerplate to manage radio
    radiomanager.addPopulatable("color-scheme", (v: string) => {
        $ColorScheme = v as colorSchemeOptions;
    });
    onMount(() => {
        radiomanager.populateRadio("color-scheme", $ColorScheme);
    });
    $: {
        radiomanager.populateRadio("color-scheme", $ColorScheme);
        //extractDetailsPresenter.destinationType = destinationType;
    }
    //Boilerplate end
</script>
<Page>
    <Navbar title="Settings" backLink />
    <BlockTitle>UTAU installation directory</BlockTitle>
    <BlockHeader>Select the UTAU installation directory (Not the "voice" directory, You can drag a directory here)</BlockHeader>
    <List noHairlinesMd>
        <PathSelectField
            label="Utau installation directory"
            bind:selectedPath={$UTAUInstallationDirectory}
            selectDirectory={true}></PathSelectField>
        <!-- <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
        <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail /> -->
    </List>
    <BlockTitle>Color Scheme</BlockTitle>
    <BlockHeader>Select a color scheme</BlockHeader>
    <List inlineLabels>
        <ListItem
            radio
            radioIcon="start"
            title="Light"
            value="light"
            name="color-scheme"
            disabled={false}
            on:change={() => {radiomanager.populateVariable("color-scheme")}}
        ></ListItem>
        <ListItem
            radio
            radioIcon="start"
            title="Dark"
            value="dark"
            name="color-scheme"
            disabled={false}
            on:change={() => {radiomanager.populateVariable("color-scheme")}}
        ></ListItem>
        <ListItem
            radio
            radioIcon="start"
            title="System"
            value="system"
            name="color-scheme"
            disabled={false}
            on:change={() => {radiomanager.populateVariable("color-scheme")}}
        ></ListItem>
    </List>
</Page>