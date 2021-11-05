<script lang="ts">
    //This file is licensed MIT license
    //TODO: Benefits from using store
    import {ListInput, Input, Button, Row, Col, ListItem, List} from "framework7-svelte";
    import {tick, getContext} from "svelte";
    import FileFinder from "../pages/fileFinder.svelte";
    import { f7 } from 'framework7-svelte';

    import {ManyItemsError} from "./pathSelectFieldT";
    import type {IPathSelectFieldHandler} from "./pathSelectFieldT";
    
    import keys from '../../keys';
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let ph: IPathSelectFieldHandler = new modelsAndHandlers.PathSelectFieldHandler();

    export let label:string = "";
    export let selectedPath:string = "";
    export let extensionList:string[] = [];
    export let extensionLabels: {[key:string]:string} = {};
    export let selectDirectory:boolean = false;
    export let disabled = false;

    if(extensionLabels["*.*"] === undefined){
        extensionLabels["*.*"] = "All files";
    }

    let animationHandlerClass = "";
    let animatedItemClass = "";
    let forbiddenItemClass = "";
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
        if(disabled) return;
        animationHandlerClass = "";
        animatedItemClass = "";

        try {
            let dropped = ph.extractFileFromDragEvent(e);
            if(
                (dropped.isDirectory == true && selectDirectory == true) ||
                (dropped.isFile == true && selectDirectory == false)
            ){
                selectedPath = dropped.path;
            }else if(dropped.isDirectory == false && selectDirectory == true){
                f7.dialog.alert("You can only drop directories here", 'Error');
            }else if(dropped.isFile == false && selectDirectory == false){
                f7.dialog.alert("You can only drop files here", 'Error');
            }else{
                f7.dialog.alert("You somehow dropped something that is neither a file nor a directory !!!", 'Error');
            }
        } catch (error) {
            if(error instanceof ManyItemsError){
                if(selectDirectory == true){
                    f7.dialog.alert("You can drop only ONE directory here", 'Error');
                }else{
                    f7.dialog.alert("You can drop only ONE file here", 'Error');
                }
            }else if(error instanceof Error){
                f7.dialog.alert(error.message, 'Error');
            }else{
                f7.dialog.alert("Error", 'Error');
            }
            console.log(error);
        }
    }
    
    async function dragHandler(e:DragEvent){
        e.preventDefault();
        if(disabled) return;
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

    function animationEndHandler(){
        if(animatedItemClass != "") return;
        animationHandlerClass = "";
    }

    let whatToDrop = "file";
    let iconToDrop = "doc_on_doc";
    if(selectDirectory == true){
        whatToDrop = "directory";
        iconToDrop = "folder_badge_plus"
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

    .controllable-inner.disabled-inner{
        :global(.item-label),
        :global(input){
            color: var(--f7-list-item-after-text-color);
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
        border: 0px;
        background: rgb(41,143,255);
        background: linear-gradient(180deg, rgba(41,143,255,1) 0%, rgba(41,143,255,1) 51%, rgba(41,143,255,0.5186274338837098) 100%);
        color: white;
        text-align: center;
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 10;
        opacity: 0;
        top: -100%;
        transition: opacity 0.5s, top 0.3s;
    }
    .animated-item:global(.forbidden-item){
        background: rgb(255,41,41);
        background: linear-gradient(180deg, rgba(255,41,41,1) 0%, rgba(255,41,41,1) 51%, rgba(255,41,41,0.5186274338837098) 100%);
    }
    .animated-item:global(.entering){
        opacity: 1;
        top: 0%;
    }
    .centered-text{
        position: absolute;
        text-align: center;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
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
            <div class="animated-item {forbiddenItemClass} {animatedItemClass}" on:transitionend={animationEndHandler}>
                <div class="centered-text">
                    <i class="f7-icons">{iconToDrop}</i> You can drop a {whatToDrop} here !!!
                </div>
            </div>
        </div>
        <div 
            class="drop-handler {animationHandlerClass}"
            on:drop={dropHandler} 
            on:dragover={dragHandler} 
            on:dragleave={dragLeave}
        ></div>
    </div>
    
    <div class="controllable-inner {disabled ? 'disabled-inner' : ''}" on:dragover={dragHandler}>
        <List>
            <ListInput
                bind:label={label}
                input={false}
            >
                <div slot="input">
                    <Row>
                        <Col style="width: calc(100% - 115px)">
                            <Input bind:value={selectedPath} disabled={disabled} type="text" />
                        </Col>
                        <Col style="width: 100px">
                            <Button
                                color={disabled ? "gray" : ""}
                                disabled={disabled}
                                href="/findFile/" fill small
                                routeProps={routeProps}>Search ...</Button>
                        </Col>
                    </Row>
                </div>
            </ListInput>
        </List>
    </div>
</ListItem>