<script lang="ts">
    //This file is licensed MIT license
    import {ListInput, Input, Button, Row, Col} from "framework7-svelte";
    import FileFinder from "../pages/fileFinder.svelte";
    export let label:string = "";
    export let selectedPath:string = "";
    export let extensionList:string[] = [];
    export let selectDirectory:boolean = false;

    let FileFinderProps = FileFinder.prototype.$$prop_def;

    let routeProps:typeof FileFinderProps={
        selectCallback: (e) => {
            selectedPath = e.selectedPath
        },
        extensionList: extensionList,
        selectDirectory: selectDirectory,
        initialDirectory: selectedPath
    }

    $: routeProps.initialDirectory = selectedPath;
</script>

<ListInput
    bind:label={label}
    input={false}
>
    <div slot="input">
        <Row>
            <Col style="width: calc(100% - 115px)">
                <Input bind:value={selectedPath} type="text" />
            </Col>
            <Col style="width: 100px">
                <Button
                    href="/findFile/" fill small
                    routeProps={routeProps}>Search</Button>
            </Col>
        </Row>
    </div>
</ListInput>