/*This file is licensed under GNU GPL v3.0 only license*/

import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type IPathStringHandler from '../../handlers/IPathStringshandler';
import {php_explode, returnDefaultIfUndefined} from '../helpers'
import type { ConversionFile } from './conversion_file';
import type ITransformableParser from './ITransformableParser';

type otoEntry = {
    wavFile: string,
    alias: string,
    otherParams: string,
    rawLine: string,
    complete: boolean
}

export class OtoIni implements ITransformableParser{
    private _otoEntries: otoEntry[];

    constructor(text: string){
        var entriesArray = text.split('\n');
        for(let i = 0; i < entriesArray.length; i++){
            if(entriesArray[i].charAt(entriesArray[i].length -1) == '\r'){
                entriesArray[i]=entriesArray[i].substr(0, entriesArray[i].length - 1);
            }
        }
        this._otoEntries = [];
        entriesArray.forEach((line) => {
            var currentOto: otoEntry = {
                wavFile: "",
                alias: "",
                otherParams: "",
                rawLine: line,
                complete: false
            }
            this._otoEntries.push(currentOto);

            var value = php_explode('=', line, 2);
            if(value === false) return;
            if(value.length < 2) return;

            var wavfile:string = value[0];
            var rightSide = value[1];

            var rs = php_explode(',', rightSide, 2);
            if(rs === false) return;
            if(rs.length < 2) return;

            var alias = rs[0];
            var other = rs[1];

            currentOto.wavFile = wavfile;
            currentOto.alias = alias;
            currentOto.otherParams = other;
            currentOto.complete = true;
        });
    }

    test(){
        console.log(this._otoEntries);
    }

    //ODOT: Alert if the line is not complete
    public transformFileNames(rules: ConversionFile, psh: IPathStringHandler){
        for(let i = 0; i < this._otoEntries.length; i++){
            let currentOto = this._otoEntries[i];
            if(currentOto.complete == false) continue;
            currentOto.wavFile = rules.generateReplacedFilePath(currentOto.wavFile, psh);
            currentOto.rawLine = currentOto.wavFile + "=" + currentOto.alias + ',' + currentOto.otherParams;
        }
    }
    
    public transformAlias(rules: ConversionFile, deduplicate: boolean, keepOriginal: boolean){
        var aliasCopy: otoEntry[] = [];
        for(let i = 0; i < this._otoEntries.length; i++){
            let currentOto = this._otoEntries[i];
            aliasCopy.push({
                wavFile: currentOto.wavFile,
                alias: currentOto.alias,
                otherParams: currentOto.otherParams,
                rawLine: currentOto.rawLine,
                complete: currentOto.complete
            });
            if(currentOto.complete == false) continue;
            currentOto.alias = rules.generateReplacedAlias(currentOto.alias, "all", deduplicate);
            currentOto.rawLine = currentOto.wavFile + "=" + currentOto.alias + ',' + currentOto.otherParams;
        }
        if(keepOriginal == true){
            for(let i = 0; i < aliasCopy.length; i++){
                let currentOto = aliasCopy[i];
                if(currentOto.complete == false) continue;
                currentOto.alias = rules.generateReplacedAlias(currentOto.alias, "edges", deduplicate);
                currentOto.rawLine = currentOto.wavFile + "=" + currentOto.alias + ',' + currentOto.otherParams;
            }
            this._otoEntries = [...this._otoEntries, ...aliasCopy];
        }
    };

    public truncateDecimals(){
        for(let i = 0; i < this._otoEntries.length; i++){
            let currentOto = this._otoEntries[i];
            if(currentOto.complete == false) continue;
            let toJoin: string[] = [];
            let otherParamsArray = currentOto.otherParams.split(",");
            for(let j = 0; j < otherParamsArray.length; j++){
                let splitOnDots = otherParamsArray[j].split(".");
                toJoin.push(splitOnDots[0]);
            }
            currentOto.otherParams = toJoin.join(",");
            currentOto.rawLine = currentOto.wavFile + "=" + currentOto.alias + ',' + currentOto.otherParams;
        }
    }

    public async save(_path: string, fsh: IFileSystemHandler){
        let toSave: Array<string> = [];
        for(let i = 0; i < this._otoEntries.length; i++){
            toSave.push(this._otoEntries[i].rawLine);
        }
        await fsh.saveTextFile(_path, "SHIFT_JIS", toSave.join('\r\n'));
    }
}