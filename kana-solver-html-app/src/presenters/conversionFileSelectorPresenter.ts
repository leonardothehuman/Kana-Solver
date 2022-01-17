//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import AsyncStoreInterceptor, { loaderCallbackReturnObject } from "../minilibs/AsyncStoreInterceptor";
import type { conversionFileRepresentation } from "./conversionEditorPresenter";
import type { objectRepresentation } from "../handlers/IFileSystemHandler";
import type IStore from "../minilibs/IStore";
import { ConversionFile } from "../minilibs/parsers/conversion_file";
import SyncEvent from "../minilibs/SyncEvent";
import type IPathHandler from "../handlers/IPathHandler";

export interface IConversionFileSelectorModel{
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
    readonly ph: IPathHandler;
}

export interface IConversionFileSelectorView{
    setInstalledConversionFileRepresentations: (icf: conversionFileRepresentation[], onlyOnChange: boolean) => boolean;
    setConversionItemStore: (cis: IReadOnlyStore<ConversionItem | null>, onlyOnChange: boolean) => boolean;
    askConfirmationYN: (text: string, title: string) => Promise<boolean>;
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
}

export type selectChangeInterceptedEventArgs = {
    result: loaderCallbackReturnObject<number>
}

export type ConversionItem = {
    conversionFile: ConversionFile,
    conversionFileRepresentation: conversionFileRepresentation
}

export type fileSavedAsEventArgs = {
    nameWithoutExtension: string
}
export type fileDeletedEventArgs = {}
export type newFileEventArgs = {}

export class ConversionFileSelectorPresenter{
    //Initialization
    public readonly view: IConversionFileSelectorView;
    public readonly model: IConversionFileSelectorModel;

    private _selectedConversionFileIndex: AsyncStoreInterceptor<number>;
    public get selectedConversionFileIndex(): AsyncStoreInterceptor<number> {
        return this._selectedConversionFileIndex;
    }
    public set selectedConversionFileIndex(value: AsyncStoreInterceptor<number>) {
        this._selectedConversionFileIndex = value;
    }

    private _installedConversionFileRepresentations: conversionFileRepresentation[];
    private get installedConversionFileRepresentations(): conversionFileRepresentation[] {
        return this._installedConversionFileRepresentations;
    }
    private set installedConversionFileRepresentations(value: conversionFileRepresentation[]) {
        this._installedConversionFileRepresentations = value;
        this.view.setInstalledConversionFileRepresentations(value, true);
    }

    private _currentConversionItem: IStore<ConversionItem | null>;
    public get currentConversionItem(): IReadOnlyStore<ConversionItem | null> {
        return this._currentConversionItem;
    }
    //I dont want to use type casting ...
    private getCurrentConversionItemRW(): IStore<ConversionItem | null> {
        return this._currentConversionItem;
    }
    private setCurrentConversionItem(value: IStore<ConversionItem | null>) {
        this._currentConversionItem = value;
        this.view.setConversionItemStore(value, true);
    }

    public selectChangeIntercepted: SyncEvent<ConversionFileSelectorPresenter, selectChangeInterceptedEventArgs>;
    private listEmpty: boolean;

    constructor(listEmpty: boolean, view: IConversionFileSelectorView, model: IConversionFileSelectorModel){
        this.view = view;
        this.model = model;
        this.listEmpty = listEmpty;

        this.setCurrentConversionItem(new Store(null));
        this.installedConversionFileRepresentations = [];
        this.selectChangeIntercepted = new SyncEvent(this);

        this.selectedConversionFileIndex = new AsyncStoreInterceptor(0, false, async(ov, nv) => {
            let toReturn = await this.loadConversionFileFromIndex(nv, true);
            this.selectChangeIntercepted.trigger({
                result: toReturn
            });
            return toReturn;
        });
    }

    public async informSaveAs(e: fileSavedAsEventArgs){
        await this.loadAvailableFiles();
        let newIndex: number = 0;
        for(let i = 0; i < this.installedConversionFileRepresentations.length; i++){
            let cf = this.installedConversionFileRepresentations[i];
            if(cf.isBuiltIn == true) continue;
            if(cf.nameWithoutExtension == e.nameWithoutExtension){
                newIndex = i;
                break;
            }
        }
        this.selectedConversionFileIndex.setWithoutExecuteLoader(newIndex);
        let cf = this.currentConversionItem.get().conversionFile;
        this.getCurrentConversionItemRW().set({
            conversionFile: cf,
            conversionFileRepresentation: this.installedConversionFileRepresentations[newIndex]
        });
    }

    public async informDelete(e: fileDeletedEventArgs){
        await this.loadAvailableFiles();
        this.selectedConversionFileIndex.setWithoutExecuteLoader(0);
        await this.readConversionFileFromIndex(0);
    }

    public async informCreate(e: newFileEventArgs){
        this.selectedConversionFileIndex.set(0);
    }
    
    public async init(){
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
    }
    public async loadAvailableFiles(){
        if(this.listEmpty == true){
            this.installedConversionFileRepresentations = [{
                completePath: "",
                name: "New File",
                nameWithoutExtension: "New File",
                isDirectory: false,
                isFile: true,
                isBuiltIn: true,
                isNew: true
            }];
        }else{
            this.installedConversionFileRepresentations = [];
        }
        let builtInConversionFiles: objectRepresentation[] =
            await this.model.fsh.getAllFilesOnDirectory(
                this.model.ph.SystemConversionFilesDirectory.get()
            );

        let conversionFileDirectory: string = this.model.ph.UserConversionFilesDirectory.get();

        let userConversionFiles: objectRepresentation[] =
            await this.model.fsh.getAllFilesOnDirectory(
                conversionFileDirectory
            );

        for(var i = 0; i < builtInConversionFiles.length; i++){
            if(this.model.psh.extractExtention(builtInConversionFiles[i].name) != '.json') continue;
            if(await this.model.fsh.existAndIsDirectory(builtInConversionFiles[i].completePath)) continue;
            this.installedConversionFileRepresentations = [...this.installedConversionFileRepresentations, {
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
            this.installedConversionFileRepresentations = [...this.installedConversionFileRepresentations, {
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
    private async readConversionFileFromIndex(value: number) {
        let f = this.installedConversionFileRepresentations[value];
        if(f.isNew){
            this.getCurrentConversionItemRW().set({
                conversionFile: new ConversionFile(null),
                conversionFileRepresentation: f
            });
        }else{
            let fileContent = await this.model.fsh.readTextFile(f.completePath, 'utf8');
            this.getCurrentConversionItemRW().set({
                conversionFile: new ConversionFile(fileContent),
                conversionFileRepresentation: f
            });
        }
    }
    //Don't execute this function outside where it is meant to run ...
    private async loadConversionFileFromIndex(value: number, confirmDiscard: boolean): Promise<loaderCallbackReturnObject<number>> {
        if(confirmDiscard == true && this.currentConversionItem.get().conversionFile.wasModified.get() == true){
            let confirmation = false;
            if(this.installedConversionFileRepresentations[value].isNew == true){
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
        }
    }
}