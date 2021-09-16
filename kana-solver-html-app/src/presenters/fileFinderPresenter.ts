//This file is licensed under MIT license

//Just for testing, must be removed ...
// function sleep(ms: number) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

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

export interface IFileFinderModel{
    getAvailableDriveList: () => Promise<string[]>;
    getAllFilesOnDirectory: (d: string) => Promise<objectRepresentation[]>;
    goToParentDirectory: (p: string) => string;
    homeDirectory: () => string;
    defaultPathSeparator: () => string;
    pathToArray: (p: string) => string[];
    joinPath: (...p: string[]) => string;
    normalizePath:(p: string) => string;
    extractExtention: (p: string) => string;
    pathIsAbsolute:(p: string) => boolean;
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
    private _model: IFileFinderModel;
    private _currentUnfilteredDirectoryObjectList: objectRepresentation[];
    private _currentDrive: string;
    private selectDirectory: boolean;
    constructor(view: IFileFinderView, model: IFileFinderModel, _selectDirectory: boolean){
        this.selectDirectory = _selectDirectory;
        this._view = view;
        this._currentUnfilteredDirectoryObjectList = [];//Unfiltered list of files on the current directory
        this._currentDrive = "";
        this._model = model;
    }
    
    //Must be called to initialize the state of the class and the view
    public async init(initialDirectory: string){
        let driveList = await this.model.getAvailableDriveList();
        try {
            //this.setCurrentExtention(initialExtention);
            this.setCurrentDriveList(driveList);
            if(this.selectDirectory == false){
                initialDirectory = this.model.goToParentDirectory(initialDirectory);
            }
            await this.setCurrentFullLocation(initialDirectory);
        } catch (err) {
            await this.setCurrentFullLocation(this.model.homeDirectory());
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
                await this.setCurrentFullLocation(drive + this.model.defaultPathSeparator());
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
            completePath: _drive + this.model.defaultPathSeparator()
        });
        if(_path != this.model.defaultPathSeparator()){
            let splitPath = this.model.pathToArray(_path);
            for(var i = 0; i < splitPath.length; i++){
                breadCrumb.push({
                    name: splitPath[i],
                    completePath: this.model.joinPath(_drive, ...splitPath.slice(0, i + 1))
                });
            }
        }
        return breadCrumb;
    }
    //Sets the current directory relative to the current drive
    private async setCurrentDirectory(location: string){
        let fullDestination = this.model.joinPath(this.currentDrive, location);
        let directoryList: objectRepresentation[] = await this.model.getAllFilesOnDirectory(fullDestination);
        if(this.model.normalizePath(location) != this.model.defaultPathSeparator()){
            let parent: objectRepresentation = {
                completePath: this.model.normalizePath(this.model.joinPath(fullDestination, '..')),
                name: "..",
                isDirectory: true,
                isFile: false
            };
            directoryList = [parent, ...directoryList];
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
            _location = this.model.homeDirectory();
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
            if(this.model.extractExtention(f.completePath).toUpperCase() == ext.toUpperCase() || f.isDirectory){
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
            !this.model.pathIsAbsolute(p)
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
            !this.model.pathIsAbsolute(p)
        ){
            throw new Error("The given path is not valid or does not contain a drive");
        }
        return driveSplit[0] + ":";
    }
}