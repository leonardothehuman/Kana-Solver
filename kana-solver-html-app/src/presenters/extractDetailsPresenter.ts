//This file is licensed under GNU GPL v3.0 only license

import type { InstallTxt } from "../minilibs/parsers/install_txt";

export interface IExtractDetailsModel{
    isCompleteWinPath: (_path: string) => boolean;
    existAndIsFile: (_path: string) => Promise<boolean>;
    existAndIsDirectory: (_path: string) => Promise<boolean>;
    joinPath: (...p: string[]) => string;
    isDirectoryEmpty: (p: string) => Promise<boolean>;
    extractUtau: (
        zipFile: string,
        installDir: string,
        sourceZipDirectory: string,//normalized
        destinationOnInstallDir: string,//normalized
        progressCallback: ZipExtractProgressCallback,
        failIfFileExists: boolean
    ) => Promise<void>;
}

export type ZipExtractProgressInfo = {
    totalEntries: number,
    currentEntry: number,
    currentFileName: string,
    currentZipPath: string
}
export type ZipExtractProgressCallback = (pr:ZipExtractProgressInfo) => void

export interface IProgressProcess{
    setText: (text: string) => void;
    setProgress: (progress: number) => void;
    close: () => void;
}

export type UtauZipInfo = {
    installTxt: null|InstallTxt,
    sourceOnZip: string,
    relativeDestination: string
}

export interface IExtractDetailsView{
    emitAlert: (text: string, title: string) => Promise<void>;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
    createProgressProcess: (title: string, initialProgress: number) => IProgressProcess;
    informExtractionSuccess: () => void;
    setDestinationType: (value: UtauDestinationType, onlyOnChange: boolean) => boolean;
    setSourceType: (value: UtauSourceType, onlyOnChange: boolean) => boolean;
    setCanInstallUtau: (value: boolean, onlyOnChange: boolean) => boolean;
    setExtractionDirectory: (value: string, onlyOnChange: boolean) => boolean;
    setCanInstallFromRoot: (c: boolean, onlyOnChange: boolean) => boolean;
    setCanInstallFromCustom: (c: boolean, onlyOnChange: boolean) => boolean;
}

export type UtauDestinationType = "users"|"utau"|"other";
export type UtauSourceType = "custom"|"root";

export class ExtractDetailsPresenter{
    //Initialization
    private _view: IExtractDetailsView;
    private _model: IExtractDetailsModel;
    private _zipProperties: UtauZipInfo;
    private _canInstallUtau: boolean;
    private _destinationType: UtauDestinationType;
    private _canInstallFromCustom: boolean;
    private _sourceType: UtauSourceType;
    private _canInstallFromRoot: boolean;
    private _extractionDirectory: string;
    private _fileToExtract: string;
    
    constructor(view: IExtractDetailsView, model: IExtractDetailsModel, zipProperties: UtauZipInfo, fileToExtract: string){
        this._view = view;
        this._model = model;
        this._zipProperties = zipProperties;
        this._fileToExtract = fileToExtract;
        //------------------------------------
        this.canInstallUtau = true;
        if(this.zipProperties.installTxt === null || this.zipProperties.installTxt.type != "voiceset"){
            this.canInstallUtau = false;
        }
        if(this.canInstallUtau == true){
            this.destinationType = "users";
        }else{
            this.destinationType = "other";
        }

        this.canInstallFromCustom = true;
        if(this.zipProperties.sourceOnZip.trim() == ""){
            this.canInstallFromCustom = false;
        }
        if(this.canInstallFromCustom == true){
            this.sourceType = "custom";
        }else{
            this.sourceType = "root";
        }

        this.updateInstallSourceLimitations();

        this.extractionDirectory = "";
    }

    public emitMountAlerts(){
        if(this.canInstallUtau == false){
            this.view.emitAlert("This is not an UTAU archive, you can only extract this archive ...", 'Warning');
        }
    }

