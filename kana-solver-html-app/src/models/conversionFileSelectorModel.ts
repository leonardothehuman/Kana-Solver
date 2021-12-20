//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type { IConversionFileSelectorModel } from "../presenters/conversionFileSelectorPresenter";

export default class ConversionFileSelectorModel implements IConversionFileSelectorModel{
    private _psh: IPathStringHandler;
    public get psh(): IPathStringHandler {
        return this._psh;
    }
    private _fsh: IFileSystemHandler;
    public get fsh(): IFileSystemHandler {
        return this._fsh;
    }
    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler){
        this._psh = psh;
        this._fsh = fsh;
    }
}