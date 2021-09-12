//This file is licensed under MIT license

const nodeDiskInfo = require("node-disk-info");
import fsp from "fs/promises";
import path from "path";
import os from "os";

//Just for testing, must be removed ...
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export type objectRepresentation = {
    completePath: string,
    name: string,
    isDirectory: boolean,
    isFile: boolean
}

export type breadCrumbItem = {
    name: string,
    completePath: string
}

export interface IFileFinderView{
    setCurrentDirectoryObjectsList: (list: objectRepresentation[], onlyOnChange: boolean) => boolean;
    setBreadcrumb: (b: breadCrumbItem[], onlyOnChange: boolean) => boolean;

    getDriveList:() => Array<string>;
    setDriveList:(list: Array<string>, onlyOnChange: boolean) => boolean;

    getCurrentDrive: () => string;
    setCurrentDrive: (drive: string, onlyOnChange: boolean) => boolean;
    
    getCurrentDirectory: () => string;
    setCurrentDirectory: (d: string, onlyOnChange: boolean) => boolean;
    
    getCurrentExtention: () => string;
    setCurrentExtention: (d: string, onlyOnChange: boolean) => boolean;
}

//Some getters and setters are only wrappers to modify the view
export class FileFinderPresenter{
    //Initialization
    private _view: IFileFinderView;
    private _currentUnfilteredDirectoryObjectList: objectRepresentation[];
    private _currentDrive: string;
    private selectDirectory: boolean;
    constructor(view: IFileFinderView, _selectDirectory: boolean){
        this.selectDirectory = _selectDirectory;
        this._view = view;
        this._currentUnfilteredDirectoryObjectList = [];//Unfiltered list of files on the current directory
        this._currentDrive = "";
    }
    
    //Must be called to initialize the state of the class and the view
    public async init(initialDirectory: string){
        let _driveList = await nodeDiskInfo.getDiskInfo();
        let driveList: Array<string> = [];
        for(let i = 0; i < _driveList.length; i++){
            if(_driveList[i].mounted)
                driveList.push(_driveList[i].mounted);
        }
        try {
            //this.setCurrentExtention(initialExtention);
            this.setCurrentDriveList(driveList);
            await this.setCurrentFullLocation(initialDirectory);
        } catch (err) {
            await this.setCurrentFullLocation(os.homedir());
        }
    }

    //Getters and setters
    private get view(): IFileFinderView {
        return this._view;
    }
    private get currentUnfilteredDirectoryObjectList(): objectRepresentation[] {
        return this._currentUnfilteredDirectoryObjectList;
    }
    private setcurrentUnfilteredDirectoryObjectList(value: objectRepresentation[]) {
        this._currentUnfilteredDirectoryObjectList = value;
        this.updateFileList();
    }
    private get currentDriveList(): string[] {
        return this.view.getDriveList();
    }
    private setCurrentDriveList(value: string[]) {
        this.view.setDriveList(value, true);
    }
    public get currentDrive(): string {
        return this._currentDrive;
    }
    //Sets the current drive, if you don't go to root the current directory will continue to be the same
    //on the diferent drive until the directory gets changed manually
    public async setCurrentDrive(drive: string, goToRoot: boolean){
        let previousDrive = this.currentDrive;
        drive = drive.toUpperCase();
        if(drive == this.currentDrive) return;
        this.view.setCurrentDrive(drive, true);
        this._currentDrive = drive;
        if(goToRoot == true){
            try {
                await this.setCurrentFullLocation(drive + path.win32.sep);
            } catch (error) {
                this.setCurrentDrive(previousDrive, false);
                throw error;
            }
        }
    }
    public get currentDirectory(): string{
        return this.view.getCurrentDirectory();
    }
    private processBreadCrumbs(_drive: string, _path: string):breadCrumbItem[]{
        let breadCrumb: breadCrumbItem[] = [];
        breadCrumb.push({
            name: _drive,
            completePath: _drive + path.win32.sep
        });
        if(_path != path.win32.sep){
            let splitPath = path.win32.normalize(_path).split(path.win32.sep).filter((val) => {
                return val.length > 0;
            });
            for(var i = 0; i < splitPath.length; i++){
                breadCrumb.push({
                    name: splitPath[i],
                    completePath: path.win32.join(_drive, ...splitPath.slice(0, i + 1))
                });
            }
        }
        return breadCrumb;
    }
    //Sets the current directory relative to the current drive
    private async setCurrentDirectory(location: string){
        let fullDestination = path.win32.join(this.currentDrive, location);
        const dir = await fsp.readdir(fullDestination, {withFileTypes: true});
        let directoryList: objectRepresentation[] = [];
        if(location != path.win32.sep){
            directoryList.push({
                completePath: path.win32.normalize(path.win32.join(fullDestination, '..')),
                name: "..",
                isDirectory: true,
                isFile: false
            });
        }
        for(let i = 0; i < dir.length; i++){
            directoryList.push({
                completePath: path.win32.normalize(path.win32.join(fullDestination, dir[i].name)),
                name: dir[i].name,
                isDirectory: dir[i].isDirectory(),
                isFile: dir[i].isFile()
            });
        }
        this.view.setCurrentDirectory(location, true);
        this.view.setBreadcrumb(this.processBreadCrumbs(this.currentDrive, location), true);
        this.setcurrentUnfilteredDirectoryObjectList(directoryList);
    }
    public get currentExtention(): string {
        return this.view.getCurrentExtention();
    }
    //Set the extensions that will be displayed
    public setCurrentExtention(value: string) {
        this.view.setCurrentExtention(value, true);
        this.updateFileList();
    }
    
    //Getters and setters helpers
    //Sets the current location, including the drive
    public async setCurrentFullLocation(_location: string){
        let drive = '';
        let location = '';
        try {
            drive = this.getDriveFromPath(_location);
            location = this.getPathWithoutDrive(_location);
        } catch (error) {
            _location = os.homedir();
            drive = this.getDriveFromPath(_location);
            location = this.getPathWithoutDrive(_location);
        }
        if(this.currentDrive != drive){
            await this.setCurrentDrive(drive, false);
        }
        //console.log("setCurrentFulllocation: ", _location);
        await this.setCurrentDirectory(location);
    }

    private displayCurrenfFile(f: objectRepresentation): boolean{
        if(this.currentExtention == "*.*" && !this.selectDirectory){
            return true;
        }else if(!this.selectDirectory){
            let extParts = this.currentExtention.split(".");
            let ext = '.' + extParts[extParts.length - 1];
            if(path.win32.extname(f.completePath).toUpperCase() == ext.toUpperCase() || f.isDirectory){
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
        this.view.setCurrentDirectoryObjectsList(toSet, true);
    }

    //Data transformation
    private getPathWithoutDrive(p: string): string{
        let driveSplit: string[] | false = [];
        driveSplit = p.split(":");
        if(
            driveSplit.length != 2 ||
            driveSplit[0].length != 1 ||
            !path.win32.isAbsolute(p)
        ){
            throw new Error("The given path is not valid or does not contain a drive");
        }
        return driveSplit[1];
    }
    private getDriveFromPath(p: string): string{
        let driveSplit: string[] = [];
        driveSplit = p.split(":");
        if(
            driveSplit.length != 2 ||
            driveSplit[0].length != 1 ||
            !path.win32.isAbsolute(p)
        ){
            throw new Error("The given path is not valid or does not contain a drive");
        }
        return driveSplit[0] + ":";
    }
}