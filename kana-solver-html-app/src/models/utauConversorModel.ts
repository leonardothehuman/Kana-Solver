//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type ISettingsHandler from "../handlers/ISettingsHandler";
import type { IUtauConversorModel } from "../presenters/utauConversorPresenter";

export default class UtauConversorModel implements IUtauConversorModel{
    private _sth: ISettingsHandler;
    public get sth(): ISettingsHandler {
        return this._sth;
    }
    private _psh: IPathStringHandler;
    public get psh(): IPathStringHandler {
        return this._psh;
    }
    private _fsh: IFileSystemHandler;
    public get fsh(): IFileSystemHandler {
        return this._fsh;
    }
    private _iuh: IInstalledUtauHandler;
    public get iuh(): IInstalledUtauHandler {
        return this._iuh;
    }
    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler, iuh: IInstalledUtauHandler, sth: ISettingsHandler){
        this._psh = psh;
        this._fsh = fsh;
        this._iuh = iuh;
        this._sth = sth;
    }
}