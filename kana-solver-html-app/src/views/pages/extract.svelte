<script>
    //C:\Users\Leonardo\AppData\Roaming\UTAU\voice\
    const yauzl = require("yauzl");
    var iconv = require('iconv-lite');
    const fsp = require("fs/promises");
    const fs = require("fs");
    const path = require("path");
    import {Page, Navbar, List, ListInput, Row, Col, Input, Button, ListItem} from "framework7-svelte";
    import {readTextFile, extractUtau} from '../../models/modules/extraction';
    import {parseInstallTxt} from '../../models/parsers/install_txt';

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
        <ListInput
          label="Utauloid to install"
          input={false}
        >
            <span slot="input">
                <Row>
                    <Col style="width: calc(100% - 115px)">
                        <Input bind:value={utauVoicebank} type="text" />
                    </Col>
                    <Col style="width: 100px">
                        <Button
                            href="/findFile/" fill small
                            routeProps={{
                                selectCallback: (e) => {
                                    utauVoicebank = e.directory
                                }
                            }}>Search</Button>
                    </Col>
                </Row>
            </span>
        </ListInput>
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