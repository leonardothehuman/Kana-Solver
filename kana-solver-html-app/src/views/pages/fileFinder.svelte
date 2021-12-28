<script lang="ts">
    //This file is licensed under MIT license
    import {Navbar, Page, List, ListItem, Link, Toolbar, Subnavbar, ListGroup} from 'framework7-svelte';
    import {getContext, onMount} from 'svelte';
    import keys from '../../keys';
    import {FileFinderPresenter} from "../../presenters/fileFinderPresenter";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import type {IFileFinderView, breadCrumbItem } from "../../presenters/fileFinderPresenter";
    import { f7 } from 'framework7-svelte';
    import type { Router } from "framework7/types";
    import type IPathStringHandler from '../../handlers/IPathStringshandler';
    import type { objectRepresentation } from '../../handlers/IFileSystemHandler';
    import type IReadOnlyStore from '../../minilibs/IReadOnlyStore';
    import LockedStore from '../../minilibs/LockedStore';
    import type IStore from '../../minilibs/IStore';
    import type { GlobalInterface } from '../../App';

    export let extensionList:string[] = [];
    export let extensionLabels: {[key:string]:string} = {};
    export let selectDirectory:boolean = false;
    export let initialDirectory: string = "";
    export let f7router: Router.Router;
    export let selectCallback: (e: selectCallbackEvent) => void = function(){};
    type selectCallbackEvent = {
        selectedPath:string
    }

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let globalInterface: GlobalInterface = getContext(keys.globalInterface);
    
    //ONLY MODIFY VARIABLES THAT HAVE REACTIVE CODE TO CALL THE HELPERS ON THE PRESENTER
    //OR THAT ARE NOT USED BY THE PRESENTER
    //Visible lists
    
    
    //Selected items
    let externalInterface: IFileFinderView = {
        scrollTo: (x: number, y: number) => {
            mainContainer.scrollTo(x, y);
        },
        showSpinner: globalInterface.showSpinner,
        emitAlert: globalInterface.emitAlert
    }

    let pathStringHandler: IPathStringHandler = new modelsAndHandlers.PathStringHandler();
    let fileFinderPresenter:FileFinderPresenter = new FileFinderPresenter(
        externalInterface,
        new modelsAndHandlers.FileFinderModel(
            pathStringHandler,
            new modelsAndHandlers.FileSystemHandler(pathStringHandler)
        ),
        selectDirectory, extensionList
    );

    let mainContainer: HTMLDivElement;

    async function goToDirectory(directory: string){
        try {
            await fileFinderPresenter.setCurrentFullLocation(directory);
        } catch (error) {
        }
    }

    let navbarTitle = "Select a file";
    let customtoolbarClass = "customtoolbar";
    if(selectDirectory){
        navbarTitle = "Select a directory";
        customtoolbarClass = "";
    }

    let currentDirectoryObjectsList:IReadOnlyStore<objectRepresentation[]> = new LockedStore([]);
    let breadCrumb: IReadOnlyStore<breadCrumbItem[]> = new LockedStore([]);
    let driveList: IStore<string[]> = new LockedStore([]);
    let currentExtenssion: IStore<string> = new LockedStore("*.*");
    let currentDrive: IStore<string> = new LockedStore('');
    let selectableExtensionList: IReadOnlyStore<string[]> = new LockedStore(["*.*"]);

    onMount(async() => {
        await fileFinderPresenter.init(initialDirectory);
        currentDirectoryObjectsList = fileFinderPresenter.currentDirectoryObjectsList;
        breadCrumb = fileFinderPresenter.breadCrumb;
        driveList = fileFinderPresenter.driveList;
        currentExtenssion = fileFinderPresenter.currentExtenssion;
        currentDrive = fileFinderPresenter.currentDrive;
        selectableExtensionList = fileFinderPresenter.selectableExtensionList;
    });

    let listArguments: any = {
        ul: false
    }
</script>

