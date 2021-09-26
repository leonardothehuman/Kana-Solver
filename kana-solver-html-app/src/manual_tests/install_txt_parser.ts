import {InstallTxt} from "../minilibs/parsers/install_txt";
import iconv from 'iconv-lite';
import fs from "fs";

let install_txt = fs.readFileSync(process.argv[2]);

let installTxt = new InstallTxt(iconv.decode(install_txt, "SHIFT_JIS"));

console.log(installTxt.rawFields);
console.log(installTxt.parsedData);

console.log("contentsdir: ", installTxt.contentsdir);
console.log("description: ", installTxt.description);
console.log("folder: ", installTxt.folder);
console.log("type: ", installTxt.type);

// console.log(process.argv);

export {}