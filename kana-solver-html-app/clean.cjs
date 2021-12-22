//This file is licensed under MIT license

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

(async () => {
    var filesOnDirectory = fs.readdirSync(path.join(process.cwd(), "dist/package.nw"), {withFileTypes: true});
    for(let i = 0; i < filesOnDirectory.length; i++){
        if(filesOnDirectory[i].name == 'node_modules') continue;
        if(filesOnDirectory[i].isDirectory()){
            await rimraf(path.join(process.cwd(), "dist/package.nw", filesOnDirectory[i].name));
        }
        if(filesOnDirectory[i].isFile()){
            fs.unlinkSync(path.join(process.cwd(), "dist/package.nw", filesOnDirectory[i].name));
        }
    }
    await rimraf(path.join(process.cwd(), "generatedCopySrc"));
    await rimraf(path.join(process.cwd(), "src/generated"));
})(); 