    private updateInstallSourceLimitations(){
        this.canInstallFromRoot = true;
        if(this.destinationType !=  "other"){
            this.canInstallFromRoot = false;
            this.sourceType = "custom"
        }
        if(this.canInstallFromCustom == false){
            this.canInstallFromRoot = true;
            this.sourceType = "root";
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
    public get canInstallUtau(): boolean {
        return this._canInstallUtau;
    }
    private set canInstallUtau(value: boolean) {
        this._canInstallUtau = value;
        this.view.setCanInstallUtau(this._canInstallUtau, true);
    }
    public get destinationType(): UtauDestinationType {
        return this._destinationType;
    }
    public set destinationType(value: UtauDestinationType) {
        this._destinationType = value;
        this.updateInstallSourceLimitations();
        this.view.setDestinationType(this._destinationType, true);
    }
    private get canInstallFromCustom(): boolean {
        return this._canInstallFromCustom;
    }
    private set canInstallFromCustom(value: boolean) {
        this._canInstallFromCustom = value;
        this.updateInstallSourceLimitations();
        this.view.setCanInstallFromCustom(this._canInstallFromCustom, true);
    }
    public get sourceType(): UtauSourceType {
        return this._sourceType;
    }
    public set sourceType(value: UtauSourceType) {
        this._sourceType = value;
        this.view.setSourceType(this._sourceType, true);
    }
    private get canInstallFromRoot(): boolean {
        return this._canInstallFromRoot;
    }
    private set canInstallFromRoot(value: boolean) {
        this._canInstallFromRoot = value;
        this.view.setCanInstallFromRoot(this._canInstallFromRoot, true);
    }
    public get extractionDirectory(): string {
        return this._extractionDirectory;
    }
    public set extractionDirectory(value: string) {
        this._extractionDirectory = value;
        this.view.setExtractionDirectory(this._extractionDirectory, true);
    }
    private get fileToExtract(): string {
        return this._fileToExtract;
    }
    private set fileToExtract(value: string) {
        this._fileToExtract = value;
    }

    public async installUtau(){
        let destDir = this.extractionDirectory;
        if(this.destinationType == "users"){
            destDir = this.model.joinPath(process.env.APPDATA, "UTAU\\voice")
        }
        if(this.destinationType == "utau"){
            destDir = this.model.joinPath(localStorage.getItem("UTAUInstallationDirectory"), "voice");
        }
        
        let destinationOnInstallDir = this.sourceType == "custom" ? this.zipProperties.relativeDestination : "";
        if(this.destinationType != "other") destinationOnInstallDir = this.zipProperties.relativeDestination;

        if(this.destinationType == "utau"){
            try {
                if(!this.model.isCompleteWinPath(localStorage.getItem("UTAUInstallationDirectory"))){
                    this.view.emitAlert("The configured utau directory is not valid", "Error");
                    return;
                }
                if(!await this.model.existAndIsFile(this.model.joinPath(localStorage.getItem("UTAUInstallationDirectory"), "utau.exe"))){
                    this.view.emitAlert("UTAU was not found on the configured directory", "Error");
                    return;
                }
            } catch (error) {
                this.view.emitAlert(error.message, 'Error');
                return;
            }
        }

        if(this.destinationType == "other"){
            try {
                if(!this.model.isCompleteWinPath(destDir)){
                    this.view.emitAlert("The selected destination is invalid", "Error");
                    return;
                }
                if(!await this.model.existAndIsDirectory(destDir)){
                    this.view.emitAlert("The selected destination is not a directory or does not exists", "Error");
                    return;
                }
                //const dir = await fsp.readdir(destDir, {withFileTypes: true});
                if(!await this.model.isDirectoryEmpty(destDir)){
                    let sure = await this.view.askConfirmation("The destination directory is not empty, are you sure you want to extract here ?", "Warning");
                    if(!sure) return;
                }
            } catch (error) {
                this.view.emitAlert(error.message, 'Error');
                return;
            }
        }

        if(this.destinationType != "other"){
            try {
                if(await this.model.existAndIsFile(this.model.joinPath(destDir, destinationOnInstallDir))){
                    this.view.emitAlert("Destination exists and is a file, it must be deleted manually", "Error");
                    return;
                }
                if(await this.model.existAndIsDirectory(this.model.joinPath(destDir, destinationOnInstallDir))){
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
            await this.model.extractUtau(
                this.fileToExtract, destDir, 
                this.sourceType == "custom" ? this.zipProperties.sourceOnZip : "",
                destinationOnInstallDir,
                (pr) => {
                    dialog.setProgress((pr.currentEntry - 1) * 100 / pr.totalEntries);
                    dialog.setText("Extracting entry "+pr.currentEntry+" of "+pr.totalEntries+".");
                },
                this.destinationType == "other"
            );
            dialog.close();
            this.view.informExtractionSuccess();
        } catch (error) {
            dialog.close();
            this.view.emitAlert(error.message, 'Error');
        }
    }
}