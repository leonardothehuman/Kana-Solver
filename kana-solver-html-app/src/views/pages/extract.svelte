<script>
    //This file is licensed under GNU GPL v3.0 only license
    const yauzl = require("yauzl");
    var iconv = require('iconv-lite');
    const fsp = require("fs/promises");
    const fs = require("fs");
    const path = require("path");
    import {Page, Navbar, List, ListInput, Row, Col, Input, Button, ListItem} from "framework7-svelte";
    import {readTextFile, extractUtau} from '../../models/modules/extraction';
    import {parseInstallTxt} from '../../models/parsers/install_txt';
    import PathSelectField from "../components/PathSelectField.svelte";

    let utauVoicebank = '';

    let destination = "C:\\Users\\Leonardo\\Desktop\\extractTest";

    async function readInstallTXT(){
        console.log(parseInstallTxt(await readTextFile(utauVoicebank, 'install.txt')));
        const installTxt = parseInstallTxt(await readTextFile(utauVoicebank, 'install.txt'));
        extractUtau(utauVoicebank, destination, installTxt.contentsdir, installTxt.folder);
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