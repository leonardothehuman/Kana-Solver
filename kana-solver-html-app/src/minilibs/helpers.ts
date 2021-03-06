//This file is licensed under MIT license

export function isArrayOfAdditionalInfoAray(s:any){
  try {
    if(!Array.isArray(s)) return false;
    for(let i = 0; i < s.length; i++){
      if(isArrayOfNestedStringWithMinimumLengthOfTwoAndTheFirstItemMustBeAString(s[i])) continue;
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function isArrayOfNestedStringWithMinimumLengthOfTwoAndTheFirstItemMustBeAString(s:any){
  try {
    if(!Array.isArray(s)) return false;
    if(s.length < 2) return false;
    for(let i = 0; i < s.length; i++){
      if(isString(s[i])) continue;
      if(i != 0 && isArrayOfNestedStringWithMinimumLengthOfTwoAndTheFirstItemMustBeAString(s[i])) continue;
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function isString(s: any): s is string{
  if (typeof s === 'string' || s instanceof String) return true;
  return false;
}

export function isNumber(s: any):s is number{
  if (typeof s === 'number' || s instanceof Number) return true;
  return false;
}

export function isBoolean(s: any):s is boolean{
  if(typeof s === 'boolean' || s instanceof Boolean) return true;
  return false;
}

export function isNumeric(val: string) {
  return /^-?\d+$/.test(val);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function htmlEntities(str: string) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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