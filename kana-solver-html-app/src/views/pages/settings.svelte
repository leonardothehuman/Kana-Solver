<script lang="ts">
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
            extensionList={['*.zip', '*.rar']}
            bind:selectedPath={installationDirectory}
            selectDirectory={true}></PathSelectField>
    </List>
</Page>