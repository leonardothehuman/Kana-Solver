//This file is licensed under MIT license

const nodeDiskInfo = require("node-disk-info");
//import nodeDiskInfo from "node-disk-info";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import type {IFileFinderModel, objectRepresentation} from "../presenters/fileFinderPresenter";

export default class FileFinderModel implements IFileFinderModel{
    public async getAvailableDriveList():Promise<string[]>{
        let _driveList = await nodeDiskInfo.getDiskInfo();
        let driveList: Array<string> = [];
        for(let i = 0; i < _driveList.length; i++){
            if(_driveList[i].mounted)
                driveList.push(_driveList[i].mounted);
        }
        return driveList;
    }
    public goToParentDirectory(p: string): string{
        let splitPath = this.pathToArray(p);
        return path.win32.join(...splitPath.slice(0,splitPath.length - 1), this.defaultPathSeparator());
    }
    public homeDirectory(): string{
        return os.homedir();
    }
    public defaultPathSeparator(): string{
        return path.win32.sep;
    }
    public pathToArray(p:string): string[]{
        return path.win32.normalize(p).split(this.defaultPathSeparator()).filter((val) => {
            return val.length > 0;
        });
    }
    public joinPath(...p: string[]): string{
        return path.win32.join(...p);
    }
    public normalizePath(p: string): string{
        return path.win32.normalize(p);
    }
    public async getAllFilesOnDirectory(d: string): Promise<objectRepresentation[]>{
        const dir = await fsp.readdir(d, {withFileTypes: true});
        let directoryList: objectRepresentation[] = [];
        for(let i = 0; i < dir.length; i++){
            directoryList.push({
                completePath: this.normalizePath(this.joinPath(d, dir[i].name)),
                name: dir[i].name,
                isDirectory: dir[i].isDirectory(),
                isFile: dir[i].isFile()
            });
        }
        return directoryList;
    }
    public extractExtention(p: string): string{
        return path.win32.extname(p);
    }
    public pathIsAbsolute(p: string):boolean{
        return path.win32.isAbsolute(p);
    }
}