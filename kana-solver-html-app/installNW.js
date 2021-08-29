const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));

const {
    drawProgressbar, downloadFile,
    verifyHash, extractZip
} = require('./devInstallHelpers.js');

const outputDir = path.join(process.cwd(), "nwBinaries");
const distDir = path.join(process.cwd(), "dist");
const sha256file = "SHASUMS256.txt";
const sha256url = "https://dl.nwjs.io/v0.55.0/SHASUMS256.txt";

const downloadFileNames = {
    win64: "nwjs-v0.55.0-win-x64.zip",
    win32: "nwjs-v0.55.0-win-ia32.zip",
    win64sdk: "nwjs-sdk-v0.55.0-win-x64.zip",
    win32sdk: "nwjs-sdk-v0.55.0-win-ia32.zip"
}

function getCompleteDownloadLocation(flavor){
    return "https://dl.nwjs.io/v0.55.0/" + downloadFileNames[flavor];
}

const flavorArg = process.argv[2];

if(process.argv.length < 3 || flavorArg == "help" || downloadFileNames[flavorArg] === undefined){
    console.log("This script downloads and extracts the required NW binaries to build the software.");
    console.log("");
    console.log("Usage:");
    console.log("   npm run downloadNW -- <nw.js build flavor>");
    console.log("       Download and extract the selected flavor.");
    console.log("");
    console.log("   npm run downloadNW -- help");
    console.log("       Show script instructions.");
    console.log("");
    console.log("");
    var flavorArray = [];
    Object.entries(downloadFileNames).forEach(o => {
        flavorArray = [...flavorArray, o[0]];
    });
    if(process.argv.length >= 3 && flavorArg != "help" ){
        console.log("The flavor \"" + flavorArg + "\" is not available")
    }
    console.log("Available flavors: " + flavorArray.join(" | "));
}else{
    (async () => {
        let zipToDownload = downloadFileNames[flavorArg];

        //Download the specified flavor
        let urlToDownload = getCompleteDownloadLocation(flavorArg);
        console.log("Downloading \"" + urlToDownload + "\"");
        if(!fs.existsSync(path.join(outputDir, zipToDownload))){
            console.log("");
            await downloadFile(
                urlToDownload, outputDir, zipToDownload, drawProgressbar
            );
            console.log("");
            console.log("The file \"" + urlToDownload +"\"  has been successfully downloaded.");
            console.log("");
        }else{
            console.log("");
            console.log("The file \"" + zipToDownload + "\" already exists and will not be downloaded again.");
            console.log("");
        }

        //Download sha256 digest
        console.log("Downloading \"" + sha256url + "\"");
        if(!fs.existsSync(path.join(outputDir, sha256file))){
            console.log("");
            await downloadFile(
                sha256url, outputDir, sha256file, drawProgressbar
            );
            console.log("");
            console.log("The file \"" + sha256url +"\"  has been successfully downloaded.");
            console.log("");
        }else{
            console.log("");
            console.log("The file \"" + sha256file + "\" already exists and will not be downloaded again.");
            console.log("");
        }

        console.log("Checking sha256 hash...");
        await verifyHash(path.join(outputDir, zipToDownload), path.join(outputDir, sha256file), zipToDownload, outputDir);
        console.log("Sha256 successfully verified.");
        console.log("");

        console.log("Extracting \"" + zipToDownload + "\"...");
        await rimraf(distDir);
        await extractZip(path.join(outputDir, zipToDownload), distDir);
        console.log("\"" + zipToDownload + "\" successfully extracted.");
    })(); 
}