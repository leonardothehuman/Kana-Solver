//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type { objectRepresentation } from "../handlers/IFileSystemHandler";
import type { ConversionFile } from "../minilibs/parsers/conversion_file";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type IStore from "../minilibs/IStore";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import type { unsubscriber } from "../minilibs/IReadOnlyStore";
import type { ConversionItem, fileDeletedEventArgs, fileSavedAsEventArgs, newFileEventArgs } from "./conversionFileSelectorPresenter";
import AsyncEvent from "../minilibs/AsyncEvent";

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

    //This should be modified only trough selectedConversionFileIndex
    private _currentConversionFile: IStore<ConversionFile | null>;
    public get currentConversionFile(): IReadOnlyStore<ConversionFile | null> {
        return this._currentConversionFile;
    }
    //I dont want to use type casting ...
    private getCurrentConversionFileStore(): IStore<ConversionFile | null> {
        return this._currentConversionFile;
    }
    private wasModifiedUnsubscriber: unsubscriber = function(){};
    private setCurrentConversionFileStore(value: IStore<ConversionFile | null>) {
        this._currentConversionFile = value;
        value.subscribeWithoutRun((nv) => {
            if(this.currentConversionFileRepresentation == null) return;
            this.getCanDeleteCurrentFileRW().set(!this.currentConversionFileRepresentation.isBuiltIn);
        });
        
        value.subscribe((v) => {
            this.wasModifiedUnsubscriber();
            if(v == null) return;
            this.wasModifiedUnsubscriber = v.wasModified.subscribe(this.checkIfCurentFileCanBeSaved);
        });
    }
    private currentConversionFileRepresentation: conversionFileRepresentation;
    public setCurrentConversionItem(value: ConversionItem | null) {
        if(value == null){
            this.currentConversionFileRepresentation = null;
            this.getCurrentConversionFileStore().set(null);
            return;
        }
        this.currentConversionFileRepresentation = value.conversionFileRepresentation;
        this.getCurrentConversionFileStore().set(value.conversionFile);
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

    private checkIfCurentFileCanBeSaved: () => void;
    private _checkIfCurentFileCanBeSaved(){
        if(this.currentConversionFile.get().wasModified.get() == true){
            this._canSaveCurrentFile.set(true);
        }else{
            this._canSaveCurrentFile.set(false);
        }
    }

    public fileSavedAs: AsyncEvent<ConversionEditorPresenter, fileSavedAsEventArgs>;
    public fileDeleted: AsyncEvent<ConversionEditorPresenter, fileDeletedEventArgs>;
    public fileCreated: AsyncEvent<ConversionEditorPresenter, newFileEventArgs>;

    constructor(view: IConversionEditorView, model: IConversionEditorModel){
        this.checkIfCurentFileCanBeSaved = this._checkIfCurentFileCanBeSaved.bind(this);
        this.view = view;
        this.model = model;
        this.fileSavedAs = new AsyncEvent(this);
        this.fileDeleted = new AsyncEvent(this);
        this.fileCreated = new AsyncEvent(this);
        this._canSaveCurrentFile = new Store(false);
        this._canDeleteCurrentFile = new Store(false);
        this.setCurrentConversionFileStore(new Store(null));

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
        return true;
    }

    public openUserDirectory(){
        let directory = this.model.psh.joinPath(
            this.model.fsh.homeDirectory(),
            "kanasolver_files\\conversion_files" //TODO: Centralize directories
        );
        this.model.fsh.openOnFileExplorer(directory);
    }

    public async saveCurrentFile(){
        if(this.canSaveCurrentFile.get() == false){
            return;
        }
        if(this.currentConversionFileRepresentation.isBuiltIn){
            await this.saveCurrentFileAs();
            return;
        }
        let sp = await this.view.showSpinner("Loading ...");
        try {
            if(this.currentConversionFile.get() != null){
                await this.currentConversionFile.get().save(
                    this.currentConversionFileRepresentation.completePath,
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

            await this.fileSavedAs.trigger({
                nameWithoutExtension: typedName
            });
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
                    this.currentConversionFileRepresentation.completePath
                );
                await this.fileDeleted.trigger({});
                sp.close();
            } catch (error) {
                sp.close();
                await this.view.emitAlert(error.message, "Error ...");
            }
        }
    }

    public async createNewFile(){
        await this.fileCreated.trigger({});
    }

    public deleteUnit(i: number){
        let cd = this.getCurrentConversionFileStore().get().deleteConversionunit(i);
    }
    public addEmptyUnit(){
        this.getCurrentConversionFileStore().get().addEmptyConversionUnit();
    }
}