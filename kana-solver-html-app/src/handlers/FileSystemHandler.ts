const nodeDiskInfo = require("node-disk-info");
import type IFileSystemHandler from "./IFileSystemHandler";
import type { objectRepresentation } from "./IFileSystemHandler";
import fsp from "fs/promises";
import os from "os";
import fs from "fs";
import type IPathStringHandler from "./IPathStringshandler";
import iconv from "iconv-lite";
import rimraf from "rimraf";

export default class FileSystemHandler implements IFileSystemHandler{
    private pathStringHandler: IPathStringHandler;
    constructor(pathStringHandler: IPathStringHandler){
        this.pathStringHandler = pathStringHandler;
    }
    public async getAvailableDriveList():Promise<string[]>{
        let _driveList = await nodeDiskInfo.getDiskInfo();
        let driveList: Array<string> = [];
        for(let i = 0; i < _driveList.length; i++){
            if(_driveList[i].mounted)
                driveList.push(_driveList[i].mounted);
        }
        return driveList;
    }
    public homeDirectory(): string{
        return os.homedir();
    }
    public async getAllFilesOnDirectory(d: string): Promise<objectRepresentation[]>{
        const dir = await fsp.readdir(d, {withFileTypes: true});
        let directoryList: objectRepresentation[] = [];
        for(let i = 0; i < dir.length; i++){
            directoryList.push({
                completePath: this.pathStringHandler.normalizePath(
                    this.pathStringHandler.joinPath(d, dir[i].name)
                ),
                name: dir[i].name,
                isDirectory: dir[i].isDirectory(),
                isFile: dir[i].isFile()
            });
        }
        return directoryList;
    }
    public async isDirectoryEmpty(p: string): Promise<boolean>{
        let dir = await fsp.readdir(p, {withFileTypes: true});
        if(dir.length > 0) return false;
        return true;
    }
    public async existAndIsFile(_path: string): Promise<boolean>{
        try {
            await fsp.access(
                _path,
                fs.constants.F_OK
            );
        } catch (error) {
            return false;
        }
        let destStat = await fsp.stat(_path);
        if(!destStat.isFile()){
            return false;
        }
        return true;
    }
    public async existAndIsDirectory(_path: string): Promise<boolean>{
        try {
            await fsp.access(
                _path,
                fs.constants.F_OK
            );
        } catch (error) {
            return false;
        }
        let destStat = await fsp.stat(_path);
        if(!destStat.isDirectory()){
            return false;
        }
        return true;
    }
    public async exist(_path: string): Promise<boolean>{
        try {
            await fsp.access(
                _path,
                fs.constants.F_OK
            );
        } catch (error) {
            return false;
        }
        return true;
    }
    public async readTextFile(_path: string, encoding: string): Promise<string>{
        let fileBuffer = await fsp.readFile(_path);
        return iconv.decode(fileBuffer, encoding);
    }
    public async saveTextFile(_path: string, encoding: string, text: string): Promise<void>{
        let fileBuffer = iconv.encode(text, encoding);
        return await fsp.writeFile(_path, fileBuffer);
    }
    public recursiveDelete(_path: string): Promise<void>{
        return new Promise((resolve, reject) => {
            if(!this.pathStringHandler.isCompleteWinPath(_path)){
                reject(new Error("You must inform the complete path to use the function recursiveDelete !!!"));
                return;
            };
            rimraf(_path, {disableGlob: true}, async function(err){
                if(err){
                    reject(err);
                }
                resolve();
            });
        });
    }
    public deleteFile(_path: string): Promise<void>{
        return new Promise((resolve, reject) => {
            if(!this.pathStringHandler.isCompleteWinPath(_path)){
                reject(new Error("You must inform the complete path to use the function recursiveDelete !!!"));
                return;
            };
            fsp.unlink(_path).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }
    public async openOnFileExplorer(_path: string):Promise<void>{
        var toOpen = "";
        for(let i = 0; i < _path.length; i++){
            toOpen = toOpen + _path.charAt(i);
            if(_path.charAt(i) == '"') toOpen = toOpen + '"';
        }
        require('child_process').exec('explorer "'+_path+'"');
        return;
    }
}