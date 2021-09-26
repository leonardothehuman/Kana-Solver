<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, Navbar, List, Button, ListItem, f7} from "framework7-svelte";
    import { UtauZipInfo, extractUtau } from "../../minilibs/zipHandler";
    import RadioManager from "../../minilibs/radioManager";
    import {onMount} from "svelte";
    import PathSelectField from "../components/pathSelectField.svelte";
    import path from "path";
    import fsp from "fs/promises";
    import fs from "fs";
    import type { Router } from "framework7/types";

    export let fileToExtract: string;
    export let zipProperties: UtauZipInfo;
    export let f7router: Router.Router;

    let radiomanager: RadioManager = new RadioManager();

    // console.log(fileToExtract);
    // console.log(zipProperties);

    let destinationOption = "";
    let sourceOption = "";
    //Boilerplate to manage radio
    radiomanager.addPopulatable("install-location", (v: string) => {
        destinationOption = v
    });
    onMount(() => {
        radiomanager.populateRadio("install-location", destinationOption);
    });
    $: radiomanager.populateRadio("install-location", destinationOption);
    //--------
    radiomanager.addPopulatable("install-from", (v: string) => {
        sourceOption = v;
    })
    onMount(() => {
        radiomanager.populateRadio("install-from", sourceOption);
        if(canInstallUtau == false){
            f7.dialog.alert("This is not an UTAU archive, you can only extract this archive ...", 'Warning');
        }
    });
    $: radiomanager.populateRadio("install-from", sourceOption);
    //Boilerplate end

    let canInstallUtau: boolean = true;
    if(zipProperties.installTxt === null || zipProperties.installTxt.type != "voiceset"){
        canInstallUtau = false;
    }
    if(canInstallUtau == true){
        destinationOption = "users";
    }else{
        destinationOption = "other";
    }

    let canInstallFromCustom: boolean = true;
    if(zipProperties.sourceOnZip.trim() == ""){
        canInstallFromCustom = false;
    }
    if(canInstallFromCustom == true){
        sourceOption = "custom";
    }else{
        sourceOption = "root";
    }

    let canInstallFromRoot: boolean = true;
    $:{
        canInstallFromRoot = true;
        if(destinationOption !=  "other"){
            canInstallFromRoot = false;
            sourceOption = "custom"
        }
        if(canInstallFromCustom == false){
            canInstallFromRoot = true;
            sourceOption = "root";
        }
    }
    
    let extractionDirectory = "";

    function f7ConfirmPromisse(text: string, title: string): Promise<boolean>{
        return new Promise((resolve, reject) => {
            f7.dialog.confirm(text, title, 
                () => {resolve(true)},
                () => {resolve(false)}
            );
        });
    }

    function isCompleteWinPath(_path: string): boolean{
        if(path.win32.isAbsolute(_path)){
            let driveSplit: string[] = [];
            driveSplit = _path.split(":");
            if(
                driveSplit.length != 2 ||
                driveSplit[0].length != 1
            ){
                return false;
            }
            return true;
        }else{
            return false;
        }
    }

    async function existAndIsFile(_path: string): Promise<boolean>{
        try {
            await fsp.access(
                _path,
                fs.constants.F_OK
            );
        } catch (error) {
            return false;
        }
        let destStat = await fsp.stat(_path);
        if(!destStat.isFile()){
            return false;
        }
        return true;
    }

    async function existAndIsDirectory(_path: string): Promise<boolean>{
        try {
            await fsp.access(
                _path,
                fs.constants.F_OK
            );
        } catch (error) {
            return false;
        }
        let destStat = await fsp.stat(_path);
        if(!destStat.isDirectory()){
            return false;
        }
        return true;
    }

    async function installUtau(){
        let destDir = extractionDirectory;
        if(destinationOption == "users"){
            destDir = path.join(process.env.APPDATA, "UTAU\\voice")
        }
        if(destinationOption == "utau"){
            destDir = path.join(localStorage.getItem("UTAUInstallationDirectory"), "voice");
        }
        // console.log("zipFile: ", fileToExtract);
        // console.log("installDir: ", destDir);
        // console.log("sourceZipDirectory: ", sourceOption == "custom" ? zipProperties.sourceOnZip : "");
        // console.log("destinationOnInstallDir: ", sourceOption == "custom" ? zipProperties.relativeDestination : "");
        let destinationOnInstallDir = sourceOption == "custom" ? zipProperties.relativeDestination : "";
        if(destinationOption != "other") destinationOnInstallDir = zipProperties.relativeDestination;

        if(destinationOption == "utau"){
            try {
                if(!isCompleteWinPath(localStorage.getItem("UTAUInstallationDirectory"))){
                    f7.dialog.alert("The configured utau directory is not valid", "Error");
                    return;
                }
                if(!await existAndIsFile(path.join(localStorage.getItem("UTAUInstallationDirectory"), "utau.exe"))){
                    f7.dialog.alert("UTAU was not found on the configured directory", "Error");
                    return;
                }
            } catch (error) {
                f7.dialog.alert(error.message, 'Error');
                return;
            }
        }

        if(destinationOption == "other"){
            try {
                if(!isCompleteWinPath(destDir)){
                    f7.dialog.alert("The selected destination is invalid", "Error");
                    return;
                }
                if(!await existAndIsDirectory(destDir)){
                    f7.dialog.alert("The selected destination is not a directory or does not exists", "Error");
                    return;
                }
                const dir = await fsp.readdir(destDir, {withFileTypes: true});
                if(dir.length != 0){
                    let sure = await f7ConfirmPromisse("The destination directory is not empty, are you sure you want to extract here ?", "Warning");
                    if(!sure) return;
                }
            } catch (error) {
                f7.dialog.alert(error.message, 'Error');
                return;
            }
        }

        if(destinationOption != "other"){
            try {
                if(await existAndIsFile(path.join(destDir, destinationOnInstallDir))){
                    f7.dialog.alert("Destination exists and is a file, it must be deleted manually", "Error");
                    return;
                }
                if(await existAndIsDirectory(path.join(destDir, destinationOnInstallDir))){
                    if(!await f7ConfirmPromisse("The destination directory already exists, are you sure you want to re-extract ? any existing files will be overwritten ...", "Warning")){
                        return;
                    }
                }
            } catch (error) {
                f7.dialog.alert(error.message, 'Error');
                return;
            }
        }
        
        try {
            var dialog = f7.dialog.progress("Extracting archive ...", 0);
            dialog.setText('Extracting files');
            await extractUtau(
                fileToExtract, destDir, 
                sourceOption == "custom" ? zipProperties.sourceOnZip : "",
                destinationOnInstallDir,
                (pr) => {
                    dialog.setProgress((pr.currentEntry - 1) * 100 / pr.totalEntries);
                    dialog.setText("Extracting entry "+pr.currentEntry+" of "+pr.totalEntries+".");
                },
                destinationOption == "other"
            );
            dialog.close();
            f7router.back();
        } catch (error) {
            dialog.close();
            f7.dialog.alert(error.message, 'Error');
        }
    }
