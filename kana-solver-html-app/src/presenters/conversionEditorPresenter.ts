//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type { objectRepresentation } from "../handlers/IFileSystemHandler";
import { ConversionFile } from "../minilibs/parsers/conversion_file";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type IStore from "../minilibs/IStore";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import AsyncStoreInterceptor, { loaderCallbackReturnObject } from "../minilibs/AsyncStoreInterceptor";
import type { unsubscriber } from "../minilibs/IReadOnlyStore";

export type conversionFileRepresentation = objectRepresentation & {
    nameWithoutExtension: string;
    isNew: boolean,
    isBuiltIn: boolean
}

export interface IConversionEditorModel{
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
}

export interface IConversionEditorView{
    setInstalledConversionFiles: (icf: conversionFileRepresentation[], onlyOnChange: boolean) => boolean;
    registerLeaveConfirmationCallback: (f: () => Promise<boolean>) => void;
    registerCloseConfirmationCallback: (f: () => Promise<boolean>) => void;
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
    askConfirmationYN: (text: string, title: string) => Promise<boolean>;
    scrollTo: (x: number, y: number) => void;
    prompt: (title: string, text: string, defaultValue: string) => Promise<{
        text: string,
        ok: boolean
    }>;
}

export class ConversionEditorPresenter{
    //Initialization
    public readonly view: IConversionEditorView;
    public readonly model: IConversionEditorModel;

    private _installedConversionFiles: conversionFileRepresentation[];
    private get installedConversionFiles(): conversionFileRepresentation[] {
        return this._installedConversionFiles;
    }
    private set installedConversionFiles(value: conversionFileRepresentation[]) {
        this._installedConversionFiles = value;
        this.view.setInstalledConversionFiles(value, true);
    }

    //This should be modified only trough selectedConversionFileIndex
    private _currentConversionFile: IStore<ConversionFile | null>;
    public get currentConversionFile(): IReadOnlyStore<ConversionFile | null> {
        return this._currentConversionFile;
    }
    //I dont want to use type casting ...
    private getCurrentConversionFileRW(): IStore<ConversionFile | null> {
        return this._currentConversionFile;
    }
    private setCurrentConversionFile(value: IStore<ConversionFile | null>) {
        this._currentConversionFile = value;
    }

    private readonly _canSaveCurrentFile: IStore<boolean>;
    public get canSaveCurrentFile(): IReadOnlyStore<boolean> {
        return this._canSaveCurrentFile;
    }

    private readonly _canDeleteCurrentFile: IStore<boolean>;
    public get canDeleteCurrentFile(): IReadOnlyStore<boolean> {
        return this._canDeleteCurrentFile;
    }
    private getCanDeleteCurrentFileRW(): IStore<boolean> {
        return this._canDeleteCurrentFile;
    }
    
    private _selectedConversionFileIndex: AsyncStoreInterceptor<number>;
    public get selectedConversionFileIndex(): AsyncStoreInterceptor<number> {
        return this._selectedConversionFileIndex;
    }
    public set selectedConversionFileIndex(value: AsyncStoreInterceptor<number>) {
        this._selectedConversionFileIndex = value;
    }

    private checkIfCurentFileCanBeSaved: () => void;
    private _checkIfCurentFileCanBeSaved(){
        if(this.currentConversionFile.get().wasModified.get() == true){
            this._canSaveCurrentFile.set(true);
        }else{
            this._canSaveCurrentFile.set(false);
        }
    }

