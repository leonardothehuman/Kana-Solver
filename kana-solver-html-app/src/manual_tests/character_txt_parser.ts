import {CharacterTxt} from "../minilibs/parsers/character_txt";
import iconv from 'iconv-lite';
import fs from "fs";

let character_txt = fs.readFileSync(process.argv[2]);

let characterTxt = new CharacterTxt(iconv.decode(character_txt, "SHIFT_JIS"));

console.log(characterTxt.name);
console.log(characterTxt.image);
console.log(characterTxt.sample);
console.log(characterTxt.textLines);
console.log(characterTxt.getField("name"));