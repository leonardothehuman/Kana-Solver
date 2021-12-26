import {php_explode, returnDefaultIfUndefined} from '../helpers';
import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type {nestedObjectRepresentation, objectRepresentation} from '../../handlers/IFileSystemHandler';
import {CharacterTxt} from './character_txt';
import {InstallTxt} from './install_txt';
import {OtoIni} from './oto_ini';
import {PrefixMap} from './prefix_map';
import type { ChangedAliasInfo, ConversionFile } from './conversion_file';
import type IPathStringHandler from '../../handlers/IPathStringshandler';
import { ReversionFile } from './ReversionFile';
import type ITransformableParser from './ITransformableParser';

type toTransformCollection<T extends ITransformableParser> = Array<{
    file: objectRepresentation,
    obj: T
}>

export type conversionOptions = {
    newUtauName: string,
    renameAliases: boolean,
    renameFiles: boolean,
    deduplicateAlias: boolean,
    truncateDecimals: boolean
}

//TODO: move this class to installedUtauHandler and remove this class
export class UtauRelevantContent{
    private renamableBlobs: nestedObjectRepresentation[];
    private characterTxts: toTransformCollection<CharacterTxt>;
    private installTxts: toTransformCollection<InstallTxt>;
    private otoInis: toTransformCollection<OtoIni>;
    private prefixMaps: toTransformCollection<PrefixMap>;

    private fsh: IFileSystemHandler;
    private psh: IPathStringHandler;
    private path: string;
    constructor(_fsh: IFileSystemHandler, _psh: IPathStringHandler, _path: string){
        this.fsh = _fsh;
        this.psh = _psh;
        this.path = _path;
        this.renamableBlobs = [];
        this.characterTxts = [];
        this.installTxts = [];
        this.otoInis = [];
        this.prefixMaps = [];
    }

    public async init(){
        this.renamableBlobs = await this.fsh.getAllFilesOnDirectoryRecursive(this.path);
        await this.findAllOtoIni(this.renamableBlobs);
        await this.findAllPrefixMap(this.renamableBlobs);
        await this.findAllInstallTxt(this.renamableBlobs);
        await this.findAllCharacterTxt(this.renamableBlobs);
    }
    private async generateFiller<T extends ITransformableParser>(
        o: nestedObjectRepresentation[],
        _fileName: string,
        toPush: toTransformCollection<T>,
        pushGenerator: (p: string) => T
    ){
        var fileName = _fileName.toUpperCase();
        for(let i = 0; i < o.length; i++){
            if(o[i].isDirectory){
                await this.generateFiller(o[i].subObjects, _fileName, toPush, pushGenerator);
            }else if(o[i].name.toUpperCase() == fileName){
                let tfile = await this.fsh.readTextFile(o[i].completePath, "SHIFT_JIS");
                toPush.push({
                    file: o[i],
                    obj: pushGenerator(tfile)
                });
            }
        }
    }
    private async findAllOtoIni(o: nestedObjectRepresentation[]){
        await this.generateFiller(o, "OTO.INI", this.otoInis, (p: string) => {
            return new OtoIni(p)
        });
    }
    private async findAllPrefixMap(o: nestedObjectRepresentation[]){
        await this.generateFiller(o, "PREFIX.MAP", this.prefixMaps, (p: string) => {
            return new PrefixMap(p)
        });
    }
    private async findAllInstallTxt(o: nestedObjectRepresentation[]){
        await this.generateFiller(o, "INSTALL.TXT", this.installTxts, (p: string) => {
            return new InstallTxt(p)
        });
    }
    private async findAllCharacterTxt(o: nestedObjectRepresentation[]){
        await this.generateFiller(o, "CHARACTER.TXT", this.characterTxts, (p: string) => {
            return new CharacterTxt(p)
        });
    }

    public test(){
        console.log(this.otoInis);
        console.log(this.prefixMaps);
        console.log(this.installTxts);
        console.log(this.characterTxts);
    }

    private async backupTransformCollection<T extends ITransformableParser>(bk: toTransformCollection<T>, backupDestination: string){
        for(let i = 0; i < bk.length; i++){
            //console.log(this.psh.getRelativePath(this.path, bk[i].file.completePath));
            let relativeDestination = this.psh.getRelativePath(
                this.path,
                this.psh.goToParentDirectory(bk[i].file.completePath)
            );
            
            await this.fsh.createDirectory(
                this.psh.joinPath(backupDestination, relativeDestination)
            );

            await this.fsh.copyFile(
                bk[i].file.completePath,
                this.psh.joinPath(
                    backupDestination, relativeDestination, bk[i].file.name
                )
            );
        }
    }

    public async transformFiles<T extends ITransformableParser>(
        toTransform: toTransformCollection<T>, rules: ConversionFile, options: conversionOptions
    ){
        for(let i = 0; i < toTransform.length; i++){
            if(options.renameFiles)
                toTransform[i].obj.transformFileNames(rules, this.psh);
            if(options.renameAliases)
                toTransform[i].obj.transformAlias(rules, options.deduplicateAlias);

            await toTransform[i].obj.save(
                toTransform[i].file.completePath,
                this.fsh
            );
        }
    }

