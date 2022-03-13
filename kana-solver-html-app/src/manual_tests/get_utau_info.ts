/*This file is licensed under GNU GPL v3.0 only license*/

import ZipHandler from "../handlers/ZipHandler";
import PathStringHandler from "../handlers/PathStringsHandler";
import iconv from 'iconv-lite';
import fs from "fs";

let zipHandler = new ZipHandler(new PathStringHandler);

(async() => {
    let info = await zipHandler.getUtauZipInfo(process.argv[2]);
    console.log(info);
})();

export {}