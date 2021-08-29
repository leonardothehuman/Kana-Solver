<script lang="ts">
    const fs = require("fs/promises");
    const nodeDiskInfo = require('node-disk-info');
    const path = require("path");
    import {Navbar, Page, List, ListItem, Link, Input} from 'framework7-svelte';
    export let selectCallback: (e: any) => void = function(){};
    export let f7router: { back: () => void; };
    let driveList: ArrayLike<any> = [];
    let selectedDrive = 'C:';

    (async()=>{
        try {
            driveList = await nodeDiskInfo.getDiskInfo();
        } catch (err) {
            console.error(err);
        }
    })();

    let currentDirectory = '';
    $: currentDirectory = selectedDrive+'\\';
    let currentDirectoryList: Array<any> = [];

    async function setCurrentDirectory(cdir: string){
        try {
            const dir = await fs.readdir(cdir, {withFileTypes: true});
            currentDirectoryList = [];
            if(cdir != selectedDrive+'\\'){
                currentDirectoryList.push({
                    name: "..",
                    isDirectory: true,
                    isFile: false
                });
            }
            for(let i = 0; i < dir.length; i++){
                currentDirectoryList.push({
                    name: dir[i].name,
                    isDirectory: dir[i].isDirectory(),
                    isFile: dir[i].isFile()
                });
            }
            currentDirectoryList = [...currentDirectoryList];
            console.log(dir);
        } catch (err) {
            console.error(err);
        }
    }

    $: setCurrentDirectory(currentDirectory);

    function goToDirectory(dir: string){
        currentDirectory = path.normalize(path.join(currentDirectory, dir));
    }
</script>

<Page>
    <Navbar title="Select directory" backLink />
    <Input
        label="Disk drive"
        type="select"
        bind:value={selectedDrive}
        placeholder="Select a drive"
    >
        {#each driveList as drive}
            <option value={drive.mounted}>{drive.mounted}</option>
        {/each}
    </Input>
    
    <List>
        {#each currentDirectoryList as dItem}
            {#if dItem.isFile}
                <ListItem on:click={() => {
                    selectCallback({
                        directory: path.normalize(path.join(currentDirectory, dItem.name))
                    });
                    f7router.back();
                }} title={dItem.name}></ListItem>
            {/if}
            {#if dItem.isDirectory}
                <ListItem on:click={() => {goToDirectory(dItem.name)}} title={dItem.name}></ListItem>
            {/if}
        {/each}
    </List>

    <div>{currentDirectory}</div>

    <Link
        on:click={() => {
            selectCallback({
                directory: currentDirectory
            });
            f7router.back();
        }}
    >Back</Link>
</Page>
