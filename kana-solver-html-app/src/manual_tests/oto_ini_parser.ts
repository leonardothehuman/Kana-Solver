import {OtoIni} from "../minilibs/parsers/oto_ini";
import iconv from 'iconv-lite';
import fs from "fs";

let oto_ini = fs.readFileSync(process.argv[2]);

let otoIni = new OtoIni(iconv.decode(oto_ini, "SHIFT_JIS"));

otoIni.test();