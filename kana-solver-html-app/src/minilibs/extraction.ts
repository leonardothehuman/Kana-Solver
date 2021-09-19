//This file is licensed under GNU GPL v3.0 only license

import yauzl from 'yauzl';
import iconv from 'iconv-lite';
import path from 'path';
import fsp from 'fs/promises';
import fs from 'fs';

export function readTextFile(zipFile: string, fileToRead: string){
    const promise = new Promise((resolve, reject) => { 
        yauzl.open(zipFile, {lazyEntries: true, decodeStrings: false, strictFileNames: false}, function(err, zipfile) {
            if (err){ reject(err); }
            zipfile.on("entry", async function(entry) {
                let entryPath = iconv.decode(entry.fileName, 'Shift_JIS');
                if (/\/$/.test(entryPath)) { //Do nothing if it is a directory, we don't want empty directories
                    zipfile.readEntry();
                } else {
                    if(path.posix.normalize(entryPath) == path.posix.normalize(fileToRead)){
                        var content: Buffer[] = [];
                        zipfile.openReadStream(entry, function(err, readStream) {
                        if (err){ reject(err); }
                        readStream.on("end", function() {
                            var buf = Buffer.concat(content);
                            resolve(iconv.decode(buf, 'Shift_JIS'));
                            zipfile.close();
                        });
                        readStream.on("error", function(e) {
                            reject(e);
                        });
                        readStream.on("data", function(d: Buffer){
                            content.push(d);
                        });
                    });
                    }else{
                        zipfile.readEntry();
                    }
                }
            });
            zipfile.on("error", function(e) {
                reject(e);
            });
            zipfile.once("end", function() {
                resolve('');
            });
            zipfile.readEntry();
        });
    });
    return promise;
}

export function extractUtau(
    zipFile: string,
    installDir: string,
    sourceZipDirectory: string,
    destinationOnInstallDir: string
){
    const outputDir = path.join(installDir, destinationOnInstallDir);
    const promise = new Promise((resolve, reject) => { 
        yauzl.open(zipFile, {lazyEntries: true, decodeStrings: false, strictFileNames: false}, function(err, zipfile) {
            if (err){ reject(err); }
            zipfile.on("entry", async function(entry) {
                let currentEntryPath = iconv.decode(entry.fileName, 'Shift_JIS');
                var sourceZipDirectoryAmmount = sourceZipDirectory.split('/').length;
                var currentEntryPathAsArray = currentEntryPath.split('/');
                var willSkip:boolean = false;
                var sourceFile = currentEntryPath;
                var destinationFile = path.join(outputDir, currentEntryPath);
                if(sourceZipDirectory == ''){
                    willSkip = false;
                }else{
                    if(currentEntryPathAsArray.length < sourceZipDirectoryAmmount + 1){
                        willSkip = true;
                    }else if(
                        path.posix.normalize(currentEntryPathAsArray.slice(0,sourceZipDirectoryAmmount).join('/')) !=
                        path.posix.normalize(sourceZipDirectory)
                    ){
                        willSkip = true;
                    }else{
                        //Normalize destination
                        destinationFile = path.join(
                            outputDir,
                            path.relative(sourceZipDirectory, currentEntryPath)
                        );
                        willSkip = false;
                    }
                }
                
                if(willSkip == true){
                    zipfile.readEntry();
                }else if (/\/$/.test(currentEntryPath)) { //Do nothing if it is a directory, we don't want empty directories
                    //await fsp.mkdir(path.join(_destination, entryPath),{recursive: true});
                    zipfile.readEntry();
                } else {
                    try {
                        await fsp.mkdir(path.dirname(destinationFile),{recursive: true});
                    } catch (error) {
                        console.log(error);
                    }
                    zipfile.openReadStream(entry, function(err, readStream) {
                        if (err){reject(err);}
                        var ws = fs.createWriteStream(destinationFile);
                        readStream.on("end", function() {
                            ws.end();
                            zipfile.readEntry();
                        });
                        readStream.on("error", function(e) {
                            ws.end();
                            reject(e);
                        });
                        ws.on("error", function(e) {
                            reject(e);
                        });
                        readStream.pipe(ws);
                    });
                }
            });
            zipfile.on("error", function(e) {
                reject(e);
            });
            zipfile.once("end", function() {
                resolve('');
            });
            zipfile.readEntry();
        });
    });
    return promise;
}