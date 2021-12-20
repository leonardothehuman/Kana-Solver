import type IPathStringHandler from "./IPathStringshandler";
import path from "path";

export default class PathStringHandler implements IPathStringHandler{
    public pathIsAbsolute(p: string):boolean{
        return path.win32.isAbsolute(p);
    }
    public getPathWithoutDrive(p: string): string{
        let driveSplit: string[] | false = [];
        driveSplit = p.split(":");
        if(
            driveSplit.length != 2 ||
            driveSplit[0].length != 1 ||
            !this.pathIsAbsolute(p)
        ){
            throw new Error("The given path is not valid or does not contain a drive");
        }
        return driveSplit[1];
    }
    public getDriveFromPath(p: string): string{
        let driveSplit: string[] = [];
        driveSplit = p.split(":");
        if(
            driveSplit.length != 2 ||
            driveSplit[0].length != 1 ||
            !this.pathIsAbsolute(p)
        ){
            throw new Error("The given path is not valid or does not contain a drive");
        }
        return driveSplit[0] + ":";
    }
    public goToParentDirectory(p: string): string{
        let splitPath = this.pathToArray(p);
        return path.win32.join(...splitPath.slice(0,splitPath.length - 1), this.defaultPathSeparator());
    }
    public pathToArray(p:string): string[]{
        return path.win32.normalize(p).split(this.defaultPathSeparator()).filter((val) => {
            return val.length > 0;
        });
    }
    public defaultPathSeparator(): string{
        return path.win32.sep;
    }
    public joinPath(...p: string[]): string{
        return path.win32.join(...p);
    }
    public posixJoinPath(...p: string[]): string{
        for(let i = 0; i < p.length; i++){
            p[i] = this.normalizeSlash(p[i]);
        }
        return path.posix.join(...p);
    }
    public normalizePath(p: string): string{
        return path.win32.normalize(p);
    }
    public extractExtention(p: string): string{
        return path.win32.extname(p);
    }
    public extractName(p: string): string{
        return path.win32.parse(p).name;
    }
    public extractFileName(name: string, ext: string): string{
        return path.win32.basename(name, ext);
    }
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
    public normalizeSlash(t: string): string{
        let toReturn:string = "";
        for(let i = 0; i < t.length; i++){
            if(t.charAt(i) == "\\"){
                toReturn = toReturn + "/";
            }else{
                toReturn = toReturn + t.charAt(i);
            }
        }
        return toReturn;
    }
    public zipNormalize(t: string): string{
        let normalizedSlashes:string = this.normalizeSlash(t);
        let split = path.posix.normalize("/"+normalizedSlashes+"/").split("/");
        for(let i = 0; i < split.length; i++){
            let c = split[i].trim();
            let onlyDots = true;
            for(let j = 0; j < c.length; j++){
                if(c.charAt(j) != '.') onlyDots = false;
            }
            split[i] = c.trim();
            if(onlyDots == true){
                split[i] = "";
                continue;
            }
            for(let j = c.length; j > 0; j--){
                if(c.charAt(j-1) == '.'){
                    split[i] = c.substr(0, j - 1).trim();
                }else{
                    break;
                }
            }
        }
        let ensuredSlashes: string = path.posix.normalize("/"+split.join("/")+"/")
        let toReturn = ensuredSlashes;
        if(toReturn.charAt(0) == "/") toReturn = toReturn.substr(1, toReturn.length);
        if(toReturn.charAt(toReturn.length-1) == "/") toReturn = toReturn.substr(0, toReturn.length-1);
        return toReturn;
    }
    public hasWin32ForbiddenChars(f: string): boolean{
        for(let i = 0; i < f.length; i++){
            if(f.charAt(i) == '\\') return true;
            if(f.charAt(i) == '/') return true;
            if(f.charAt(i) == ':') return true;
            if(f.charAt(i) == '*') return true;
            if(f.charAt(i) == '?') return true;
            if(f.charAt(i) == '"') return true;
            if(f.charAt(i) == '<') return true;
            if(f.charAt(i) == '>') return true;
            if(f.charAt(i) == '|') return true;
        }
        return false;
    }
    public getRelativePath(source: string, destination:string): string{
        return path.relative(source, destination);
    }
}