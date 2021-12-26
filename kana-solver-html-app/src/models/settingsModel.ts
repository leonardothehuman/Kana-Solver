//This file is licensed under MIT license

import type ISettingsHandler from "../handlers/ISettingsHandler";
import type { ISettingsModel } from "../presenters/settingsPresenter";

export default class SettingsModel implements ISettingsModel{
    private _sth: ISettingsHandler;
    public get sth(): ISettingsHandler {
        return this._sth;
    }
    constructor(sth: ISettingsHandler){
        this._sth = sth;
    }
}