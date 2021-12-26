//This file is licensed under GNU GPL v3.0 only license

import type Store from "../minilibs/Store";
import type ISettingsHandler from "../handlers/ISettingsHandler";
import type { colorSchemeOptions } from "../handlers/ISettingsHandler";

export interface ISettingsModel{
    sth: ISettingsHandler;
}

export interface ISettingsView{
    //TODO: Centralize this mundane things
    // showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    // emitAlert: (text: string, title: string) => Promise<void>;
    // scrollTo: (x: number, y: number) => void;
}

export class SettingsPresenter{
    //Initialization
    public readonly view: ISettingsView;
    public readonly model: ISettingsModel;

    public UTAUInstallationDirectory: Store<string>;
    public ColorScheme: Store<colorSchemeOptions>;

    constructor(view: ISettingsView, model: ISettingsModel){
        this.view = view;
        this.model = model;

        this.UTAUInstallationDirectory = this.model.sth.UTAUInstallationDirectory;
        this.ColorScheme = this.model.sth.ColorScheme;
    }
    public async init(){
    }
}