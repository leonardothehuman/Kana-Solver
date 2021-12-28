//This file is licensed under MIT license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type { objectRepresentation } from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import AsyncStoreInterceptor from "../minilibs/AsyncStoreInterceptor";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type IStore from "../minilibs/IStore";
import Store from "../minilibs/Store";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";

export type breadCrumbItem = {
    name: string,
    completePath: string
}

export interface IFileFinderModel{
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
}

export interface IFileFinderView{
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
    scrollTo: (x: number, y: number) => void;
}

//Some getters and setters are only wrappers to modify the view
export class FileFinderPresenter{
    //Initialization
    private _view: IFileFinderView;
    private _model: IFileFinderModel;
    private _currentUnfilteredDirectoryObjectList: objectRepresentation[];
    private selectDirectory: boolean;

    private _currentDirectoryObjectsList: Store<objectRepresentation[]>;
    public get currentDirectoryObjectsList(): IReadOnlyStore<objectRepresentation[]> {
        return this._currentDirectoryObjectsList;
    }
    private _breadCrumb: Store<breadCrumbItem[]>;
    public get breadCrumb(): IReadOnlyStore<breadCrumbItem[]> {
        return this._breadCrumb;
    }
    private _driveList: Store<string[]>;
    public get driveList(): IStore<string[]> {
        return this._driveList;
    }
    private _currentExtenssion: Store<string>;
    public get currentExtenssion(): IStore<string> {
        return this._currentExtenssion;
    }
    private _currentDirectory: AsyncStoreInterceptor<string>;
    public get currentDirectory(): IReadOnlyStore<string> {
        return this._currentDirectory;
    }
    private _currentDrive: AsyncStoreInterceptor<string>;
    public get currentDrive(): AsyncStoreInterceptor<string> {
        return this._currentDrive;
    }
    //currentExtention
    
    constructor(view: IFileFinderView, model: IFileFinderModel, _selectDirectory: boolean){
        this.selectDirectory = _selectDirectory;
        this._view = view;
        this._currentUnfilteredDirectoryObjectList = [];//Unfiltered list of files on the current directory
        this._model = model;

        this._currentDirectoryObjectsList = new Store([]);
        this._breadCrumb = new Store([]);
        this._driveList = new Store([]);
        this._currentExtenssion = new Store("");
        this._currentDirectory = new AsyncStoreInterceptor("", true, async(ov: string, nv: string) => {
            let fullDestination = this.model.psh.joinPath(this.currentDrive.get(), nv);
            let directoryList: objectRepresentation[] = await this.model.fsh.getAllFilesOnDirectory(fullDestination);
            if(this.model.psh.normalizePath(nv) != this.model.psh.defaultPathSeparator()){
                let parent: objectRepresentation = {
                    completePath: this.model.psh.normalizePath(this.model.psh.joinPath(fullDestination, '..')),
                    name: "..",
                    isDirectory: true,
                    isFile: false
                };
                directoryList = [parent, ...directoryList];
            }
            this._breadCrumb.set(this.processBreadCrumbs(this.currentDrive.get(), nv));
            this.setcurrentUnfilteredDirectoryObjectList(directoryList);
            this.view.scrollTo(0, 0);
            return {
                valid: true,
                newValue: nv
            }
        });
        
        this._currentDrive = new AsyncStoreInterceptor("", true, async(ov: string, nv: string) => {
            let toReturn = {
                valid: true,
                newValue: nv
            }
            let previousDrive = ov.toUpperCase();
            let drive = nv.toUpperCase();
            if(drive == previousDrive) return toReturn;
            let sp = await this.view.showSpinner("Loading ...");
            //if(goToRoot == true){
            try {
                await this.setCurrentFullLocation(drive + this.model.psh.defaultPathSeparator());
                sp.close();
                return toReturn;
            } catch (error) {
                this._currentDrive.setWithoutExecuteLoader(previousDrive);
                sp.close();
                return {
                    valid: false,
                    newValue: ov
                }
            }
        });
        
        this._currentExtenssion.subscribe((nv: string) => {
            this.updateFileList();
        });
    }
    
