//This file is licensed under GNU GPL v3.0 only license

import {php_explode, returnDefaultIfUndefined} from '../helpers'

export type ParsedInstallTxtObject = {
    type: string,
    folder: string,
    contentsdir: string,
    description: string,
    [key: string]: string
}

export class InstallTxt{
    private _parsedData: ParsedInstallTxtObject;
    public get parsedData(): ParsedInstallTxtObject {
        let toReturn: ParsedInstallTxtObject = {
            type: this._parsedData["type"],
            folder: this._parsedData["folder"],
            contentsdir: this._parsedData["contentsdir"],
            description: this._parsedData["description"],
        }
        for(let i in this._parsedData){
            if(i == "type") continue;
            if(i == "folder") continue;
            if(i == "contentsdir") continue;
            if(i == "description") continue;
            toReturn[i] = this._parsedData[i];
        }
        return toReturn;
    }
    public get type(): string{
        return this._parsedData.type;
    }
    public get folder(): string{
        return this._parsedData.folder;
    }
    public get contentsdir(): string{
        return this._parsedData.contentsdir;
    }
    public get description(): string{
        return this._parsedData.description;
    }
    private _rawFields: { [key: string]: string; };
    public get rawFields(): { [key: string]: string; } {
        let toReturn: { [key: string]: string; } = {};
        for(let i in this._rawFields){
            toReturn[i] = this._rawFields[i];
        }
        return toReturn;
    }
    constructor(text: string){
        var entriesArray = text.split('\n');
        this._rawFields = {};
        entriesArray.forEach((line) => {
            var value = php_explode('=', line, 2);
            if(value === false) return;
            if(value.length < 2) return;
            this._rawFields[value[0].trim()] = value[1].trim();
        });
        let lowercased: { [key: string]: string; } = {};
        for(let i in this._rawFields){
            lowercased[i.toLowerCase()] = this._rawFields[i];
        }
        this._parsedData = {
            type: returnDefaultIfUndefined(lowercased["type"], "voiceset"),
            folder: returnDefaultIfUndefined(lowercased["folder"], "/"),
            contentsdir: returnDefaultIfUndefined(lowercased["contentsdir"], "/"),
            description: returnDefaultIfUndefined(lowercased["description"], ""),
        };
        for(let i in this._rawFields){
            if(i == "type") continue;
            if(i == "folder") continue;
            if(i == "contentsdir") continue;
            if(i == "description") continue;
            this._parsedData[i.toLowerCase()] = this._rawFields[i];
        }
    }
}