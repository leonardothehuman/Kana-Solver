<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {
        Page, Navbar, Row, Col, Input, Button, List, NavRight, Link, Panel, Block, ListItemRow,
        ListInput, ListItem, Fab, Icon, FabButtons, FabButton} from "framework7-svelte";
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
    
    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let installedConversionFiles: conversionFileRepresentation[] = [];
    
    let externalInterface: IConversionEditorView = {
        setInstalledConversionFiles: (icf: conversionFileRepresentation[], onlyOnChange: boolean) => {
            if(installedConversionFiles == icf && onlyOnChange == true) return false;
            installedConversionFiles = icf;
            return true;
        },
        showSpinner: async(title: string) => {
            let dialog = f7.dialog.preloader(title);
            await sleep(50);
            return new SpinnerManipulator(dialog);
        },
        askConfirmation: (text: string, title: string) => {
            return f7ConfirmPromisse(f7, text, title);
        },
        askConfirmationYN: (text: string, title: string) => {
            return f7ConfirmYNPromisse(f7, text, title);
        },
        emitAlert: (text: string, title: string) => {
            return new Promise((resolve, reject) => {
                f7.dialog.alert(text, title, () => {resolve()});
            });
        },
        scrollTo: (x: number, y: number) => {
            mainContainer.scrollTo(x, y);
        },
        prompt: (title: string, text: string, defaultValue: string): Promise<{
            text: string,
            ok: boolean
        }> => {
            return new Promise((resolve, reject) => {
                f7.dialog.prompt(
                    text,
                    title,
                    (t: string) => {
                        resolve({
                            text: t,
                            ok: true
                        })
                    },
                    (t: string) => {
                        resolve({
                            text: t,
                            ok: false
                        })
                    },
                    defaultValue
                );
            });
        }
    }

    let pathStringHandler = new modelsAndHandlers.PathStringHandler();
    let presenter = new ConversionEditorPresenter(
        externalInterface,
        new modelsAndHandlers.ConversionEditorModel(
            pathStringHandler,
            new modelsAndHandlers.FileSystemHandler(pathStringHandler)
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
    let selectedConversionFileIndex: AsyncStoreInterceptor<number> = presenter.selectedConversionFileIndex;
    function updateConversionFile(f: ConversionFile | null){
        if(f == null){
            currentAuthor = new LockedStore("");
            currentDescription = new LockedStore("");
            conversionData = new LockedStore([]);
        }else{
            currentAuthor = f.conversionRecipe.head.author;
            currentDescription = f.conversionRecipe.head.description;
            conversionData = f.conversionRecipe.conversionData;
            //conversionData = f.conversionRecipe.conversionData;
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
        <List>
            <!-- bind:this={fileListRef} -->
            <ListItem
                title="Conversion file" smartSelect
                smartSelectParams={{openIn: 'popover', closeOnSelect: true, setValueText: false }}
            >
                <select name="conversionLists" bind:value={$selectedConversionFileIndex}>
                    {#each installedConversionFiles as cfile, i (cfile)}
                        {#if cfile.isNew == true}
                            <option value={i}>{cfile.nameWithoutExtension}</option>
                        {/if}
                    {/each}
                    <optgroup label="Built-in">
                        {#each installedConversionFiles as cfile, i}
                            {#if cfile.isBuiltIn == true && cfile.isNew != true}
                                <option value={i}>{cfile.nameWithoutExtension}</option>
                            {/if}
                        {/each}
                    </optgroup>
                    <optgroup label="Installed">
                        {#each installedConversionFiles as cfile, i}
                            {#if cfile.isBuiltIn != true}
                                <option value={i}>{cfile.nameWithoutExtension}</option>
                            {/if}
                        {/each}
                    </optgroup>
                </select>
                <span slot="after">
                    {#if installedConversionFiles[$selectedConversionFileIndex] != undefined}
                        {installedConversionFiles[$selectedConversionFileIndex].nameWithoutExtension}
                    {/if}
                </span>
                <i slot="media" class="f7-icons">archivebox</i>
            </ListItem>
        </List>
        <List>
            <ListInput
                label="Author"
                type="text"
                placeholder="Author"
                bind:value={$currentAuthor}
                clearButton
            />
            <ListInput
                label="Description"
                type="textarea"
                placeholder="Description"
                bind:value={$currentDescription}
                clearButton
            />
        </List>
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