import {isBoolean, isNumber, isString} from '../helpers'
import type IFileSystemHandler from '../../handlers/IFileSystemHandler';

type RenamePair = {
    kana: string,
    renamed: string
}

export class ReversionFile{
    private _originalRootName: string;
    public get originalRootName(): string {
        return this._originalRootName;
    }
    public set originalRootName(value: string) {
        this._originalRootName = value;
    }

    private _deleteCharacterTxt: boolean;
    public get deleteCharacterTxt(): boolean {
        return this._deleteCharacterTxt;
    }
    public set deleteCharacterTxt(value: boolean) {
        this._deleteCharacterTxt = value;
    }
    
    private _renames: Array<RenamePair>;
    public get renames(): Array<Readonly<RenamePair>> {
        return [...this._renames];
    }
    private set renames(value: Array<RenamePair>) {
        this._renames = value;
    }

    constructor(text: string|null){
        this.originalRootName = "";
        this.deleteCharacterTxt = false;
        this.renames = [];
        if(text === null) return;
        
        var reversion = JSON.parse(text);
        if(!isString(reversion["originalRootName"])) throw new Error("Incorrect original root name");
        this.originalRootName = reversion["originalRootName"];
        if(!isBoolean(reversion["deleteCharacterTxt"])) throw new Error("Incorrect delete field");
        this.deleteCharacterTxt = reversion["deleteCharacterTxt"];
        if(!isNumber(reversion["fileVersion"])) throw new Error("Incorrect version field");
        if(reversion["fileVersion"] > 1) throw new Error("This file is not compatible with this version of KanaSolver, please, update KanaSolver to use it");
        for(let i in reversion["renames"]){
            if(!isString(reversion["renames"][i]["kana"])) throw new Error(`Incorrect kana at index "${i}"`);
            if(!isString(reversion["renames"][i]["renamed"])) throw new Error(`Incorrect renamed at index "${i}"`);
            var toPush: RenamePair = {
                kana: reversion["renames"][i]["kana"],
                renamed: reversion["renames"][i]["renamed"]
            }
            this._renames.push(toPush);
        }
    }
    public addRename(kana: string, renamed: string){
        this._renames.push({
            kana: kana,
            renamed: renamed
        });
    }

    public async save(fileName: string, fsh: IFileSystemHandler){
        await fsh.saveTextFile(fileName, 'utf8', JSON.stringify({
            originalRootName: this.originalRootName,
            deleteCharacterTxt: this.deleteCharacterTxt,
            fileVersion: 1,
            renames: this.renames
        }, null, '\t'));
    }
}