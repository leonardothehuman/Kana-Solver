//This file is licensed under MIT license
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type { IInstalledUtau } from "../handlers/IInstalledUtauHandler";
import type IZipHandler from "../handlers/IZipHandler";
import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import type {ExtractDetailsProps} from "../views/pages/extractDetails";

export interface IExtractView{
    emitAlert: (text: string, title: string) => Promise<void>;
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    goToExtractPage: (props: ExtractDetailsProps) => void;
    askConfirmation: (text: string, title: string) => Promise<boolean>;

    setUsersUtau: (ul: IInstalledUtau[], onlyOnChange: boolean) => boolean;
    setSystemUtau: (ul: IInstalledUtau[], onlyOnChange: boolean) => boolean;
    setSelectedVoicebank: (vb: string, onlyOnChange: boolean) => boolean;
}

export interface IExtractModel{
    readonly psh: IPathStringHandler;
    readonly iuh: IInstalledUtauHandler;
    readonly zh: IZipHandler;
    readonly fsh: IFileSystemHandler;
}

//Some getters and setters are only wrappers to modify the view
export class ExtractPresenter{
    //Initialization
    private _view: IExtractView;
    private _model: IExtractModel;
    private _usersUtau: IInstalledUtau[];
    private _systemUtau: IInstalledUtau[];
    private _selectedVoicBank: string;
    
    constructor(view: IExtractView, model: IExtractModel){
        this._view = view;
        this._model = model;
        this.usersUtau = [];
        this.systemUtau = [];
        this.selectedVoicBank = "";
    }
    
    //Getters and setters
    private get view(): IExtractView {
        return this._view;
    }
    public get model(): IExtractModel {
        return this._model;
    }
    private get usersUtau(): IInstalledUtau[] {
        return this._usersUtau;
    }
    private set usersUtau(value: IInstalledUtau[]) {
        this._usersUtau = value;
        this.view.setUsersUtau(this._usersUtau, true);
    }
    private get systemUtau(): IInstalledUtau[] {
        return this._systemUtau;
    }
    private set systemUtau(value: IInstalledUtau[]) {
        this._systemUtau = value;
        this.view.setSystemUtau(this._systemUtau, true);
    }
    public get selectedVoicBank(): string {
        return this._selectedVoicBank;
    }
    public set selectedVoicBank(value: string) {
        this._selectedVoicBank = value;
        this.view.setSelectedVoicebank(this._selectedVoicBank, true);
    }
    
    //TODO: join with similar functions
    public async loadUtauList(): Promise<void>{
        let spinner = await this.view.showSpinner("Loading ...");
        try {
            this.usersUtau = await this.model.iuh.getUtauListFromDirectory(
                this.model.psh.joinPath(process.env.APPDATA, "UTAU\\voice")
            );
        } catch (error) {
            //TODO: let user see this error
            console.log(error);
            this.usersUtau = [];
        }

        //TODO: improve this
        if(localStorage.getItem("UTAUInstallationDirectory") == null){
            localStorage.setItem("UTAUInstallationDirectory", "");
        }

        if(!this.model.psh.isCompleteWinPath(localStorage.getItem("UTAUInstallationDirectory"))){
            spinner.close();
            this.view.emitAlert("The configured utau installation directory is not valid", "Warning");
            return;
        }

        try {
            this.systemUtau = await this.model.iuh.getUtauListFromDirectory(
                this.model.psh.joinPath(localStorage.getItem("UTAUInstallationDirectory"), "voice")
            );
        } catch (error) {
            //TODO: let user see this error
            console.log(error);
            this.systemUtau = [];
        }
        spinner.close();
    }

    public async loadUtauInstallationPage(){
        if(!this.model.psh.isCompleteWinPath(this.selectedVoicBank)){
            this.view.emitAlert("Invalid archive file path", 'Error');
            return;
        }

        let spinner = await this.view.showSpinner("Loading ...");
        try{
            let zipInfo = await this.model.zh.getUtauZipInfo(this.selectedVoicBank);
            let props: ExtractDetailsProps = {
                fileToExtract: this.selectedVoicBank,
                zipProperties: zipInfo
            };
            this.view.goToExtractPage(props);
            spinner.close();
        }catch(error){
            spinner.close();
            this.view.emitAlert(error.message, 'Failed to load UTAU file');
        }
    }
    
    public async uninstallUtau(utau: IInstalledUtau): Promise<void>{
        if(!await this.view.askConfirmation("Are you sure that you want to uninstall "+utau.name, "Confirmation")){
            return;
        }
        let spinner = await this.view.showSpinner("Uninstalling ...");
        try {
            await utau.uninstallUtau();
        } catch (error) {
            this.view.emitAlert(error.message, 'Failed to uninstall UTAU voicebank');
        }
        this.usersUtau = [];
        this.systemUtau = [];
        spinner.close();
        await this.loadUtauList(); 
    }
}