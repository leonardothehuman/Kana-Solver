<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, Row, Col, Input, Button, List, ListInput, ListItem} from "framework7-svelte";
    
    let ConversionFile: Array<{
        kana: string,
        romaji: string
    }>  = [];

    function addUnit(){
        ConversionFile = [...ConversionFile, {
            kana: "",
            romaji: ""
        }];
        console.log(ConversionFile);
    }
</script>
<Page>
    <Navbar title="Conversion Editor" backLink />
    <List>
        <ListItem title="Conversion file" smartSelect>
            <select name="fruits" value="default.json">
                <option value="default.json">default.json</option>
                <option value="alternative.json">alternative.json</option>
            </select>
        </ListItem>
    </List>
    <List noHairlinesMd>
        <ListInput input={false}>
            <span slot="input">
                <Row>
                    <Col>
                        Kana
                    </Col>
                    <Col>
                        Romaji
                    </Col>
                </Row>
            </span>
        </ListInput>
        {#each ConversionFile as unit, i (unit)}
            <ListInput input={false}>
                <span slot="input">
                    <Row>
                        <Col>
                            <Input bind:value={unit.kana} type="text" placeholder="Kana" />
                        </Col>
                        <Col>
                            <Input bind:value={unit.romaji} type="text" placeholder="Romaji"/>
                        </Col>
                    </Row>
                </span>
            </ListInput>
        {/each}
        
        <ListInput input={false}>
            <span slot="input">
                <Button on:click={addUnit} fill small>Add</Button>
            </span>
        </ListInput>
    </List>
</Page>