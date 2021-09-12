<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, ListInput, Input, Button, Row, Col} from "framework7-svelte";
    import PathSelectField from "../components/PathSelectField.svelte";

    let installationDirectory = localStorage.getItem("UTAUInstallationDirectory");

    $: localStorage.setItem("UTAUInstallationDirectory", installationDirectory);
</script>
<Page>
    <Navbar title="Settings" backLink />
    <List noHairlinesMd>
        <PathSelectField
            label="Utau installation directory"
            bind:selectedPath={installationDirectory}
            selectDirectory={true}></PathSelectField>
    </List>
</Page>