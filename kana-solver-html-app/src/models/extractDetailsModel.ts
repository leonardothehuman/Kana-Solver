//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type IZipHandler from "../handlers/IZipHandler";
import type { IExtractDetailsModel } from "../presenters/extractDetailsPresenter";

export default class ExtractDetailsModel implements IExtractDetailsModel{
    private _psh: IPathStringHandler;
    public get psh(): IPathStringHandler {
        return this._psh;
    }
    private _fsh: IFileSystemHandler;
    public get fsh(): IFileSystemHandler {
        return this._fsh;
    }
    private _zh: IZipHandler;
    public get zh(): IZipHandler {
        return this._zh;
    }
    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler, zh: IZipHandler){
        this._psh = psh;
        this._fsh = fsh;
        this._zh = zh;
    }
}