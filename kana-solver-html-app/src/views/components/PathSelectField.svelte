<script lang="ts">
    //This file is licensed MIT license
    import {ListInput, Input, Button, Row, Col, ListItem, List} from "framework7-svelte";
    import {tick} from "svelte";
    import FileFinder from "../pages/fileFinder.svelte";
    export let label:string = "";
    export let selectedPath:string = "";
    export let extensionList:string[] = [];
    export let extensionLabels: {[key:string]:string} = {};
    export let selectDirectory:boolean = false;

    if(extensionLabels["*.*"] === undefined){
        extensionLabels["*.*"] = "All files";
    }

    let animationHandlerClass = "";
    let animatedItemClass = "";
    let FileFinderProps = FileFinder.prototype.$$prop_def;

    let routeProps:typeof FileFinderProps={
        selectCallback: (e) => {
            selectedPath = e.selectedPath
        },
        extensionList: extensionList,
        extensionLabels: extensionLabels,
        selectDirectory: selectDirectory,
        initialDirectory: selectedPath
    }

    $: routeProps.initialDirectory = selectedPath;

    function dropHandler(e:DragEvent){
        e.preventDefault();
        animationHandlerClass = "";
        animatedItemClass = "";
        
        if (!e.dataTransfer.items) return;
        if(e.dataTransfer.items.length != 1) return;
        for (var i = 0; i < e.dataTransfer.items.length; i++) {
            let entry = e.dataTransfer.items[i].webkitGetAsEntry();
            if(entry.isDirectory == true && selectDirectory == true){
                selectedPath = e.dataTransfer.items[i].getAsFile().path;
            }
            if(entry.isFile == true && selectDirectory == false){
                selectedPath = e.dataTransfer.items[i].getAsFile().path;
            }
        }
    }

    
    async function dragHandler(e:DragEvent){
        e.preventDefault();
        animationHandlerClass = "display";
        await tick();
        setTimeout(() => {
            animatedItemClass = "entering";
        }, 1);
    }

    function dragLeave(e:DragEvent){
        e.preventDefault();
        animatedItemClass = "";
    }

    function dragEndHandler(){
        if(animatedItemClass != "") return;
        animationHandlerClass = "";
    }
</script>

<style lang="less">
    .controllable-inner{
        width: 100%;
        :global(.list){
            margin: 0px;
        }
        :global(.item-inner),
        :global(ul), 
        :global(.item-content){
            padding: 0px;
        }
    }

    .drop-overlay{
        display: none;
        box-sizing: border-box;
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 10;
        overflow: hidden;
    }
    .drop-overlay:global(.display){
        display: block;
    }

    .animated-item{
        box-sizing: border-box;
        border: 2px solid blue;
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 10;
        opacity: 0;
        top: -100%;
        transition: opacity 1s, top 0.3s;
    }
    .animated-item:global(.entering){
        opacity: 0.9;
        top: 0%;
    }

    .drop-handler{
        display: none;
        box-sizing: border-box;
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 15;
        overflow: hidden;
    }
    .drop-handler:global(.display){
        display: block;
    }
</style>

<ListItem>
    <div slot="root-start">
        <div class="drop-overlay {animationHandlerClass}">
            <div class="animated-item {animatedItemClass}" on:transitionend={dragEndHandler}>
                <i class="f7-icons">doc_on_doc</i>
            </div>
        </div>
        <div 
            class="drop-handler {animationHandlerClass}"
            on:drop={dropHandler} 
            on:dragover={dragHandler} 
            on:dragleave={dragLeave}
        ></div>
    </div>
    
    <div class="controllable-inner" on:dragover={dragHandler}>
        <List>
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
        </List>
    </div>
</ListItem>