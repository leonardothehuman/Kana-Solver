//This file is licensed under MIT license
import path from 'path';

export function normalizeSlash(t: string): string{
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

export function zipNormalize(t: string): string{
  let normalizedSlashes:string = normalizeSlash(t);
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

export function returnDefaultIfUndefined<T>(test: T|undefined, def: T){
  let toReturn: T;
  if(test !== undefined)
    toReturn = test;
  else
    toReturn = def;
  return toReturn;
}

export function php_explode(delimiter: string | boolean, string: string, limit: number): false | string[] {
    //  discuss at: https://locutus.io/php/explode/
    // original by: Kevin van Zonneveld (https://kvz.io)
    //   example 1: explode(' ', 'Kevin van Zonneveld')
    //   returns 1: [ 'Kevin', 'van', 'Zonneveld' ]
    if (arguments.length < 2 ||
      typeof delimiter === 'undefined' ||
      typeof string === 'undefined') {
      return null
    }
    if (delimiter === '' ||
      delimiter === false ||
      delimiter === null) {
      return false
    }
    if (typeof delimiter === 'function' ||
      typeof delimiter === 'object' ||
      typeof string === 'function' ||
      typeof string === 'object') {
      return false;
    }
    if (delimiter === true) {
      delimiter = '1'
    }
    // Here we go...
    delimiter += ''
    string += ''
    const s = string.split(delimiter)
    if (typeof limit === 'undefined') return s
    // Support for limit
    if (limit === 0) limit = 1
    // Positive limit
    if (limit > 0) {
      if (limit >= s.length) {
        return s
      }
      return s
        .slice(0, limit - 1)
        .concat([s.slice(limit - 1)
          .join(delimiter)
        ])
    }
    // Negative limit
    if (-limit >= s.length) {
      return []
    }
    s.splice(s.length + limit)
    return s
}