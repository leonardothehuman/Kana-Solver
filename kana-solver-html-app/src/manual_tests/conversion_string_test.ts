import {ConversionFile} from "../minilibs/parsers/conversion_file";
import iconv from 'iconv-lite';
import fs from "fs";

let conversion_file = fs.readFileSync(process.argv[2]);

let conversionFile = new ConversionFile(iconv.decode(conversion_file, "SHIFT_JIS"));

// console.log(installTxt.rawFields);
// console.log(installTxt.parsedData);

// console.log("contentsdir: ", installTxt.contentsdir);
// console.log("description: ", installTxt.description);
// console.log("folder: ", installTxt.folder);
// console.log("type: ", installTxt.type);

// console.log(process.argv);

console.log(conversionFile.generateReplacedString("cabdadbabuaciacabactl"));

export {}