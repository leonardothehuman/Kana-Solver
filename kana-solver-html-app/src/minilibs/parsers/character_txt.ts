import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type IPathStringHandler from '../../handlers/IPathStringshandler';
import {php_explode, returnDefaultIfUndefined} from '../helpers'
import type { ConversionFile } from './conversion_file';
import type ITransformableParser from './ITransformableParser';

export class CharacterTxt implements ITransformableParser{
    private _rawFields: {
        optionFields: Record<string, string>,
        lineEntries: string[]
    };

    constructor(text: string){
        var entriesArray = text.split('\n');
        this._rawFields = {
            optionFields: {},
            lineEntries: []
        };
        entriesArray.forEach((line) => {
            var value = php_explode('=', line, 2);
            if(value === false) return;
            if(value.length < 2){
                this._rawFields.lineEntries.push(value[0].replace("\r", ""));
                return;
            }
            this._rawFields.optionFields[value[0].trim().toLowerCase()] = value[1].trim();
        });
    }

    public get name(): string|null{
        return returnDefaultIfUndefined(this._rawFields.optionFields["name"], null);
    }
    public set name(v: string){
        this._rawFields.optionFields["name"] = v;
    }
    public get image(): string|null{
        return returnDefaultIfUndefined(this._rawFields.optionFields["image"], null);
    }
    public get sample(): string|null{
        return returnDefaultIfUndefined(this._rawFields.optionFields["sample"], null);
    }
    public get textLines(): string[]{
        let toReturn = [];
        for(let i = 0; i < this._rawFields.lineEntries.length; i++){
            toReturn.push(this._rawFields.lineEntries[i]);
        }
        return toReturn;
    }
    public getField(field: string): string|null{
        return returnDefaultIfUndefined(this._rawFields.optionFields[field], null);
    }

    public get nonStandardFields(): Record<string, string>{
        let toReturn: Record<string, string> = {};
        let toIterate = Object.entries(this._rawFields.optionFields);
        for(let i = 0; i < toIterate.length;i++){
            if(toIterate[i][0] == "name") continue;
            if(toIterate[i][0] == "image") continue;
            if(toIterate[i][0] == "sample") continue;
            toReturn[toIterate[i][0]] = toIterate[i][1];
        }
        return toReturn;
    }
    
    public transformFileNames(rules: ConversionFile, psh: IPathStringHandler){
        console.log(JSON.parse(JSON.stringify(this._rawFields)));
        Object.entries(this._rawFields.optionFields).forEach((v) => {
            if(v[0] == "image") this._rawFields.optionFields["image"] = rules.generateReplacedFilePath(this.image, psh);
            if(v[0] == "sample") this._rawFields.optionFields["sample"] = rules.generateReplacedFilePath(this.sample, psh);
        });
    }

    public transformAlias(rules: ConversionFile, deduplicate: boolean, keepOriginal: boolean){};

    public async save(_path: string, fsh: IFileSystemHandler){
        let toSave: Array<string> = [];
        Object.entries(this._rawFields.optionFields).forEach((v) => {
            toSave.push(v[0] + '=' + v[1]);
        });
        for(let i = 0; i < this._rawFields.lineEntries.length; i++){
            toSave.push(this._rawFields.lineEntries[i]);
        }
        await fsh.saveTextFile(_path, "SHIFT_JIS", toSave.join('\r\n'));
    }
}