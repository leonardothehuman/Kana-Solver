import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type ISettingsHandler from "../handlers/ISettingsHandler";
import type IZipHandler from "../handlers/IZipHandler";
import type { IExtractModel } from "../presenters/extractPresenter";

export default class ExtractModel implements IExtractModel{
    private _sth: ISettingsHandler;
    public get sth(): ISettingsHandler {
        return this._sth;
    }
    private _psh: IPathStringHandler;
    public get psh(): IPathStringHandler {
        return this._psh;
    }
    private _iuh: IInstalledUtauHandler;
    public get iuh(): IInstalledUtauHandler {
        return this._iuh;
    }
    private _zh: IZipHandler;
    public get zh(): IZipHandler {
        return this._zh;
    }
    private _fsh: IFileSystemHandler;
    public get fsh(): IFileSystemHandler {
        return this._fsh;
    }

    constructor(
        psh: IPathStringHandler, 
        iuh: IInstalledUtauHandler, 
        fsh:IFileSystemHandler, 
        zh: IZipHandler,
        sth: ISettingsHandler
    ){
        this._psh = psh;
        this._iuh = iuh;
        this._fsh = fsh;
        this._zh = zh;
        this._sth = sth;
    }
}