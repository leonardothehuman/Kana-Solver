import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import {php_explode, isNumeric, isNumber} from '../helpers'
import type { ConversionFile } from './conversion_file';

class UstEntry{
    private _key: string;
    public get key(): string {
        return this._key;
    }
    private _keyIsNumber: boolean;
    public get keyIsNumber(): boolean {
        return this._keyIsNumber;
    }
    private _records: [string, string, boolean][];
    constructor(key: string, lines: string[]){
        this._records = [];
        this._key = key;
        this._keyIsNumber = isNumeric(key.substr(1))
        for(let i = 0; i < lines.length; i++){
            let currentLine = php_explode("=", lines[i], 2);
            if(currentLine == false) continue;
            if(currentLine.length < 2){
                this._records.push([currentLine[0], "", false]);
            }else{
                if(currentLine[0].toUpperCase() == "LYRIC"){
                    currentLine[0] = "Lyric";
                }
                this._records.push([currentLine[0], currentLine[1], true]);
            }
        }
    }
    public get lyric(): string|null{
        for(let i = 0; i < this._records.length; i++){
            if(this._records[i][0] == "Lyric"){
                return this._records[i][1];
            }
        }
        return null;
    }
    public set lyric(l:string){
        for(let i = 0; i < this._records.length; i++){
            if(this._records[i][0] == "Lyric"){
                this._records[i] = ["Lyric", l, true];
            }
        }
    }
    public get lines(): string[]{
        let toReturn:string[] = [];
        toReturn.push('['+this.key+']');
        for(let i = 0; i < this._records.length; i++){
            let currentRecord = this._records[i];
            if(currentRecord[2] == false){
                toReturn.push(currentRecord[0]);
            }else{
                toReturn.push(currentRecord[0] + '=' + currentRecord[1]);
            }
        }
        return toReturn;
    }
}

export class Ust{
    private _allEntries: UstEntry[];
    private _preFirstEntry: string[];
    constructor(text: string){
        this._allEntries = [];
        this._preFirstEntry = [];
        var entriesArray = text.split('\n');
        for(let i = 0; i < entriesArray.length; i++){
            if(entriesArray[i].charAt(entriesArray[i].length -1) == '\r'){
                entriesArray[i]=entriesArray[i].substr(0, entriesArray[i].length - 1);
            }
        }

        let firstEntryAt = 0;
        for(let i = 0; i < entriesArray.length; i++){
            if(this.isKey(entriesArray[i])){
                firstEntryAt = i;
                break;
            }
            this._preFirstEntry.push(entriesArray[i]);
        }
        
        let currentLines: string[] = [];
        var isFirst:boolean = true;
        for(let i = firstEntryAt; i < entriesArray.length + 1; i++){
            let currentEntry = "[a]";
            if(i < entriesArray.length){
                currentEntry = entriesArray[i];
            }
            if(this.isKey(currentEntry) == true && isFirst == false){
                this._allEntries.push(this.createUstEntryFromArray(currentLines));
                currentLines = [];
            }
            isFirst = false;
            currentLines.push(currentEntry);
        }
    }
    private createUstEntryFromArray(l: string[]): UstEntry{
        if(!this.isKey(l[0])) throw new Error("The first line must be a key to create an UST object");
        return new UstEntry(this.extractKeyString(l[0]), l.slice(1));
    }
    private extractKeyString(k: string){
        if(!this.isKey(k)) throw new Error("The first line must be a key to create an UST object");
        return k.substring(1, k.length - 1);
    }
    private isKey(t: string): boolean{
        t = t.trim();
        if(t.charAt(0) == '[' && t.charAt(t.length - 1) == "]") return true;
        return false;
    }
    public kanaToRomaji(rules: ConversionFile){
        for(let i = 0; i < this._allEntries.length; i++){
            let currententry = this._allEntries[i];
            if(currententry.keyIsNumber == false) continue;
            if(currententry.lyric == 'R') continue;
            currententry.lyric = rules.generateReplacedAlias(currententry.lyric, "center", false);
        }
    }
    public romajiToKana(rules: ConversionFile){
        for(let i = 0; i < this._allEntries.length; i++){
            let currententry = this._allEntries[i];
            if(currententry.keyIsNumber == false) continue;
            if(currententry.lyric == 'R') continue;
            currententry.lyric = rules.generateReplacedStringReverse(currententry.lyric);
        }
    }
    private extractRomajiVowel(t: string): string{
        let lastChar = t.charAt(t.length - 1);
        if(lastChar.toUpperCase() == 'A') return 'a';
        if(lastChar.toUpperCase() == 'I') return 'i';
        if(lastChar.toUpperCase() == 'U') return 'u';
        if(lastChar.toUpperCase() == 'E') return 'e';
        if(lastChar.toUpperCase() == 'O') return 'o';
        return '-';
    }
    public addRomajiVCV(){
        let lastVowel = "-"
        for(let i = 0; i < this._allEntries.length; i++){
            let currententry = this._allEntries[i];
            if(currententry.keyIsNumber == false) continue;
            if(currententry.lyric == 'R'){
                lastVowel = '-';
                continue;
            }
            currententry.lyric = lastVowel + " " + currententry.lyric;
            lastVowel = this.extractRomajiVowel(currententry.lyric);
        }
    }
    public addKanaVCV(rules: ConversionFile){
        let lastVowel = "-"
        for(let i = 0; i < this._allEntries.length; i++){
            let currententry = this._allEntries[i];
            if(currententry.keyIsNumber == false) continue;
            if(currententry.lyric == 'R'){
                lastVowel = '-';
                continue;
            }
            let lastLyric = currententry.lyric;
            currententry.lyric = lastVowel + " " + currententry.lyric;
            lastVowel = this.extractRomajiVowel(
                rules.generateReplacedAlias(lastLyric, "center", false)
            );
        }
    }
    public forceCV(){
        for(let i = 0; i < this._allEntries.length; i++){
            let currententry = this._allEntries[i];
            if(currententry.keyIsNumber == false) continue;
            if(currententry.lyric == 'R') continue;

            let explodedEntry = currententry.lyric.split(" ");
            currententry.lyric = explodedEntry[explodedEntry.length - 1];
        }
    }
    public async save(_path: string, fsh: IFileSystemHandler){
        let toSave = [...this._preFirstEntry];
        for(let i = 0; i < this._allEntries.length; i++){
            toSave.push(...this._allEntries[i].lines);
        }
        let toSaveS = toSave.join('\r\n')+'\r\n';
        await fsh.saveTextFile(_path, "SHIFT_JIS", toSaveS);
    }
}