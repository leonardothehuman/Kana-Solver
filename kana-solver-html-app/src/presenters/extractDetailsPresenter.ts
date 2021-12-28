//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type ISettingsHandler from "../handlers/ISettingsHandler";
import type { UtauZipInfo } from "../handlers/IZipHandler";
import type IZipHandler from "../handlers/IZipHandler";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type IStore from "../minilibs/IStore";
import Store from "../minilibs/Store";
import type IProgressProcess from "./commonInterfaces/IProgressProcess";

export interface IExtractDetailsModel{
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
    readonly zh: IZipHandler;
    readonly sth: ISettingsHandler;
}

export interface IExtractDetailsView{
    emitAlert: (text: string, title: string) => Promise<void>;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
    createProgressProcess: (title: string, initialProgress: number) => IProgressProcess;
    informExtractionSuccess: () => void;
}

export type UtauDestinationType = "users"|"utau"|"other";
export type UtauSourceType = "custom"|"root";

export class ExtractDetailsPresenter{
    //Initialization
    private _view: IExtractDetailsView;
    private _model: IExtractDetailsModel;
    private _zipProperties: UtauZipInfo;
    private _fileToExtract: string;

    private _destinationType: Store<UtauDestinationType>;
    public get destinationType(): IStore<UtauDestinationType> {
        return this._destinationType;
    }
    private _sourceType: Store<UtauSourceType>;
    public get sourceType(): IStore<UtauSourceType> {
        return this._sourceType;
    }
    private _canInstallUtau: Store<boolean>;
    public get canInstallUtau(): IStore<boolean> {
        return this._canInstallUtau;
    }
    private _extractionDirectory: Store<string>;
    public get extractionDirectory(): IStore<string> {
        return this._extractionDirectory;
    }
    private _canInstallFromRoot: Store<boolean>;
    public get canInstallFromRoot(): IStore<boolean> {
        return this._canInstallFromRoot;
    }
    private _canInstallFromCustom: Store<boolean>;
    public get canInstallFromCustom(): Store<boolean> {
        return this._canInstallFromCustom;
    }
    
    constructor(view: IExtractDetailsView, model: IExtractDetailsModel, zipProperties: UtauZipInfo, fileToExtract: string){
        this._view = view;
        this._model = model;
        this._zipProperties = zipProperties;
        this._fileToExtract = fileToExtract;
        //------------------------------------
        this._canInstallUtau = new Store(true);
        this._destinationType = new Store("users");
        this._sourceType = new Store("custom");
        this._canInstallFromRoot = new Store(true);
        this._extractionDirectory = new Store("");
        this._canInstallFromCustom = new Store(true);
        if(this.zipProperties.installTxt === null || this.zipProperties.installTxt.type != "voiceset"){
            this.canInstallUtau.set(false);
        }
        if(this.canInstallUtau.get() == true){
            this._destinationType.set("users");
        }else{
            this._destinationType.set("other");
        }

        
        if(this.zipProperties.sourceOnZip.trim() == ""){
            this._canInstallFromCustom.set(false);
        }
        if(this.canInstallFromCustom.get() == true){
            this._sourceType.set("custom");
        }else{
            this._sourceType.set("root");
        }

        this._canInstallFromCustom.subscribeWithoutRun(() => {
            this.updateInstallSourceLimitations();
        });

        //The code must run at initialization
        this._destinationType.subscribe(() => {
            this.updateInstallSourceLimitations();
        });
    }

    public emitMountAlerts(){
        if(this.canInstallUtau.get() == false){
            this.view.emitAlert("This is not an UTAU archive, you can only extract this archive ...", 'Warning');
        }
    }

    private updateInstallSourceLimitations(){
        this.canInstallFromRoot.set(true);
        if(this.destinationType.get() !=  "other"){
            this.canInstallFromRoot.set(false);
            this._sourceType.set("custom");
        }
        if(this.canInstallFromCustom.get() == false){
            this.canInstallFromRoot.set(true);
            this._sourceType.set("root");
        }
    }

