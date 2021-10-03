import {php_explode, returnDefaultIfUndefined} from '../helpers'

export class CharacterTxt{
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
            this._rawFields.optionFields[value[0].trim()] = value[1].trim();
        });
        // console.log(this._rawFields);
        //console.log(text);
    }

    public get name(): string|null{
        return returnDefaultIfUndefined(this._rawFields.optionFields["name"], null);
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
}