    public async convertUtau(rules: ConversionFile, rootName: string, options: conversionOptions): Promise<Record<string, ChangedAliasInfo>>{
        rules.resetFileHistory();
        rules.resetAliasHistory();
        let reversionPath = this.psh.joinPath(this.path, '.rollback');
        if(await this.fsh.exist(reversionPath)){
            throw new Error("The reversion directory already exists ...");
        }

        let pathArray = this.psh.pathToArray(this.path);
        let renameRoot = true;
        if(pathArray[pathArray.length - 1] == rootName){
            renameRoot = false;
        }
        pathArray[pathArray.length - 1] = rootName;
        let newPath = this.psh.joinPath(...pathArray);
        if(renameRoot == true && await this.fsh.exist(newPath)){
            throw new Error("The specified root name would be duplicated");
        }

        let originalPath =  this.psh.joinPath(reversionPath, 'original_content');

        this.fsh.createDirectory(reversionPath);
        this.fsh.createDirectory(originalPath);
        try {
            this.fsh.hide(reversionPath);
        } catch (error) {
            //Just ignore if we can't hide the directory ...
            console.log(error);
        }

        await this.backupTransformCollection(this.characterTxts, originalPath);
        await this.backupTransformCollection(this.installTxts, originalPath);
        await this.backupTransformCollection(this.otoInis, originalPath);
        await this.backupTransformCollection(this.prefixMaps, originalPath);

        await this.transformFiles(this.prefixMaps, rules, options);
        if(options.truncateDecimals == true){
            for(let i = 0; i < this.otoInis.length; i++){
                this.otoInis[i].obj.truncateDecimals();
            }
        }
        await this.transformFiles(this.otoInis, rules, options);
        
        let deleteCharacterTxt = false;
        if(this.characterTxts.length <= 0){
            deleteCharacterTxt = true;
            let ctxt = new CharacterTxt("");
            ctxt.name = options.newUtauName;
            await ctxt.save(this.psh.joinPath(this.path, "character.txt"), this.fsh);
        }else{
            for(let i = 0; i < this.characterTxts.length; i++){
                this.characterTxts[i].obj.name = options.newUtauName;
            }
            await this.transformFiles(this.characterTxts, rules, options);
        }

        //Dont forget that the order is reversed ...
        let sorted: objectRepresentation[] = [];
        if(options.renameFiles)
            sorted = this.fsh.flattenAndSortDirectoryStructureByLengthRelativeToADirectory(this.renamableBlobs, this.path, true);

        let pathAsArray = this.psh.pathToArray(this.path)

        let reversionFile = new ReversionFile(null);
        reversionFile.originalRootName = pathAsArray[pathAsArray.length - 1];
        reversionFile.deleteCharacterTxt = deleteCharacterTxt;

        for(let i = sorted.length - 1; i >= 0; i--){
            if(sorted[i].name.toUpperCase() == "OTO.INI") continue;
            if(sorted[i].name.toUpperCase() == "PREFIX.MAP") continue;
            if(sorted[i].name.toUpperCase() == "INSTALL.TXT") continue;
            if(sorted[i].name.toUpperCase() == "CHARACTER.TXT") continue;
            if(sorted[i].name.toUpperCase() == "PRESAMP.INI") continue;

            let originalPathArray: string[] = this.psh.pathToArray(
                this.psh.getRelativePath(this.path, sorted[i].completePath)
            );
            let destinationPathArray: string[] = [...originalPathArray];

            destinationPathArray[destinationPathArray.length -1] =
                rules.generateReplacedFileName(destinationPathArray[destinationPathArray.length -1], !sorted[i].isDirectory);

            reversionFile.addRename(
                this.psh.joinPath(...originalPathArray),
                this.psh.joinPath(...destinationPathArray)
            );
        }

        await reversionFile.save(this.psh.joinPath(reversionPath, 'revert.json'), this.fsh);

        for(let i = 0; i < reversionFile.renames.length; i++){
            await this.fsh.renameFile(
                this.psh.joinPath(this.path, reversionFile.renames[i].kana),
                this.psh.joinPath(this.path, reversionFile.renames[i].renamed)
            );
        }

        if(renameRoot == true){
            await this.fsh.renameFile(this.path, newPath);
            this.path = newPath;
        }
        await this.init();

        return rules.changedAlias;
    }

    public async revertUtau(){
        let reversionPath = this.psh.joinPath(this.path, '.rollback');
        let originalPath =  this.psh.joinPath(reversionPath, 'original_content');

        let reversionFile: ReversionFile = new ReversionFile(
            await this.fsh.readTextFile(this.psh.joinPath(reversionPath, 'revert.json'), 'utf8')
        );

        let pathArray = this.psh.pathToArray(this.path);
        let renameRoot = true;
        if(pathArray[pathArray.length - 1] == reversionFile.originalRootName){
            renameRoot = false;
        }
        pathArray[pathArray.length - 1] = reversionFile.originalRootName;
        let newPath = this.psh.joinPath(...pathArray);
        if(renameRoot == true && await this.fsh.exist(newPath)){
            throw new Error("The destination root name will be duplicated, it seems like you have reinstalled the utau after the conversion");
        }

        for(let i = reversionFile.renames.length - 1; i >= 0; i--){
            let source = this.psh.joinPath(this.path, reversionFile.renames[i].renamed);
            let destination = this.psh.joinPath(this.path, reversionFile.renames[i].kana);
            await this.fsh.renameFile(source, destination);
        }

        let toPutBack = this.fsh.flattenNestedObjectRepresentation(
            await this.fsh.getAllFilesOnDirectoryRecursive(originalPath), false
        );

        for(let i = 0; i < toPutBack.length; i++){
            let source: string = toPutBack[i].completePath;
            let destination: string = this.psh.joinPath(
                this.path, this.psh.getRelativePath(originalPath, toPutBack[i].completePath)
            );
            await this.fsh.copyFile(source, destination);
        }

        //console.log(reversionPath);
        await this.fsh.recursiveDelete(reversionPath);

        if(reversionFile.deleteCharacterTxt == true){
            await this.fsh.deleteFile(this.psh.joinPath(this.path, "character.txt"));
        }

        if(renameRoot == true){
            await this.fsh.renameFile(this.path, newPath);
            this.path = newPath;
        }
        await this.init();
    }
}


