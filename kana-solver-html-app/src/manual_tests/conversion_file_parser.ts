import {ConversionFile} from "../minilibs/parsers/conversion_file";
import iconv from 'iconv-lite';
import fs from "fs";

let character_txt = fs.readFileSync(process.argv[2], {encoding:'utf8', flag:'r'});

let characterTxt = new ConversionFile(character_txt);

