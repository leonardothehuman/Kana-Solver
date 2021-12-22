<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, ListItem, BlockTitle, BlockHeader} from "framework7-svelte";
    import PathSelectField from "../components/pathSelectField.svelte";

    let installationDirectory = localStorage.getItem("UTAUInstallationDirectory");

    $: localStorage.setItem("UTAUInstallationDirectory", installationDirectory);
</script>
<Page>
    <Navbar title="Settings" backLink />
    <BlockTitle>UTAU installation directory</BlockTitle>
    <BlockHeader>Select the UTAU installation directory (Not the "voice" directory, You can drag a directory here)</BlockHeader>
    <List noHairlinesMd>
        <PathSelectField
            label="Utau installation directory"
            bind:selectedPath={installationDirectory}
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
</Page>