    constructor(view: IConversionEditorView, model: IConversionEditorModel){
        this.view = view;
        this.model = model;
        this._canSaveCurrentFile = new Store(false);
        this._canDeleteCurrentFile = new Store(false);
        this.setCurrentConversionFile(new Store(null));
        this.installedConversionFiles = [];
        this.checkIfCurentFileCanBeSaved = this._checkIfCurentFileCanBeSaved.bind(this);
        this.selectedConversionFileIndex = new AsyncStoreInterceptor(0, false, async(ov, nv) => {
            //await this.view.closeFileList();
            let toReturn = await this.loadConversionFileFromIndex(nv, true);
            if(toReturn.valid == true) this.view.scrollTo(0, 0);
            return toReturn;
        });
        this.selectedConversionFileIndex.subscribeWithoutRun((nv) => {
            this.getCanDeleteCurrentFileRW().set(!this.installedConversionFiles[nv].isBuiltIn);
        });
        let wasModifiedUnsubscriber: unsubscriber = function(){};
        this.getCurrentConversionFileRW().subscribe((v) => {
            wasModifiedUnsubscriber();
            if(v == null) return;
            wasModifiedUnsubscriber = v.wasModified.subscribe(this.checkIfCurentFileCanBeSaved);
        });
        this.view.registerLeaveConfirmationCallback(async() => {
            if(this.currentConversionFile.get().wasModified.get() == true){
                return await this.view.askConfirmationYN(
                    "Are you sure you want to leave this page ? , all your current changes will be lost forever ...",
                    "Confirmation"
                );
            }
            return true;
        });
        this.view.registerCloseConfirmationCallback(async() => {
            if(this.currentConversionFile.get().wasModified.get() == true){
                return await this.view.askConfirmationYN(
                    "Are you sure you want to leave Kana Solver v3 ? , all your current changes will be lost forever ...",
                    "Confirmation"
                );
            }
            return true;
        });
    }
    public async init(): Promise<boolean>{
        let sp = await this.view.showSpinner("Loading ...");
        try {
            await this.loadAvailableFiles();
            await this.readConversionFileFromIndex(
                this.selectedConversionFileIndex.get()
            );
            sp.close();
        } catch (error) {
            sp.close();
            await this.view.emitAlert(error.message, "Error ...");
        }
        return true;
    }

    //Don't execute this function outside where it is meant to run ...
    private async loadConversionFileFromIndex(value: number, confirmDiscard: boolean): Promise<loaderCallbackReturnObject<number>> {
        if(confirmDiscard == true && this.currentConversionFile.get().wasModified.get() == true){
            let confirmation = false;
            if(this.installedConversionFiles[value].isNew == true){
                confirmation = await this.view.askConfirmationYN("Are you sure you want to create a new file ? , all your current changes will be lost forever ...", "Confirmation");
            }else{
                confirmation = await this.view.askConfirmationYN("Are you sure you want to open another file ?, all your current changes will be lost forever ...", "Confirmation");
            }
            if(confirmation != true){
                return {
                    valid: false,
                    newValue: value
                };
            }
        }
        let sp = await this.view.showSpinner("Loading ...");
        try {
            await this.readConversionFileFromIndex(value);
            sp.close();
            return {
                valid: true,
                newValue: value
            };
        } catch (error) {
            sp.close();
            await this.view.emitAlert(error.message, "Error ...");
            return {
                valid: false,
                newValue: 0
            };
            //return await this.loadConversionFileFromIndex(0, false);
        }
    }

    private async readConversionFileFromIndex(value: number) {
        let f = this.installedConversionFiles[value];
        //console.log("load again");
        //if(this.getCurrentConversionFile().get() != null) this.getCurrentConversionFile().get().destruct();
        if(f.isNew){
            this.getCurrentConversionFileRW().set(new ConversionFile(null));
        }else{
            let fileContent = await this.model.fsh.readTextFile(f.completePath, 'utf8');
            this.getCurrentConversionFileRW().set(new ConversionFile(fileContent));
        }
    }

    public async loadAvailableFiles(){
        this.installedConversionFiles = [{
            completePath: "",
            name: "New File",
            nameWithoutExtension: "New File",
            isDirectory: false,
            isFile: true,
            isBuiltIn: true,
            isNew: true
        }];
        let builtInConversionFiles: objectRepresentation[] =
            await this.model.fsh.getAllFilesOnDirectory(
                this.model.psh.joinPath(
                    this.model.psh.goToParentDirectory(process.execPath),
                    "package.nw\\presets"
                )
            );

        let userConversionFiles: objectRepresentation[] =
            await this.model.fsh.getAllFilesOnDirectory(
                this.model.psh.joinPath(
                    this.model.fsh.homeDirectory(),
                    "kanasolver_files\\conversion_files"
                )
            );

        for(var i = 0; i < builtInConversionFiles.length; i++){
            if(this.model.psh.extractExtention(builtInConversionFiles[i].name) != '.json') continue;
            if(await this.model.fsh.existAndIsDirectory(builtInConversionFiles[i].completePath)) continue;
            this.installedConversionFiles = [...this.installedConversionFiles, {
                completePath: builtInConversionFiles[i].completePath,
                name: builtInConversionFiles[i].name,
                nameWithoutExtension: this.model.psh.extractName(builtInConversionFiles[i].name),
                isDirectory: builtInConversionFiles[i].isDirectory,
                isFile: builtInConversionFiles[i].isFile,
                isBuiltIn: true,
                isNew: false
            }];
        }
        for(var i = 0; i < userConversionFiles.length; i++){
            if(this.model.psh.extractExtention(userConversionFiles[i].name) != '.json') continue;
            if(await this.model.fsh.existAndIsDirectory(userConversionFiles[i].completePath)) continue;
            this.installedConversionFiles = [...this.installedConversionFiles, {
                completePath: userConversionFiles[i].completePath,
                name: userConversionFiles[i].name,
                nameWithoutExtension: this.model.psh.extractName(userConversionFiles[i].name),
                isDirectory: userConversionFiles[i].isDirectory,
                isFile: userConversionFiles[i].isFile,
                isBuiltIn: false,
                isNew: false
            }];
        }
    }

