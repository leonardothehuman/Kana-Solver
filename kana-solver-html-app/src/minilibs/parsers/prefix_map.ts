import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type IPathStringHandler from '../../handlers/IPathStringshandler';
import {php_explode, returnDefaultIfUndefined} from '../helpers'
import type { ConversionFile } from './conversion_file';
import type ITransformableParser from './ITransformableParser';

type prefixEntry = {
    key: string,
    prefix: string,
    sufix: string,
    rawLine: string,
    complete: boolean
}

export class PrefixMap implements ITransformableParser{
    private _pfixEntries: prefixEntry[];
    constructor(text: string){
        var entriesArray = text.split('\n');
        for(let i = 0; i < entriesArray.length; i++){
            if(entriesArray[i].charAt(entriesArray[i].length -1) == '\r'){
                entriesArray[i]=entriesArray[i].substr(0, entriesArray[i].length - 1);
            }
        }
        this._pfixEntries = [];
        entriesArray.forEach((line) => {
            var currentPrefix: prefixEntry = {
                key: "",
                prefix: "",
                sufix: "",
                rawLine: line,
                complete: false
            }
            this._pfixEntries.push(currentPrefix);

            var value = php_explode('\t', line, 3);
            if(value === false) return;
            if(value.length < 3) return;

            currentPrefix.key = value[0];
            currentPrefix.prefix = value[1];
            currentPrefix.sufix = value[2];
            currentPrefix.complete = true;
        });
    }

    test(){
        console.log(this._pfixEntries);
    }

    //ODOT: Alert if the line is not complete
    public transformAlias(rules: ConversionFile, deduplicate: boolean, keepOriginal: boolean){
        for(let i = 0; i < this._pfixEntries.length; i++){
            let currentPFix = this._pfixEntries[i];
            if(currentPFix.complete == false) continue;
            currentPFix.prefix = rules.generateReplacedAlias(currentPFix.prefix, "prefix", deduplicate);
            currentPFix.sufix = rules.generateReplacedAlias(currentPFix.sufix, "suffix", deduplicate);
            currentPFix.rawLine = currentPFix.key + '\t' + currentPFix.prefix + '\t' + currentPFix.sufix;
        }
    };
    public transformFileNames(rules: ConversionFile, psh: IPathStringHandler){}

    public async save(_path: string, fsh: IFileSystemHandler){
        let toSave: Array<string> = [];
        for(let i = 0; i < this._pfixEntries.length; i++){
            toSave.push(this._pfixEntries[i].rawLine);
        }
        await fsh.saveTextFile(_path, "SHIFT_JIS", toSave.join('\r\n'));
    }
}