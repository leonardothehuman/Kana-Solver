//This file is licensed under MIT license

const Downloader = require('nodejs-file-downloader');
const yauzl = require("yauzl");
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const hasha = require('hasha');

module.exports = {
    drawProgressbar: function(progress){
        var progressString = " " + progress + "%";
        var drawindLength = process.stdout.columns - 2 - progressString.length;
        var progressBar = '[';
        var barLength = Math.round(parseFloat(progress) * drawindLength / 100);
        var emptyLength = drawindLength - barLength;
        for(let i = 0; i < barLength; i++){
            if(i+1 == barLength && parseFloat(progress) < 99.9){
                progressBar = progressBar + '>';
            }else{
                progressBar = progressBar + '=';
            }
        }
        for(let i = 0; i < emptyLength; i++){
            progressBar = progressBar + ' ';
        }
        progressBar = progressBar + ']';
        //process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(progressBar + progressString);
    },
    downloadFile: async function (toDownload, saveLocation, toSave, progressReport){
        var lastRemainingSize = 1;
        
        const downloader = new Downloader({     
            url: toDownload,     
            directory: saveLocation,
            fileName: toSave,
            maxAttempts: 3,
            cloneFiles:false,
            onProgress:function(percentage, chunk, remainingSize){
                progressReport(percentage);
                lastRemainingSize = remainingSize;
            }      
        });
        
        await downloader.download();
    
        if(lastRemainingSize == 0){
        }else{
            await fsp.unlink(path.join(saveLocation, toSave));
            throw new Error("Error on downloading the \""+toDownload+"\" file, the download was interrupted unexpectedly.");
        }
    },
    verifyHash: async function(toVerify, digestfile, digestEntry, outputDir){
        var hashFileContent = await fsp.readFile(digestfile, {encoding: 'utf8'});
        var hashArray = hashFileContent.split('\n');
        var hashs = {};
        hashArray.forEach((line) => {
            var value = line.split('  ');
            if(value.length < 2) return;
            hashs[value[1].trim()] = value[0].trim();
        });
        var zipHash = await hasha.fromFile(toVerify, {algorithm: 'sha256'});
        console.log(zipHash);
    
        if(zipHash == hashs[digestEntry]){
        }else{
            throw new Error("Error on sha256 verification, please delete all files on the \"" + outputDir + "\" directory and try again.");
        }
    },
    extractZip: function(fileToExtract, whereExtract){
        const promise = new Promise((resolve, reject) => { 
            var zipBase = null;
            yauzl.open(fileToExtract, {lazyEntries: true, decodeStrings: true, strictFileNames: false}, function(err, zipfile) {
                if (err) reject(err);
                zipfile.on("entry", async function(entry) {
                    if (/\/$/.test(entry.fileName)) { //Do nothing if it is a directory, we don't want empty directories
                        zipfile.readEntry();
                    } else {
                        var splitDir = entry.fileName.split('/');
                        var rootDir = splitDir[0];
                        if(splitDir.length < 2){ //Don't extract root files
                            zipfile.readEntry();
                            return;
                        }
                        //We only want to extract files from one directory on the root of the zip file
                        if(zipBase === null){
                            zipBase = rootDir;
                        }
                        if(zipBase != rootDir){
                            zipfile.readEntry();
                            return;
                        }
    
                        // file entry
                        await fsp.mkdir(path.join(whereExtract, path.posix.dirname(splitDir.slice(1).join('/'))),{recursive: true});
                        zipfile.openReadStream(entry, function(err, readStream) {
                            if (err) reject(err);
                            var ws = fs.createWriteStream(path.join(whereExtract, splitDir.slice(1).join('/')));
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
                    resolve();
                });
                zipfile.readEntry();
            });
        });
        return promise;
    }
}