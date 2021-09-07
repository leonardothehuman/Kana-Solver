<script lang="ts">
    import {Navbar, Page, List, ListItem, Link, Input} from 'framework7-svelte';
    import path from "path";
    import {FileFinderPresenter} from "../../presenters/fileFinderPresenter";
    import type {IFileFinderView, objectRepresentation } from "../../presenters/fileFinderPresenter";

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
    fileFinderPresenter.init(
        initialDirectory
    );
    
    let driveFirstLoad = true;
    $: {
        if(driveFirstLoad == false) fileFinderPresenter.setCurrentDrive(currentDrive, true, true);
        driveFirstLoad = false;
    }

    let extFirstLoad = true;
    $: {
        if(extFirstLoad == false) fileFinderPresenter.setCurrentExtention(selectedExtention);
        extFirstLoad = false;
    }
</script>

<Page>
    <Navbar title="Select directory" backLink />
    <Input
        label="Disk drive"
        type="select"
        bind:value={currentDrive}
        placeholder="Select a drive"
    >
        {#each selectableDriveList as drive}
            <option value={drive}>{drive}</option>
        {/each}
    </Input>
    <Input
        label="Type"
        type="select"
        bind:value={selectedExtention}
        placeholder="Type"
    >
        {#each selectableExtensionList as ext}
            <option value={ext}>{ext}</option>
        {/each}
    </Input>
    
    <List>
        {#each currentDirectoryObjectsList as dItem}
            {#if dItem.isFile}
                <ListItem on:click={() => {
                    if(selectDirectory == true) return;
                    selectCallback({
                        selectedPath: dItem.completePath
                    });
                    f7router.back();
                }} title={dItem.name}></ListItem>
            {/if}
            {#if dItem.isDirectory}
                <ListItem
                    on:click={() => {
                        fileFinderPresenter.setCurrentFullLocation(dItem.completePath);
                    }} 
                    title={dItem.name}>
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
