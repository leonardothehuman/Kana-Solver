//This file is licensed under MIT license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import type {IFileFinderModel} from "../presenters/fileFinderPresenter";

export default class FileFinderModel implements IFileFinderModel{
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