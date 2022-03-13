/*This file is licensed under GNU GPL v3.0 only license*/

import { CharacterTxt } from "../minilibs/parsers/character_txt";
import type IFileSystemHandler from "./IFileSystemHandler";
import type { IInstalledUtau } from "./IInstalledUtauHandler";
import type IInstalledUtauHandler from "./IInstalledUtauHandler";
import type IPathStringHandler from "./IPathStringshandler";

type UtauOptionsConstructor = {
    completeRootPath: string,
    characterTxt: CharacterTxt|null,
    name: string,
    directoryName: string
}

export class InstalledUtau implements IInstalledUtau{
    private _completeRootPath: string;
    public get completeRootPath(): string {
        return this._completeRootPath;
    }
    private set completeRootPath(value: string) {
        this._completeRootPath = value;
    }

    private _directoryName: string;
    public get directoryName(): string {
        return this._directoryName;
    }
    private set directoryName(value: string) {
        this._directoryName = value;
    }

    private _characterTxt: CharacterTxt | null;
    public get characterTxt(): CharacterTxt | null {
        return this._characterTxt;
    }
    private set characterTxt(value: CharacterTxt | null) {
        this._characterTxt = value;
    }

    private _name: string;
    public get name(): string {
        return this._name;
    }
    private set name(value: string) {
        this._name = value;
    }

    private _uninstalled: boolean;
    public get uninstalled(): boolean {
        return this._uninstalled;
    }
    private set uninstalled(value: boolean) {
        this._uninstalled = value;
    }

    private _isConverted: boolean;
    public get isConverted(): boolean {
        return this._isConverted;
    }
    private set isConverted(value: boolean) {
        this._isConverted = value;
    }

    private psh: IPathStringHandler;
    private fsh: IFileSystemHandler;

    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler, options: UtauOptionsConstructor){
        this.psh = psh;
        this.fsh = fsh;
        this.completeRootPath = options.completeRootPath;
        this.directoryName = options.directoryName;
        this.characterTxt = options.characterTxt;
        this.name = options.name;
        this.uninstalled = false;
    }

    public get description(): string[]{
        if(this.characterTxt == null) return [];
        return this.characterTxt.textLines;
    }
    public get nonStandardFields(): [string, string][]{
        if(this.characterTxt == null) return [];
        return Object.entries(this.characterTxt.nonStandardFields);
    }
    public get imageUri(): string{
        if(this.characterTxt == null) return "";
        if(this.characterTxt.image == null) return "";
        return "file://"+ this.psh.posixJoinPath(
            this.completeRootPath, this.psh.zipNormalize(this.characterTxt.image)
        );
    }
    public get sampleUri(): string{
        if(this.characterTxt == null) return "";
        if(this.characterTxt.sample == null) return "";
        return "file://"+ this.psh.posixJoinPath(
            this.completeRootPath, this.psh.zipNormalize(this.characterTxt.sample)
        );
    }
    public async uninstallUtau(): Promise<void>{
        if(this.uninstalled == true) throw new Error("This UTAU has already been uninstalled");
        this.uninstalled = true;
        if(this.completeRootPath == null) return;
        if(this.completeRootPath == "") return;
        await this.fsh.recursiveDelete(this.completeRootPath);
    }
    public async init(): Promise<void>{
        this.isConverted = await this.fsh.existAndIsDirectory(
            this.psh.joinPath(this.completeRootPath, '.rollback')
        )
    }
}

export default class InstalledUtauHandler implements IInstalledUtauHandler{
    private fsh: IFileSystemHandler;
    private psh: IPathStringHandler;
    constructor(_fsh: IFileSystemHandler, _psh: IPathStringHandler){
        this.fsh = _fsh;
        this.psh = _psh;
    }
    public async getUtauListFromDirectory(directory: string): Promise<IInstalledUtau[]>{
        let filesOnVoiceDirectory = await this.fsh.getAllFilesOnDirectory(directory);
        let directoriesOnVoiceDirectory = filesOnVoiceDirectory.filter((v) => {
            return v.isDirectory;
        });
        let utauList: IInstalledUtau[] = [];
        for(let i = 0; i < directoriesOnVoiceDirectory.length; i++){
            let currentCharacterTxt: CharacterTxt|null = null;
            if(
                await this.fsh.existAndIsFile(
                    this.psh.joinPath(directoriesOnVoiceDirectory[i].completePath, "character.txt")
                )
            ){
                let ctxt = await this.fsh.readTextFile(
                    this.psh.joinPath(directoriesOnVoiceDirectory[i].completePath, "character.txt"),
                    "SHIFT_JIS"
                )
                currentCharacterTxt = new CharacterTxt(ctxt);
            }
            let toPush: UtauOptionsConstructor = {
                completeRootPath: directoriesOnVoiceDirectory[i].completePath,
                characterTxt: currentCharacterTxt,
                name: this.psh.extractFileName(directoriesOnVoiceDirectory[i].completePath, ""),
                directoryName: this.psh.extractFileName(directoriesOnVoiceDirectory[i].completePath, "")
            };
            if(toPush.characterTxt !== null && toPush.characterTxt.name != null){
                toPush.name = toPush.characterTxt.name;
            }
            let toPush2 = new InstalledUtau(this.psh, this.fsh, toPush);
            await toPush2.init();
            utauList.push(toPush2);
        }
        return utauList;
    }
}