import {getUtauZipInfo} from "../minilibs/zipHandler";
import iconv from 'iconv-lite';
import fs from "fs";

(async() => {
    let info = await getUtauZipInfo(process.argv[2]);
    console.log(info);
})();

export {}