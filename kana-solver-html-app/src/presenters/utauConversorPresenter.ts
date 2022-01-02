//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type { objectRepresentation } from "../handlers/IFileSystemHandler";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type IStore from "../minilibs/IStore";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import AsyncStoreInterceptor, { loaderCallbackReturnObject } from "../minilibs/AsyncStoreInterceptor";
import type { unsubscriber } from "../minilibs/IReadOnlyStore";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type { IInstalledUtau } from "../handlers/IInstalledUtauHandler";
import type { UtauConversorDetailsProps } from "../views/pages/utauConversorDetails";
import { UtauRelevantContent } from "../minilibs/parsers/utauRelevantContent";
import type ISettingsHandler from "../handlers/ISettingsHandler";
import type IPathHandler from "../handlers/IPathHandler";

export interface IUtauConversorModel{
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
    readonly iuh: IInstalledUtauHandler;
    readonly sth: ISettingsHandler;
    readonly ph: IPathHandler;
}

export interface IUtauConversorView{
    goToConversionPage: (props: UtauConversorDetailsProps) => void;
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
    askConfirmationYN: (text: string, title: string) => Promise<boolean>;
    prompt: (title: string, text: string, defaultValue: string) => Promise<{
        text: string,
        ok: boolean
    }>;
}

export class UtauConversorPresenter{
    //Initialization
    public readonly view: IUtauConversorView;
    public readonly model: IUtauConversorModel;

    private _usersUtau: Store<IInstalledUtau[] | null>;
    public get usersUtau(): IReadOnlyStore<IInstalledUtau[] | null> {
        return this._usersUtau;
    }

    private _systemUtau: Store<IInstalledUtau[] | null>;
    public get systemUtau(): Store<IInstalledUtau[] | null> {
        return this._systemUtau;
    }

    constructor(view: IUtauConversorView, model: IUtauConversorModel){
        this.view = view;
        this.model = model;
        this._usersUtau = new Store([]);
        this._systemUtau = new Store([]);
    }
    public async init(){
        let spinner = await this.view.showSpinner("Loading ...");
        try {
            //TODO: Create a function that sets the required directories
            this._usersUtau.set(
                await this.model.iuh.getUtauListFromDirectory(
                    this.model.ph.UserVoiceDirectory.get()
                )
            );
        } catch (error) {
            spinner.close();
            //TODO: let user see this error
            //await this.view.emitAlert(error.message, "Error");
            this._usersUtau.set([]);
            spinner = await this.view.showSpinner("Loading ...");
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
            spinner.close();
            await this.view.emitAlert(error.message, "Error");
            this._systemUtau.set([]);
            spinner = await this.view.showSpinner("Loading ...");
        }
        spinner.close();
    }
    public async loadUtauConvertPage(utauInfo: IInstalledUtau){
        let spinner = await this.view.showSpinner("Loading ...");
        try{
            this.view.goToConversionPage({
                utauInfo: utauInfo
            });
            spinner.close();
        }catch(error){
            spinner.close();
            this.view.emitAlert(error.message, 'Failed to load UTAU file');
        }
    }
    public async revertUtau(utauInfo: IInstalledUtau){
        if(!await this.view.askConfirmation("Are you sure that you want to revert "+utauInfo.name, "Confirmation")){
            return;
        }
        let spinner = await this.view.showSpinner("Loading ...");
        try{
            let utau: UtauRelevantContent = new UtauRelevantContent(
                this.model.fsh, this.model.psh, utauInfo.completeRootPath
            );
            await utau.init();
            await utau.revertUtau();
            spinner.close();
        }catch(error){
            spinner.close();
            this.view.emitAlert(error.message, 'Failed to load UTAU file');
        }
        await this.init();
    }
    public openUtauDirectory(utau: IInstalledUtau){
        this.model.fsh.openOnFileExplorer(utau.completeRootPath);
    }
}