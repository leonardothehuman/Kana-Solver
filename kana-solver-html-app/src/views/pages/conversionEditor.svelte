<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {
        Page, Navbar, Row, Col, List, NavRight, Link, Panel,
        BlockTitle, BlockHeader, ListInput, ListItem, Fab, Icon} from "framework7-svelte";
    import ColorListItem from "../components/conversionEditor/colorListItem.svelte";
    import Retick from '../components/retick.svelte';
    import { getContext, onDestroy, onMount, tick } from "svelte";
    import type {ConversionFile, ConversionUnit, ConversionUnitCollection} from "../../minilibs/parsers/conversion_file";
    import { f7 } from 'framework7-svelte';
    import keys from "../../keys";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import { ConversionEditorPresenter, conversionFileRepresentation, IConversionEditorView } from "../../presenters/conversionEditorPresenter";
    import type IStore from "../../minilibs/IStore";
    import LockedStore from "../../minilibs/LockedStore";
    import NestedStoreInput from "../components/nestedStoreInput.svelte";
    import type IReadOnlyStore from "../../minilibs/IReadOnlyStore";
    import SpinnerManipulator from "../commonImplementations/spinnerManipulator";
    import {f7ConfirmPromisse, f7ConfirmYNPromisse} from "../../minilibs/f7extender";
    import type AsyncStoreInterceptor from "../../minilibs/AsyncStoreInterceptor";
    import { sleep } from "../../minilibs/helpers";
    import type {leaveConfirmators} from "../../routes";
    import ConversionFileSelector from "../components/conversionFileSelector.svelte";
    import type { ConversionItem, selectChangeInterceptedEventArgs } from "../../presenters/conversionFileSelectorPresenter";
    import type { GlobalInterface } from "../../App";
    import type IPathHandler from "../../handlers/IPathHandler";
    
    var nw = require('nw.gui');
    var win = nw.Window.get();

    let pageLeaveConfirmators:leaveConfirmators = getContext(keys.pageLeaveConfirmators);
    let leaveConfirmators: Set<() => Promise<boolean>> = new Set();
    pageLeaveConfirmators.conversionEditor = async function ({ resolve, reject }:{resolve: Function, reject: Function}) {
        let hasFalse = false;
        for (let cb of leaveConfirmators.values()){
            if(await cb() == false){
                hasFalse = true;
            }
        }
        if(hasFalse){
            reject();
        }else{
            resolve();
        }   
    }

    let closeConfirmators: Set<() => Promise<boolean>> = new Set();
    let closeCallback = async function () {
        let hasFalse = false;
        for (let cb of closeConfirmators.values()){
            if(await cb() == false){
                hasFalse = true;
            }
        }
        if(!hasFalse){
            this.close(true);
        }
    }
    onMount(() => {
        win.on('close', closeCallback);
    });

    onDestroy(() => {
        win.removeListener('close', closeCallback);
    });
    
    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let installedConversionFiles: conversionFileRepresentation[] = [];
    let globalInterface: GlobalInterface = getContext(keys.globalInterface);
    let pathHandler: IPathHandler = getContext(keys.pathHandler);
    
    let externalInterface: IConversionEditorView = {
        setInstalledConversionFiles: (icf: conversionFileRepresentation[], onlyOnChange: boolean) => {
            if(installedConversionFiles == icf && onlyOnChange == true) return false;
            installedConversionFiles = icf;
            return true;
        },
        registerLeaveConfirmationCallback: (f: () => Promise<boolean>) => {
            leaveConfirmators.add(f);
        },
        registerCloseConfirmationCallback: (f: () => Promise<boolean>) => {
            closeConfirmators.add(f);
        },
        scrollTo: (x: number, y: number) => {
            mainContainer.scrollTo(x, y);
        },
        showSpinner: globalInterface.showSpinner,
        emitAlert: globalInterface.emitAlert,
        askConfirmation: globalInterface.askConfirmation,
        askConfirmationYN: globalInterface.askConfirmationYN,
        prompt: globalInterface.prompt
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let presenter = new ConversionEditorPresenter(
        externalInterface,
        new modelsAndHandlers.ConversionEditorModel(
            pathStringHandler,
            new modelsAndHandlers.FileSystemHandler(pathStringHandler),
            pathHandler
        )
    );
    
    let inited:{inited: boolean} = {inited: false};
    let canSaveTheCurrentFile: IReadOnlyStore<boolean> = new LockedStore(false);
    let canDeleteTheCurrentFile: IReadOnlyStore<boolean> = new LockedStore(false);
    let mainContainer: HTMLDivElement;
    let virtualList: List|null;

    let scrollListener = () => {
        if(virtualList == null) return;
        if((typeof virtualList.virtualListInstance).toLowerCase() != 'function') return;
        virtualList.virtualListInstance().update();
    }
    onMount(async() => {
        inited.inited = await presenter.init();
        canSaveTheCurrentFile = presenter.canSaveCurrentFile;
        canDeleteTheCurrentFile = presenter.canDeleteCurrentFile;
        mainContainer.addEventListener("scroll", scrollListener);

        //Garbage collection test
        // let n = 1;
        // setInterval(() => {
        //     selectedConversionFileIndex.set(n);
        //     if(n == 1){
        //         n = 2
        //     }else{
        //         n = 1;
        //     }
        // }, 1000);
    });
    onDestroy(() => {
        mainContainer.removeEventListener("scroll", scrollListener);
    });

    let conversionFieldVL:{
        items: ConversionUnit[],
        topPosition: string
    } = {
        items: [],
        topPosition: "0"
    }
    let renderExternal = (virtualList: any, virtualListData: typeof conversionFieldVL) => {
        conversionFieldVL = virtualListData;
    }
    
    let currentAuthor: IStore<string>;
    let currentDescription: IStore<string>;
    let conversionData: ConversionUnitCollection;
    let currentConversionFile: IReadOnlyStore<ConversionFile | null> = presenter.currentConversionFile;
    function updateConversionFile(f: ConversionFile | null){
        if(f == null){
            currentAuthor = new LockedStore("");
            currentDescription = new LockedStore("");
            conversionData = new LockedStore([]);
        }else{
            currentAuthor = f.conversionRecipe.head.author;
            currentDescription = f.conversionRecipe.head.description;
            conversionData = f.conversionRecipe.conversionData;
        }
    }
    let u = currentConversionFile.subscribe((nv) => {
        updateConversionFile(nv);
    });
    onDestroy(() => {
        u();
    });
    // updateConversionFile($currentConversionFile);

    async function updateVList(data: ConversionUnit[]){
        if(virtualList == null) return;
        if((typeof virtualList.virtualListInstance).toLowerCase() != 'function') return;
        virtualList.virtualListInstance().clearCache();
        virtualList.virtualListInstance().replaceAllItems(data);
    }
    $:{
        if(inited.inited == true){
            updateVList($conversionData);
        }
    }

    function selectChangeIntercepted(e: CustomEvent<selectChangeInterceptedEventArgs>){
        if(e.detail.result.valid == true) mainContainer.scrollTo(0, 0);
    }

    let conversionItem: ConversionItem | null = null;
    $: {
        presenter.setCurrentConversionItem(conversionItem);
    }
</script>
<style lang="less">
    @import "../less/globalMixins.less";

    .end-spacer{
        height: 56px;
    }
    .content-container{
        .m-container();
        :global(.no-bottom-margin){
            margin-bottom: 0px;
        }
        :global(.no-top-margin){
            margin-top: 0px;
        }
    }
</style>
<Page>
    <Navbar title="Conversion Editor" backLink >
        <NavRight>
            <Link icon="menu" panelOpen="#page-menu"><i class="f7-icons">menu</i></Link>
        </NavRight>
    </Navbar>

    <Panel right id="page-menu">
        <Page>
            <Navbar title="Conversion Editor"></Navbar>
            <List>
                <ListItem title="New file" link="#" on:click={async() => {
                    presenter.createNewFile();
                    f7.panel.close("#page-menu");
                }}>
                    <i slot="media" class="f7-icons">doc</i>
                </ListItem>
                <ListItem title="Add Item" link="#" on:click={async() => {
                    presenter.addEmptyUnit();
                    await tick();
                    mainContainer.scrollTo(0, mainContainer.scrollHeight);
                    f7.panel.close("#page-menu");
                }}>
                    <i slot="media" class="f7-icons">plus</i>
                </ListItem>
                <ListItem title="Save" link="#" textColor={$canSaveTheCurrentFile ? "" : "gray"} on:click={async() => {
                    let couldSaveTheCurrentFile = $canSaveTheCurrentFile;
                    await presenter.saveCurrentFile();
                    if(couldSaveTheCurrentFile == false) return;
                    f7.panel.close("#page-menu");
                }}>
                    <i slot="media" class="f7-icons">floppy_disk</i>
                </ListItem>
                <ListItem title="Save As ..." link="#" on:click={async() => {
                    await presenter.saveCurrentFileAs();
                    f7.panel.close("#page-menu");
                }}>
                    <i slot="media" class="f7-icons">app_badge</i>
                </ListItem>
                <ListItem title="Delete This File" textColor={$canDeleteTheCurrentFile ? "" : "gray"} link="#" on:click={async() => {
                    let couldDeleteTheCurrentFile = $canDeleteTheCurrentFile;
                    await presenter.deleteCurrentFile();
                    if(couldDeleteTheCurrentFile == false) return;
                    f7.panel.close("#page-menu");
                }} >
                    <i slot="media" class="f7-icons">trash</i>
                </ListItem>
                <ListItem title="Open Conversion Directory" link="#" on:click={() => {
                    presenter.openUserDirectory();
                    f7.panel.close("#page-menu");
                }}>
                    <i slot="media" class="f7-icons">folder_badge_person_crop</i>
                </ListItem>
            </List>
        </Page>
    </Panel>

    <Fab position="right-bottom" on:click={async() => {
            presenter.addEmptyUnit();
            await tick();
            mainContainer.scrollTo(0, mainContainer.scrollHeight);
        }}>
        <Icon ios="f7:plus" aurora="f7:plus" md="f7:plus"></Icon>
    </Fab>
    <div class="content-container" bind:this={mainContainer}>
        <BlockTitle>Conversion File</BlockTitle>
        <BlockHeader>Select an existing file or create a new file</BlockHeader>
        <ConversionFileSelector
            on:selectChangeIntercepted={selectChangeIntercepted}
            bind:conversionItem={conversionItem}
            informSaveAs={presenter.fileSavedAs}
            informDelete={presenter.fileDeleted}
            informCreate={presenter.fileCreated}
            ></ConversionFileSelector>
        <BlockTitle>Author</BlockTitle>
        <BlockHeader>Who created this conversion file ?</BlockHeader>
        <List>
            <ListInput
                label="Author"
                type="text"
                placeholder="Author"
                bind:value={$currentAuthor}
            />
            <ListInput
                label="Description"
                type="textarea"
                placeholder="Description"
                bind:value={$currentDescription}
            />
        </List>

        <BlockTitle>Rules</BlockTitle>
        <BlockHeader>
            Characters on Kana column will become characters on Romaji column <br />
            Red rows means duplicated kanas
        </BlockHeader>
        <List class="no-bottom-margin">
            <ListInput input={false} >
                <span slot="input">
                    <Row style="width: 100%">
                        <Col style="width: calc(50% - 12px); box-sizing: border-box; padding-right: 16px;">
                            Kana
                        </Col>
                        <Col style="width: calc(50% - 12px); box-sizing: border-box; padding-right: 16px;">
                            Romaji
                        </Col>
                        <Col style="width: 24px">
                        </Col>
                    </Row>
                </span>
            </ListInput>
        </List>
        <Retick display={$conversionData.length > 0} monitor={$conversionData}>
            <List class="no-top-margin" virtualList bind:this={virtualList} virtualListParams={{
                items: $conversionData,
                height: 48,
                renderExternal: renderExternal
            }}>
                {#each conversionFieldVL.items as unit, i (unit)}
                    <ListItem
                        style={`top: ${conversionFieldVL.topPosition}px`}
                        virtualListIndex={$conversionData.indexOf(unit)}
                    >
                        <div slot="root-start">
                            <ColorListItem
                                boundValue={unit.kanaIsDuplicated}
                                trueColor="var(--f7-color-red)"
                                falseColor={null}
                            ></ColorListItem>
                        </div>
                        <Row style="width: 100%">
                            <Col style="width: calc(50% - 12px); box-sizing: border-box; padding-right: 16px;">
                                <NestedStoreInput boundValue={unit.kana} type="text" placeholder="Kana" />
                            </Col>
                            <Col style="width: calc(50% - 12px); box-sizing: border-box; padding-right: 16px;">
                                <NestedStoreInput boundValue={unit.romaji} type="text" placeholder="Romaji"/>
                            </Col>
                            <Col style="width: 24px">
                                <Link textColor="red" on:click={() => {
                                    presenter.deleteUnit($conversionData.indexOf(unit));
                                }}><i class="f7-icons">trash</i></Link>
                            </Col>
                        </Row>
                    </ListItem>
                {/each}
            </List>
        </Retick>

        <!-- The same as above, but without virtual list ... -->
        <!-- <List>
            {#each conversionData as unit, i (unit)}
                <ListItem>
                    <div slot="root-start">
                        <ColorListItem
                            boundValue={unit.kanaIsDuplicated}
                            trueColor="var(--f7-color-red)"
                            falseColor={null}
                        ></ColorListItem>
                    </div>
                    <Row style="width: 100%">
                        <Col style="width: calc(50% - 12px); box-sizing: border-box; padding-right: 16px;">
                            <NestedStoreInput boundValue={unit.kana} type="text" placeholder="Kana" />
                        </Col>
                        <Col style="width: calc(50% - 12px); box-sizing: border-box; padding-right: 16px;">
                            <NestedStoreInput boundValue={unit.romaji} type="text" placeholder="Romaji"/>
                        </Col>
                        <Col style="width: 24px">
                            <Link textColor="red" on:click={() => {
                                presenter.deleteUnit(conversionData.indexOf(unit));
                            }}><i class="f7-icons">trash</i></Link>
                        </Col>
                    </Row>
                </ListItem>
            {/each}
        </List> -->
        <div class="end-spacer"></div>
    </div>
</Page>