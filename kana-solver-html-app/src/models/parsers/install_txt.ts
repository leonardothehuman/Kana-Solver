//This file is licensed under GNU GPL v3.0 only license

import {php_explode} from '../modules/helpers'

export function parseInstallTxt(text:string){
    var entriesArray = text.split('\n');
    var params: {[key: string]: string} = {};
    entriesArray.forEach((line) => {
        var value = php_explode('=', line, 2);
        if(value === false) return;
        if(value.length < 2) return;
        params[value[0].trim()] = value[1].trim();
    });
    return params;
}