    //Getters and setters
    public get view(): IExtractDetailsView {
        return this._view;
    }
    public get model(): IExtractDetailsModel {
        return this._model;
    }
    private get zipProperties(): UtauZipInfo {
        return this._zipProperties;
    }
    private get fileToExtract(): string {
        return this._fileToExtract;
    }
    private set fileToExtract(value: string) {
        this._fileToExtract = value;
    }

    public async installUtau(){
        let destDir = this.extractionDirectory.get();
        if(this.destinationType.get() == "users"){
            destDir = this.model.psh.joinPath(process.env.APPDATA, "UTAU\\voice")
        }
        if(this.destinationType.get() == "utau"){
            destDir = this.model.psh.joinPath(this.model.sth.UTAUInstallationDirectory.get(), "voice");
        }
        
        let destinationOnInstallDir = this.sourceType.get() == "custom" ? this.zipProperties.relativeDestination : "";
        if(this.destinationType.get() != "other") destinationOnInstallDir = this.zipProperties.relativeDestination;

        if(this.destinationType.get() == "utau"){
            try {
                if(!this.model.psh.isCompleteWinPath(this.model.sth.UTAUInstallationDirectory.get())){
                    this.view.emitAlert("The configured utau installation directory is not valid", "Error");
                    return;
                }
                if(!await this.model.fsh.existAndIsFile(this.model.psh.joinPath(this.model.sth.UTAUInstallationDirectory.get(), "utau.exe"))){
                    this.view.emitAlert("UTAU was not found on the configured directory", "Error");
                    return;
                }
            } catch (error) {
                this.view.emitAlert(error.message, 'Error');
                return;
            }
        }

        if(this.destinationType.get() == "other"){
            try {
                if(!this.model.psh.isCompleteWinPath(destDir)){
                    this.view.emitAlert("The selected destination is invalid", "Error");
                    return;
                }
                if(!await this.model.fsh.existAndIsDirectory(destDir)){
                    this.view.emitAlert("The selected destination is not a directory or does not exists", "Error");
                    return;
                }
                //const dir = await fsp.readdir(destDir, {withFileTypes: true});
                if(!await this.model.fsh.isDirectoryEmpty(destDir)){
                    let sure = await this.view.askConfirmation("The destination directory is not empty, are you sure you want to extract here ?", "Warning");
                    if(!sure) return;
                }
            } catch (error) {
                this.view.emitAlert(error.message, 'Error');
                return;
            }
        }

        if(this.destinationType.get() != "other"){
            try {
                if(await this.model.fsh.existAndIsFile(this.model.psh.joinPath(destDir, destinationOnInstallDir))){
                    this.view.emitAlert("Destination exists and is a file, it must be deleted manually", "Error");
                    return;
                }
                if(await this.model.fsh.existAndIsDirectory(this.model.psh.joinPath(destDir, destinationOnInstallDir))){
                    if(!await this.view.askConfirmation("The destination directory already exists, are you sure you want to re-extract ? any existing files will be overwritten ...", "Warning")){
                        return;
                    }
                }
            } catch (error) {
                this.view.emitAlert(error.message, 'Error');
                return;
            }
        }
        
        try {
            var dialog = this.view.createProgressProcess("Extracting archive ...", 0);
            dialog.setText('Extracting files');
            await this.model.zh.extractUtau(
                this.fileToExtract, destDir, 
                this.sourceType.get() == "custom" ? this.zipProperties.sourceOnZip : "",
                destinationOnInstallDir,
                (pr) => {
                    dialog.setProgress((pr.currentEntry - 1) * 100 / pr.totalEntries);
                    dialog.setText("Extracting entry "+pr.currentEntry+" of "+pr.totalEntries+".");
                },
                this.destinationType.get() == "other"
            );
            dialog.close();
            this.view.informExtractionSuccess();
        } catch (error) {
            dialog.close();
            this.view.emitAlert(error.message, 'Error');
        }
    }
}