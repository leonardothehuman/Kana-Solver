//This file is licensed under MIT license
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type { IInstalledUtau } from "../handlers/IInstalledUtauHandler";
import type IZipHandler from "../handlers/IZipHandler";
import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import type {ExtractDetailsProps} from "../views/pages/extractDetails";
import type ISettingsHandler from "../handlers/ISettingsHandler";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type IStore from "../minilibs/IStore";
import type IPathHandler from "../handlers/IPathHandler";

export interface IExtractView{
    emitAlert: (text: string, title: string) => Promise<void>;
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    goToExtractPage: (props: ExtractDetailsProps) => void;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
}

export interface IExtractModel{
    readonly psh: IPathStringHandler;
    readonly iuh: IInstalledUtauHandler;
    readonly zh: IZipHandler;
    readonly fsh: IFileSystemHandler;
    readonly sth: ISettingsHandler;
    readonly ph: IPathHandler;
}

//Some getters and setters are only wrappers to modify the view
export class ExtractPresenter{
    //Initialization
    private _view: IExtractView;
    private _model: IExtractModel;
    
    private _usersUtau: Store<IInstalledUtau[]>;
    public get usersUtau(): IReadOnlyStore<IInstalledUtau[]> {
        return this._usersUtau;
    }
    private _systemUtau: Store<IInstalledUtau[]>;
    public get systemUtau(): IReadOnlyStore<IInstalledUtau[]> {
        return this._systemUtau;
    }
    private _selectedVoicBank: Store<string>;
    public get selectedVoicBank(): IStore<string> {
        return this._selectedVoicBank;
    }
    
    constructor(view: IExtractView, model: IExtractModel){
        this._view = view;
        this._model = model;
        this._usersUtau = new Store([]);
        this._systemUtau = new Store([]);
        this._selectedVoicBank = new Store("");
    }
    
    //Getters and setters
    private get view(): IExtractView {
        return this._view;
    }
    public get model(): IExtractModel {
        return this._model;
    }
    
    //TODO: join with similar functions
    public async loadUtauList(): Promise<void>{
        let spinner = await this.view.showSpinner("Loading ...");
        try {
            this._usersUtau.set(
                await this.model.iuh.getUtauListFromDirectory(
                    this.model.ph.UserVoiceDirectory.get()
                )
            );
        } catch (error) {
            //TODO: let user see this error
            console.log(error);
            this._usersUtau.set([]);
        }

        if(!this.model.psh.isCompleteWinPath(this.model.sth.UTAUInstallationDirectory.get())){
            spinner.close();
            this.view.emitAlert("The configured utau installation directory is not valid", "Warning");
            return;
        }

        try {
            this._systemUtau.set(
                await this.model.iuh.getUtauListFromDirectory(
                    this.model.ph.SystemVoiceDirectory.get()
                )
            );
        } catch (error) {
            //TODO: let user see this error and tell everywhere to configure the correct directory
            console.log(error);
            this._systemUtau.set([]);
        }
        spinner.close();
    }

    public async loadUtauInstallationPage(){
        if(!this.model.psh.isCompleteWinPath(this.selectedVoicBank.get())){
            this.view.emitAlert("Invalid archive file path", 'Error');
            return;
        }

        let spinner = await this.view.showSpinner("Loading ...");
        try{
            let zipInfo = await this.model.zh.getUtauZipInfo(this.selectedVoicBank.get());
            let props: ExtractDetailsProps = {
                fileToExtract: this.selectedVoicBank.get(),
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
        this._usersUtau.set([]);
        this._systemUtau.set([]);
        spinner.close();
        await this.loadUtauList(); 
    }
}