    public openUserDirectory(){
        let directory = this.model.psh.joinPath(
            this.model.fsh.homeDirectory(),
            "kanasolver_files\\conversion_files"
        );
        this.model.fsh.openOnFileExplorer(directory);
    }

    public async saveCurrentFile(){
        if(this.canSaveCurrentFile.get() == false){
            return;
        }
        if(this.installedConversionFiles[this.selectedConversionFileIndex.get()].isBuiltIn){
            await this.saveCurrentFileAs();
            return;
        }
        let sp = await this.view.showSpinner("Loading ...");
        try {
            if(this.currentConversionFile.get() != null){
                await this.currentConversionFile.get().save(
                    this.installedConversionFiles[this.selectedConversionFileIndex.get()].completePath,
                    this.model.fsh,
                    false
                )
            }
            sp.close();
        } catch (error) {
            sp.close();
            await this.view.emitAlert(error.message, "Error ...");
        }
    }

    public async saveCurrentFileAs(){
        var toSave = '';
        var readyToSave = false;
        var sp = null;
        var typedName = '';
        while(readyToSave == false){
            var name = await this.view.prompt("Save As...", "Type a name for the new preset", "");
            if(name.ok == false) return;
            typedName = name.text.trim();
            if(typedName == ''){
                await this.view.emitAlert("You must specify a name to save", "Alert ...");
            }else if(this.model.psh.hasWin32ForbiddenChars(typedName)){
                await this.view.emitAlert('The file name must not contain one of the following characters: "\\/:*?\"<>|"', "Alert ...");
            }else{
                toSave = this.model.psh.joinPath(
                    this.model.fsh.homeDirectory(),
                    "kanasolver_files\\conversion_files",
                    typedName + ".json"
                );
                sp = await this.view.showSpinner("Loading ...");
                if(await this.model.fsh.exist(toSave)){
                    sp.close();
                    let canOverwrite = await this.view.askConfirmationYN(`The file ${typedName} already exists, do you want to overwrite it ?`,"Confirmation");
                    if(canOverwrite == true){
                        readyToSave = true;
                        sp = await this.view.showSpinner("Loading ...");
                    }
                }else{
                    readyToSave = true;
                }
            }
        }

        //let sp = await this.view.showSpinner("Loading ...");
        try {
            if(this.currentConversionFile.get() != null){
                await this.currentConversionFile.get().save(
                    toSave,
                    this.model.fsh,
                    false
                )
            }
            await this.loadAvailableFiles();
            let newIndex: number = 0;
            for(let i = 0; i < this.installedConversionFiles.length; i++){
                let cf = this.installedConversionFiles[i];
                if(cf.isBuiltIn == true) continue;
                if(cf.nameWithoutExtension == typedName){
                    newIndex = i;
                    break;
                }
            }
            this.selectedConversionFileIndex.setWithoutExecuteLoader(newIndex);
            sp.close();
        } catch (error) {
            sp.close();
            await this.view.emitAlert(error.message, "Error ...");
        }
    }

    public async deleteCurrentFile(){
        if(this.canDeleteCurrentFile.get() == false) return;
        let confirmation = await this.view.askConfirmationYN(
            "Are you sure you want to delete the current file ? , all your current changes will be lost forever ...", "Confirmation"
        );
        
        if(confirmation == true){
            let sp = await this.view.showSpinner("Loading ...");
            try {
                this.model.fsh.deleteFile(
                    this.installedConversionFiles[this.selectedConversionFileIndex.get()].completePath
                );
                await this.loadAvailableFiles();
                this.selectedConversionFileIndex.setWithoutExecuteLoader(0);
                await this.readConversionFileFromIndex(0);
                sp.close();
            } catch (error) {
                sp.close();
                await this.view.emitAlert(error.message, "Error ...");
            }
        }
    }

    public async createNewFile(){
        this.selectedConversionFileIndex.set(0);
    }

    public deleteUnit(i: number){
        let cd = this.getCurrentConversionFileRW().get().deleteConversionunit(i);
    }
    public addEmptyUnit(){
        this.getCurrentConversionFileRW().get().addEmptyConversionUnit();
    }
}