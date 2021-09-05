const fs = require('fs');
const path = require('path');

//Generate "src/generated/config.ts" and "src/generated/config.less" from mainAppConfig.js
const mainAppConfig = require("./generatorData/mainAppConfig");
var toSave = "";
toSave += `export const masterRoute: string = "${mainAppConfig.masterRoute}";\n` //Home page
toSave += `export const mainDetailPage: string = "${mainAppConfig.mainDetailPage}";\n` //Prefered detail page when we don't have what to show
toSave += `export const masterDetailBreakpoint:number = ${mainAppConfig.masterDetailBreakpoint};` //Where we will enable master/detail view
fs.mkdirSync(path.join(process.cwd(), "src/generated/config"), {recursive:true});
fs.writeFileSync(path.join(process.cwd(), "src/generated/config/config.ts"), toSave);

toSave = "";
toSave += `@masterDetailBreakpoint: ${mainAppConfig.masterDetailBreakpoint}px;`;
fs.writeFileSync(path.join(process.cwd(), "src/generated/config/config.less"), toSave);

//Generate nw's package.json

var projectPackageJSON = JSON.parse(
    fs.readFileSync(
        path.join(process.cwd(), "generatorData/package.json")
    )
);
var dependencySource = JSON.parse(
    fs.readFileSync(
        path.join(process.cwd(), "package.json")
    )
);

fs.mkdirSync(path.join(process.cwd(), "generatedCopySrc"), {recursive:true});
projectPackageJSON["dependencies"] = dependencySource.dependencies;
fs.writeFileSync(
    path.join(process.cwd(), "generatedCopySrc/package.json"),
    JSON.stringify(projectPackageJSON, null, 2)
);