<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    // const yauzl = require("yauzl");
    // var iconv = require('iconv-lite');
    // const fsp = require("fs/promises");
    // const fs = require("fs");
    // const path = require("path");
    import {Page, Navbar, List, Button, ListItem} from "framework7-svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import { f7 } from 'framework7-svelte';
    import type { Router } from "framework7/types";
    import ExtractDetails from "./extractDetails.svelte";

    import ZipHandler from "../../handlers/ZipHandler";
    import PathStringsHandler from "../../handlers/PathStringsHandler";

    let zipHandler =  new ZipHandler(new PathStringsHandler());

    export let f7router: Router.Router;

    let utauVoicebank = '';
    let destination = "C:\\Users\\Leonardo\\Desktop\\extractTest";
    let extractDetailsProps = ExtractDetails.prototype.$$prop_def;

    async function readInstallTXT(){
        f7.dialog.preloader("Loading ...");
        try{
            let zipInfo = await zipHandler.getUtauZipInfo(utauVoicebank);
            let props: typeof extractDetailsProps = {
                fileToExtract: utauVoicebank,
                zipProperties: zipInfo
            };
            f7router.navigate("/extract-details/", {props: props});
            f7.dialog.close();
        }catch(error){
            f7.dialog.close();
            f7.dialog.alert(error.message, 'Failed to load utau file');
        }
    }
</script>
<Page>
    <Navbar title="Extractor" backLink />
    <List noHairlinesMd>
        <PathSelectField
            label="Utauloid to install"
            extensionList={['*.zip', '*.rar']}
            extensionLabels={{
                '*.zip': "ZIP files",
                '*.rar': "rar file"
            }}
            bind:selectedPath={utauVoicebank}
            selectDirectory={false}></PathSelectField>
    </List>
    <Button on:click={readInstallTXT} fill small>Install</Button>

    <List noHairlinesMd>
        <ListItem title="Kasane Teto" after="">
            <i slot="media" class="icon demo-list-icon" />
            <Button slot="after-end" fill small>Uninstall</Button>
        </ListItem>
        <ListItem title="Momo Momone" after="">
            <i slot="media" class="icon demo-list-icon" />
            <Button slot="after-end" fill small>Uninstall</Button>
        </ListItem>
    </List>
</Page>