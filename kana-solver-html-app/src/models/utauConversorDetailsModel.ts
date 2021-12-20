//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type { IUtauConversorDetailsModel } from "../presenters/utauConversorDetailsPresenter";

export default class UtauConversorDetailsModel implements IUtauConversorDetailsModel{
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
    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler, iuh: IInstalledUtauHandler){
        this._psh = psh;
        this._fsh = fsh;
        this._iuh = iuh;
    }
}