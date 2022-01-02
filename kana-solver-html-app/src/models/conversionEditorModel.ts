//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathHandler from "../handlers/IPathHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type { IConversionEditorModel } from "../presenters/conversionEditorPresenter";

export default class ConversionEditorModel implements IConversionEditorModel{
    private _psh: IPathStringHandler;
    public get psh(): IPathStringHandler {
        return this._psh;
    }
    private _fsh: IFileSystemHandler;
    public get fsh(): IFileSystemHandler {
        return this._fsh;
    }
    private _ph: IPathHandler;
    public get ph(): IPathHandler {
        return this._ph;
    }
    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler, ph: IPathHandler){
        this._psh = psh;
        this._fsh = fsh;
        this._ph = ph;
    }
}