<style lang="less">
    @import "../less/globalMixins.less";

    .breadcrumbs-container{
        width: 100%;
        height: 100%;
        overflow-x: auto;
        overflow-y: clip;
        padding: 0px;
        margin: 0px;
    }
    .breadcrumbs{
        display: inline;
        white-space: nowrap;
    }
    .breadcrumbs :global(.link),
    .breadcrumbs :global(span){
        display: inline;
    }
    .customtoolbar{
        padding-left: 0px;
        padding-right: 0px;
    }
    .customtoolbar :global(.list){
        width: 100%;
    }
    .customtoolbar :global(.list .item-after){
        color: var(--f7-text-color);
    }
    .content-container{
        .m-container();
    }
    .content-container :global(.list){
        margin-top: -1px;
    }
</style>

<Page>
    <Navbar title={navbarTitle} backLink>
        <Subnavbar>
            <div class="breadcrumbs-container">
                <span class="breadcrumbs">
                    {#each $breadCrumb as bc (bc)}
                        <Link
                            on:click={async() => {
                                await goToDirectory(bc.completePath);
                            }} 
                        >{bc.name}</Link><span>\</span>
                    {/each}
                </span>
            </div>
        </Subnavbar>
    </Navbar>

    <div class="content-container" bind:this={mainContainer}>
        <List {...listArguments}>
            <ListGroup>
                <ListItem groupTitle title="Disk drive"></ListItem>
                <ListItem title="Drive" smartSelect smartSelectParams={{openIn: 'popover', closeOnSelect: true, setValueText: false}}>
                    <select name="Drive" bind:value={$currentDrive}>
                        {#each $driveList as drive}
                            <option value={drive}>{drive}</option>
                        {/each}
                        {#if !$driveList.includes($currentDrive)}
                            <option value={$currentDrive}>{$currentDrive}</option>
                        {/if}
                    </select>
                    <span slot="after">{$currentDrive}</span>
                    <i slot="media" class="f7-icons">house</i>
                </ListItem>
            </ListGroup>
            <ListGroup>
                <ListItem groupTitle title="Files"></ListItem>
                {#each $currentDirectoryObjectsList as dItem (dItem)}
                    {#if dItem.isDirectory}
                        <ListItem link="#"
                            on:click={async() => {
                                await goToDirectory(dItem.completePath);
                            }} 
                            title={dItem.name}>
                            <i slot="media" class="f7-icons">folder</i>
                        </ListItem>
                    {/if}
                {/each}
                {#each $currentDirectoryObjectsList as dItem (dItem)}
                    {#if dItem.isFile}
                        <ListItem link="#"
                            on:click={() => {
                                if(selectDirectory == true) return;
                                selectCallback({
                                    selectedPath: dItem.completePath
                                });
                                f7router.back();
                            }} title={dItem.name}>
                            <i slot="media" class="f7-icons">archivebox</i>
                        </ListItem>
                    {/if}
                {/each}
            </ListGroup>
        </List>
    </div>

    <Toolbar position="bottom" inner={false}>
        <div class="toolbar-inner {customtoolbarClass}">
            <Link></Link>
            {#if selectDirectory}
                <Link iconF7="square_arrow_right"
                    on:click={() => {
                        selectCallback({
                            selectedPath: fileFinderPresenter.getCurrentFullPath()
                        });
                        f7router.back();
                    }}
                    text="Select Directory"
                />
            {:else}
                <List>
                    <ListItem title="{extensionLabels[$currentExtenssion]}" smartSelect smartSelectParams={{openIn: 'popover', closeOnSelect: true, setValueText: false}}>
                        <select name="Extension" bind:value={$currentExtenssion}>
                            {#each $selectableExtensionList as ext}
                                <option value={ext}>
                                    {#if extensionLabels[ext]}
                                        {extensionLabels[ext]} 
                                    {/if}
                                    ({ext})
                                </option>
                            {/each}
                        </select>
                        <span slot="after">{$currentExtenssion}</span>
                    </ListItem>
                </List>
            {/if}
        </div>
    </Toolbar>
</Page>