    //Must be called to initialize the state of the class and the view
    public async init(initialDirectory: string){
        let sp = await this.view.showSpinner("Loading ...");
        try {
            let driveList = await this.model.fsh.getAvailableDriveList();
            try {
                //this.setCurrentExtention(initialExtention);
                this._driveList.set(driveList);
                if(this.selectDirectory == false){
                    initialDirectory = this.model.psh.goToParentDirectory(initialDirectory);
                }
                await this._setCurrentFullLocation(initialDirectory);
            } catch (err) {
                await this._setCurrentFullLocation(this.model.fsh.homeDirectory());
            }
            sp.close();
        } catch (error) {
            sp.close();
            this.view.emitAlert(error.message, 'Failed to load a directory')
        }
    }

    //Getters and setters
    private get view(): IFileFinderView {
        return this._view;
    }
    public get model(): IFileFinderModel {
        return this._model;
    }
    private get currentUnfilteredDirectoryObjectList(): objectRepresentation[] {
        return this._currentUnfilteredDirectoryObjectList;
    }
    private setcurrentUnfilteredDirectoryObjectList(value: objectRepresentation[]) {
        this._currentUnfilteredDirectoryObjectList = value;
        this.updateFileList();
    }
    public getCurrentFullPath(): string{
        return this.model.psh.joinPath(this.currentDrive.get(), this.currentDirectory.get());
    }
    private processBreadCrumbs(_drive: string, _path: string):breadCrumbItem[]{
        let breadCrumb: breadCrumbItem[] = [];
        breadCrumb.push({
            name: _drive,
            completePath: _drive + this.model.psh.defaultPathSeparator()
        });
        if(_path != this.model.psh.defaultPathSeparator()){
            let splitPath = this.model.psh.pathToArray(_path);
            for(var i = 0; i < splitPath.length; i++){
                breadCrumb.push({
                    name: splitPath[i],
                    completePath: this.model.psh.joinPath(_drive, ...splitPath.slice(0, i + 1))
                });
            }
        }
        return breadCrumb;
    }
    
    public async setCurrentFullLocation(_location: string){
        let sp = await this.view.showSpinner("Loading ...");
        try {
            await this._setCurrentFullLocation(_location);
            sp.close();
        } catch (error) {
            sp.close();
            this.view.emitAlert(error, 'Failed to select a directory');
            throw error
        }
    }
    private async _setCurrentFullLocation(_location: string){
        let drive = '';
        let location = '';
        try {
            drive = this.model.psh.getDriveFromPath(_location);
            location = this.model.psh.getPathWithoutDrive(_location);
        } catch (error) {
            _location = this.model.fsh.homeDirectory();
            drive = this.model.psh.getDriveFromPath(_location);
            location = this.model.psh.getPathWithoutDrive(_location);
        }
        if(this.currentDrive.get() != drive){
            this._currentDrive.setWithoutExecuteLoader(drive);
        }
        await this._currentDirectory.set(location);
    }

    private displayCurrenfFile(f: objectRepresentation): boolean{
        if(this.currentExtenssion.get() == "*.*" && !this.selectDirectory){
            return true;
        }else if(!this.selectDirectory){
            let extParts = this.currentExtenssion.get().split(".");
            let ext = '.' + extParts[extParts.length - 1];
            if(this.model.psh.extractExtention(f.completePath).toUpperCase() == ext.toUpperCase() || f.isDirectory){
                return true;
            }
        }else if(this.selectDirectory){
            return f.isDirectory;
        }
        return false;
    }

    //Updates the visible files list
    private updateFileList(){
        let toSet:objectRepresentation[] = [];
        for(let i = 0; i < this.currentUnfilteredDirectoryObjectList.length; i++){
            if(this.displayCurrenfFile(this.currentUnfilteredDirectoryObjectList[i])){
                toSet.push(this.currentUnfilteredDirectoryObjectList[i]);
            }
        }
        this._currentDirectoryObjectsList.set(toSet);
    }
}