</script>
<style lang="less">
    @import "../less/globalMixins.less";

    .content-container{
        .m-container();
        :global(input[disabled] ~ div.item-inner){
            color: var(--f7-list-item-after-text-color);
        }
    }
</style>
<Page>
    <Navbar title="Install UTAU" backLink />
    <div class="content-container">
        <div>{destinationOption}</div>
        <div>Destination directory:</div>
        <List>
            <ListItem
                radio
                radioIcon="start"
                title="Users Directory"
                value="users"
                name="install-location"
                disabled={!canInstallUtau}
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <ListItem
                radio
                radioIcon="start"
                title="UTAU Directory (may require administrator privileges)"
                value="utau"
                name="install-location"
                disabled={!canInstallUtau}
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <ListItem
                radio
                radioIcon="start"
                title="Other directory"
                value="other"
                name="install-location"
                on:change={() => {radiomanager.populateVariable("install-location")}}
            ></ListItem>
            <PathSelectField
                label="Extract to:"
                disabled={destinationOption != "other"}
                bind:selectedPath={extractionDirectory}
                selectDirectory={true}></PathSelectField>
        </List>

        <div>Extract from:</div>
        <div>{sourceOption}</div>
        <List>
            <ListItem
                radio
                radioIcon="start"
                title="ZIP root"
                value="root"
                name="install-from"
                disabled={!canInstallFromRoot}
                on:change={() => {radiomanager.populateVariable("install-from")}}
            ></ListItem>
            {#if zipProperties.sourceOnZip.trim() != ""}
                <ListItem
                    radio
                    radioIcon="start"
                    title={zipProperties.sourceOnZip}
                    value="custom"
                    name="install-from"
                    disabled={!canInstallFromCustom}
                    on:change={() => {radiomanager.populateVariable("install-from")}}
                ></ListItem>
            {/if}
        </List>
        <Button on:click={installUtau} fill small>Install</Button>
    </div>
</Page>