//This file is licensed under MIT license

import FileSystemHandler from "../handlers/FileSystemHandler";
import PathStringHandler from '../handlers/PathStringsHandler';
import iconv from 'iconv-lite';
import fs from "fs";

let psh = new FileSystemHandler(new PathStringHandler());

(async function(){
    console.log(
        JSON.stringify(
            await psh.getAllFilesOnDirectoryRecursive(process.argv[2]),
            null,
            4
        )
    );
})();

export {}