<script lang="ts">
    import {Navbar, Page, List, ListItem, Link, Input} from 'framework7-svelte';
    import path from "path";
    import {FileFinderPresenter} from "../../presenters/fileFinderPresenter";
    import type {IFileFinderView, objectRepresentation, breadCrumbItem } from "../../presenters/fileFinderPresenter";
    import { f7 } from 'framework7-svelte';

    export let extensionList:string[] = [];
    export let selectDirectory:boolean = false;
    export let initialDirectory: string = "";
    export let f7router: { back: () => void; };
    export let selectCallback: (e: selectCallbackEvent) => void = function(){};
    type selectCallbackEvent = {
        selectedPath:string
    }

    //ONLY MODIFY VARIABLES THAT HAVE REACTIVE CODE TO CALL THE HELPERS ON THE PRESENTER
    //OR THAT ARE NOT USED BY THE PRESENTER
    //Visible lists
    let selectableExtensionList: string[] = [...extensionList, "*.*"];
    let selectableDriveList: string[] = [];
    let currentDirectoryObjectsList: objectRepresentation[] = [];
    let breadCrumb: breadCrumbItem[] = [];

    //Selected items
    let currentDrive:string = '';
    let currentDirectory:string = '';
    let selectedExtention:string = selectableExtensionList[0];

    let externalInterface: IFileFinderView = {
        setCurrentDirectoryObjectsList: (list: objectRepresentation[], onlyOnChange: boolean) => {
            if(currentDirectoryObjectsList == list && onlyOnChange == true) return false;
            currentDirectoryObjectsList = list;
            return true;
        },
        setBreadcrumb: (b: breadCrumbItem[], onlyOnChange: boolean) => {
            if(breadCrumb  == b && onlyOnChange == true) return false;
            breadCrumb = b;
            return true;
        },

        getDriveList:() => {return selectableDriveList;},
        setDriveList:(list: Array<string>, onlyOnChange: boolean) => {
            if(selectableDriveList == list && onlyOnChange == true) return false;
            selectableDriveList = list;
            return true;
        },

        getCurrentDrive: () => {return currentDrive;},
        setCurrentDrive: (drive: string, onlyOnChange: boolean) => {
            if(currentDrive == drive && onlyOnChange == true) return false;
            currentDrive = drive;
            return true;
        },
        
        getCurrentDirectory: () => {return currentDirectory;},
        setCurrentDirectory: (d: string, onlyOnChange: boolean) => {
            if(currentDirectory == d && onlyOnChange == true) return false;
            currentDirectory = d;
            return true;
        },
        
        getCurrentExtention: () => {return selectedExtention;},
        setCurrentExtention: (ext: string, onlyOnChange: boolean) => {
            if(selectedExtention == ext && onlyOnChange == true) return false;
            selectedExtention = ext;
            return true;
        }
    }

    
    let fileFinderPresenter:FileFinderPresenter = new FileFinderPresenter(externalInterface);
    f7.dialog.preloader("Loading ...");
    fileFinderPresenter.init(
        initialDirectory
    ).then(() => {
        f7.dialog.close();
    }).catch((error) => {
        f7.dialog.close();
        f7.dialog.alert(error, 'Failed to load a directory');
    });
    
    let driveFirstLoad = true;
    $: {
        if(driveFirstLoad == false){
            f7.dialog.preloader("Loading ...");
            fileFinderPresenter.setCurrentDrive(currentDrive, true).then(() => {
                f7.dialog.close();
            }).catch((error) => {
                f7.dialog.close();
                f7.dialog.alert(error, 'Failed to select a drive');
            });
        }
        driveFirstLoad = false;
    }

    let extFirstLoad = true;
    $: {
        if(extFirstLoad == false) fileFinderPresenter.setCurrentExtention(selectedExtention);
        extFirstLoad = false;
    }

    async function goToDirectory(directory: string){
        f7.dialog.preloader("Loading ...");
        try {
            await fileFinderPresenter.setCurrentFullLocation(directory);
            f7.dialog.close();
        } catch (error) {
            f7.dialog.close();
            f7.dialog.alert(error, 'Failed to select a directory');
        }
    }
</script>

<Page>
    {#if selectDirectory}
        <Navbar title="Select a directory" backLink />
    {:else}
        <Navbar title="Select a file" backLink />
    {/if}
    
    <List>
        <ListItem title="Drive" smartSelect smartSelectParams={{openIn: 'popover', closeOnSelect: true, setValueText: false}}>
            <select name="Drive" bind:value={currentDrive}>
                {#each selectableDriveList as drive}
                    <option value={drive}>{drive}</option>
                {/each}
                {#if !selectableDriveList.includes(currentDrive)}
                    <option value={currentDrive}>{currentDrive}</option>
                {/if}
            </select>
            <span slot="after">{currentDrive}</span>
        </ListItem>

        <ListItem title="Extension" smartSelect smartSelectParams={{openIn: 'popover', closeOnSelect: true, setValueText: false}}>
            <select name="Extension" bind:value={selectedExtention}>
                {#each selectableExtensionList as ext}
                    <option value={ext}>{ext}</option>
                {/each}
            </select>
            <span slot="after">{selectedExtention}</span>
        </ListItem>
    </List>

    {#each breadCrumb as bc}
        <Link
            on:click={async() => {
                await goToDirectory(bc.completePath);
            }} 
        >{bc.name}</Link><span>\</span>
    {/each}
    
    <List>
        {#each currentDirectoryObjectsList as dItem}
            {#if dItem.isFile}
                <ListItem 
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
            {#if dItem.isDirectory}
                <ListItem
                    on:click={async() => {
                        await goToDirectory(dItem.completePath);
                    }} 
                    title={dItem.name}>
                    <i slot="media" class="f7-icons">folder</i>
                </ListItem>
            {/if}
        {/each}
    </List>

    <div>{path.win32.join(currentDrive, currentDirectory)}</div>

    {#if selectDirectory}
        <Link
            on:click={() => {
                selectCallback({
                    selectedPath: path.win32.join(currentDrive, currentDirectory)
                });
                f7router.back();
            }}
        >Select Directory</Link>
    {/if}
</Page>
