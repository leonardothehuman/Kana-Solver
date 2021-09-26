//This file is licensed under GNU GPL v3.0 only license

import yauzl from 'yauzl';
import type {ZipFile} from 'yauzl';
import iconv from 'iconv-lite';
import path from 'path';
import fsp from 'fs/promises';
import fs from 'fs';
import {InstallTxt} from './parsers/install_txt';
import {normalizeSlash, zipNormalize} from "../minilibs/helpers";
import type { UtauZipInfo, ZipExtractProgressCallback } from '../presenters/extractDetailsPresenter';

export async function getUtauZipInfo(zipFile: string): Promise<UtauZipInfo>{
    let installTxt: null|string = null;
    await exploreZipFile(zipFile, (entry: any, decodedPath: string, isDirectory: boolean, z: ZipFile) => {
        return new Promise<boolean>((resolve, reject) => { 
            if(isDirectory == true){
                resolve(true);
            }else if(path.posix.normalize(decodedPath) == "install.txt"){
                var content: Buffer[] = [];
                z.openReadStream(entry, function(err, readStream) {
                    if (err){
                        reject(err);
                    }
                    readStream.on("end", function() {
                        var buf = Buffer.concat(content);
                        installTxt = iconv.decode(buf, 'Shift_JIS');
                        resolve(false);
                    });
                    readStream.on("error", function(e) {
                        reject(e);
                    });
                    readStream.on("data", function(d: Buffer){
                        content.push(d);
                    });
                });
            }else{
                resolve(true);
            }
        });
    });

    var toReturn:UtauZipInfo = {
        installTxt: null,
        sourceOnZip: "",
        relativeDestination: ""
    }

    if(installTxt !== null){
        toReturn.installTxt = new InstallTxt(installTxt);
        toReturn.sourceOnZip = zipNormalize(toReturn.installTxt.contentsdir);
        toReturn.relativeDestination = zipNormalize(toReturn.installTxt.folder);
    }

    if(toReturn.relativeDestination.trim() == ""){
        toReturn.relativeDestination = zipNormalize(path.win32.basename(zipFile, path.win32.extname(zipFile)));
    }

    return toReturn;
}

export async function extractUtau(
    zipFile: string,
    installDir: string,
    sourceZipDirectory: string,//normalized
    destinationOnInstallDir: string,//normalized
    progressCallback: ZipExtractProgressCallback,
    failIfFileExists: boolean
){
    const outputDir = path.join(installDir, destinationOnInstallDir);
    await exploreZipFile(zipFile, (entry: any, decodedPath: string, isDirectory: boolean, z: ZipFile) => {
        const promise = new Promise<boolean>((resolve, reject) => {
            var sourceZipDirectoryAmmount = sourceZipDirectory.split('/').length;
            var sourceFile = zipNormalize(decodedPath);
            var currentEntryPathAsArray = sourceFile.split('/');
            var willSkip:boolean = false;
            var destinationFile = path.join(outputDir, sourceFile);

            if(sourceZipDirectory == ''){
                willSkip = false;
            }else{
                if(currentEntryPathAsArray.length < sourceZipDirectoryAmmount + 1){
                    willSkip = true;
                }else if(
                    currentEntryPathAsArray.slice(0,sourceZipDirectoryAmmount).join('/') !=
                    sourceZipDirectory
                ){
                    willSkip = true;
                }else{
                    destinationFile = path.join(
                        outputDir,
                        path.relative(sourceZipDirectory, sourceFile)
                    );
                    willSkip = false;
                }
            }
            progressCallback({
                totalEntries: z.entryCount,
                currentEntry: z.entriesRead,
                currentFileName: path.posix.basename(sourceFile),
                currentZipPath: sourceFile
            });
            if(willSkip == true){
                resolve(true);
            }else if(isDirectory == true){
                //resolve(true);
                fsp.mkdir(destinationFile,{recursive: true}).then(() => {
                    resolve(true);
                }).catch((e) => {
                    reject(e);
                });
            }else{
                //resolve(true);
                (async() => {
                    try {
                        await fsp.mkdir(path.dirname(destinationFile),{recursive: true});
                    } catch (error) {
                        reject(error);
                    }
                    z.openReadStream(entry, function(err, readStream) {
                        if (err){reject(err);}
                        var flag = "w";
                        if(failIfFileExists) flag = "wx";
                        var ws = fs.createWriteStream(destinationFile,{
                            flags: flag
                        });
                        readStream.on("end", function() {
                            ws.end();
                            resolve(true);
                        });
                        //TODO: verify crc32
                        //TODO: Allow chosing encoding
                        readStream.on("error", function(e) {
                            ws.end();
                            reject(e);
                        });
                        ws.on("error", function(e) {
                            reject(e);
                        });
                        readStream.pipe(ws);
                    });
                })();
            }
        });
        return promise;
    });
}

type ExploreZipCallback = (entry: any, decodedPath: string, isDirectory: boolean, zipFile: ZipFile) => Promise<boolean>
function exploreZipFile(zipFile: string, cb:ExploreZipCallback): Promise<string>{
    const promise = new Promise<string>((resolve, reject) => { 
        const zipOptions = {
            lazyEntries: true, 
            decodeStrings: false, 
            strictFileNames: false
        }

        yauzl.open(zipFile, zipOptions, function(err, zipfile) {
            if (err){ reject(err); }
            zipfile.on("entry", async function(entry) {
                try {
                    let decodedPath = normalizeSlash(iconv.decode(entry.fileName, 'Shift_JIS'));
                    let isDirectory = false;
                    if (/\/$/.test(decodedPath)){
                        isDirectory = true;
                    }
                    if(await cb(entry, decodedPath, isDirectory, zipfile)){
                        zipfile.readEntry();
                    }else{
                        zipfile.close();
                        resolve('');
                    }
                } catch (error) {
                    reject(error);
                }
            });
            zipfile.on("error", function(e) {
                reject(e);
            });
            zipfile.once("end", function() {
                zipfile.close();
                resolve('');
            });
            zipfile.readEntry();
        });
    });
    return promise;
}