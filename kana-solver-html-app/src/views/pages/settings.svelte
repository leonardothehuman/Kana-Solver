<script>
    import {Page, Navbar, List, ListInput, Input, Button, Row, Col} from "framework7-svelte";

    let installationDirectory = localStorage.getItem("UTAUInstallationDirectory");

    $: localStorage.setItem("UTAUInstallationDirectory", installationDirectory);
</script>
<Page>
    <Navbar title="Settings" backLink />
    <List noHairlinesMd>
        <ListInput
          label="Utau installation directory"
          input={false}
        >
            <div slot="input">
                <Row>
                    <Col style="width: calc(100% - 115px)">
                        <Input bind:value={installationDirectory} type="text" />
                    </Col>
                    <Col style="width: 100px">
                        <Button
                            href="/findFile/" fill small
                            routeProps={{
                                selectCallback: (e) => {
                                    installationDirectory = e.directory
                                }
                            }}>Search</Button>
                    </Col>
                </Row>
            </div>
        </ListInput>
    </List>
</Page>