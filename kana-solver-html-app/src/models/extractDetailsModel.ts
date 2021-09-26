//This file is licensed under GNU GPL v3.0 only license

import { extractUtau } from "../minilibs/zipHandler";
import path from "path";
import fsp from "fs/promises";
import fs from "fs";
import type { IExtractDetailsModel, ZipExtractProgressCallback } from "../presenters/extractDetailsPresenter";

export default class ExtractDetailsModel implements IExtractDetailsModel{
    public isCompleteWinPath(_path: string): boolean{
        if(path.win32.isAbsolute(_path)){
            let driveSplit: string[] = [];
            driveSplit = _path.split(":");
            if(
                driveSplit.length != 2 ||
                driveSplit[0].length != 1
            ){
                return false;
            }
            return true;
        }else{
            return false;
        }
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
    public joinPath(...p: string[]): string{
        return path.win32.join(...p);
    }
    public async isDirectoryEmpty(p: string){
        let dir = await fsp.readdir(p, {withFileTypes: true});
        if(dir.length > 0) return false;
        return true;
    }
    public async extractUtau(
        zipFile: string,
        installDir: string,
        sourceZipDirectory: string,//normalized
        destinationOnInstallDir: string,//normalized
        progressCallback: ZipExtractProgressCallback,
        failIfFileExists: boolean
    ){
        await extractUtau(zipFile, installDir, sourceZipDirectory, destinationOnInstallDir,
            progressCallback, failIfFileExists);
    }
}