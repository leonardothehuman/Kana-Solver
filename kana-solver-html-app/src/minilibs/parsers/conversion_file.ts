import {isNumber, isString} from '../helpers'
import Store from '../../minilibs/Store';
import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type IReadOnlyStore from '../IReadOnlyStore';
import type IStore from '../IStore';
import type { unsubscriber } from '../IReadOnlyStore';
import type IPathStringHandler from '../../handlers/IPathStringshandler';

type aliasConversionMode = "prefix"|"suffix"|"center"|"all";

type SeparatedNameAndExtension = {name: string, ext: string};

//We dont want to change the store, only the contents of the store
export type ConversionUnit = {
    readonly kana: IStore<string>,
    readonly romaji: IStore<string>,
    readonly kanaIsDuplicated: IStore<boolean>,
    readonly romajiIsDuplicated: IStore<boolean>
}

export type ConversionUnitCollection = IStore<
    Array<ConversionUnit>
>

export type ObservableConversionRecipe = {
    readonly head:{
        readonly author: IStore<string>,
		readonly description: IStore<string>
    },
    readonly conversionData: ConversionUnitCollection
}

type ConversionRecipe = {
    head:{
        author: string,
		description: string,
        fileVersion: number
    },
    conversionData: Array<{
        kana: string
        romaji: string
    }>
}

export type ChangedAliasInfo = {
    originalKana: string,
    originalRomaji: string,
    solvedKana: string,
    solvedRomaji: string
}

export class ConversionFile{
    private fileHistory: Record<string, string>;
    private aliasHistory: Record<string, string>;
    private _changedAlias: Record<string, ChangedAliasInfo>;
    private prefixList: Array<string>;
    private suffixList: Array<string>;
    public get changedAlias(): Record<string, ChangedAliasInfo> {
        let toReturn: Record<string, ChangedAliasInfo> = {}
        let e = Object.entries(this._changedAlias);
        for(let i = 0; i < e.length; i++){
            toReturn[e[i][0]] = {
                ...e[i][1]
            }
        }
        return toReturn;
    }
    private set changedAlias(value: Record<string, ChangedAliasInfo>) {
        this._changedAlias = value;
    }
    public readonly conversionRecipe: ObservableConversionRecipe;
    private readonly _wasModified: IStore<boolean>;
    public get wasModified(): IReadOnlyStore<boolean> {
        return this._wasModified;
    }
    private getWasModifiedRW(): IStore<boolean> {
        return this._wasModified;
    }

    //Binding on this should have the same reference
    private wasModifiedEventHandler: () => void;
    private _wasModifiedEventHandler(){
        this.getWasModifiedRW().set(true);
    }


    private verifyDuplicatedProp(
        name: "kana"|"romaji",
        indicator: "kanaIsDuplicated"|"romajiIsDuplicated"
    ){
        let existList: Record<string, number> = {};
        this.conversionRecipe.conversionData.get().forEach((el) => {
            let k: string = el[name].get();
            if(existList[k] === undefined){
                existList[k] = 1;
            }else{
                existList[k]++;
            }
        });
        this.conversionRecipe.conversionData.get().forEach((el) => {
            let k: string = el[name].get();
            if(existList[k] > 1){
                el[indicator].set(true);
            }else{
                el[indicator].set(false);
            }
        });
    }

    //Binding on this should have the same reference
    private verifyDuplicatedKana: () => void;
    private _verifyDuplicatedKana(){
        this.verifyDuplicatedProp("kana", "kanaIsDuplicated");
    }

    //Binding on this should have the same reference
    private verifyDuplicatedRomaji: () => void;
    private _verifyDuplicatedRomaji(){
        this.verifyDuplicatedProp("romaji", "romajiIsDuplicated");
    }

    //Attach all event listeners to the observable recipe
    private prepareConversionRecipeEvents(r: ObservableConversionRecipe){
        let s_head = r.head;
        s_head.author.subscribeWithoutRun(this.wasModifiedEventHandler);
        s_head.description.subscribeWithoutRun(this.wasModifiedEventHandler);

        let s_cd = r.conversionData;
        s_cd.subscribeWithoutRun(this.wasModifiedEventHandler);
        s_cd.subscribeWithoutRun(this.verifyDuplicatedKana);
        s_cd.subscribeWithoutRun(this.verifyDuplicatedRomaji);

        s_cd.subscribe(() => {
            s_cd.get().forEach((el) => {
                el.kana.subscribeWithoutRun(this.wasModifiedEventHandler);
                el.kana.subscribeWithoutRun(this.verifyDuplicatedKana);
                el.romaji.subscribeWithoutRun(this.wasModifiedEventHandler);
                el.romaji.subscribeWithoutRun(this.verifyDuplicatedRomaji);
            });
        });
    }
    // public destruct(){
        // let s_head = this.conversionRecipe.head;
        // s_head.author.unsubscribe(this.wasModifiedEventHandler);
        // s_head.description.unsubscribe(this.wasModifiedEventHandler);

        // let s_cd = this.conversionRecipe.conversionData;
        // s_cd.unsubscribe(this.wasModifiedEventHandler);
        // s_cd.unsubscribe(this.verifyDuplicatedKana);
        // s_cd.unsubscribe(this.verifyDuplicatedRomaji);

        // s_cd.get().forEach((el) => {
        //     el.kana.unsubscribe(this.wasModifiedEventHandler);
        //     el.kana.unsubscribe(this.verifyDuplicatedKana);
        //     el.romaji.unsubscribe(this.wasModifiedEventHandler);
        //     el.romaji.unsubscribe(this.verifyDuplicatedRomaji);
        // });

        // if(this.conversionDataUnsubscriber != null) this.conversionDataUnsubscriber();
        // this.wasModifiedEventHandler = null;
        // this.verifyDuplicatedKana = null;
        // this.verifyDuplicatedRomaji = null;
    // }

    constructor(text: string|null){
        this.fileHistory = {};
        this.aliasHistory = {};
        this.changedAlias = {};
        this.prefixList = [];
        this.suffixList = [];
        this.wasModifiedEventHandler = this._wasModifiedEventHandler.bind(this);
        this.verifyDuplicatedKana = this._verifyDuplicatedKana.bind(this);
        this.verifyDuplicatedRomaji = this._verifyDuplicatedRomaji.bind(this);
        this._wasModified = new Store(false);
        if(text === null){
            this.conversionRecipe = {
                head:{
                    author: new Store(""),
                    description: new Store("")
                },
                conversionData: new Store([])
            }
            this.prepareConversionRecipeEvents(this.conversionRecipe);
            return;
        }

        //Reconstruct the file and throw an error if the file is malformed
        var table = JSON.parse(text);
        if(!isString(table["head"]["author"])) throw new Error("Incorrect author field");
        if(!isString(table["head"]["description"])) throw new Error("Incorrect description field");
        if(!isNumber(table["head"]["fileVersion"])) throw new Error("Incorrect version field");
        if(table["head"]["fileVersion"] > 1) throw new Error("This file is not compatible with this version of KanaSolver, please, update KanaSolver to use it");

        this.conversionRecipe = {
            head:{
                author: new Store(table["head"]["author"]),
                description: new Store(table["head"]["description"])
            },
            conversionData: new Store([])
        }
        
        let toAdd: Array<ConversionUnit> = [];
        for(let i in table["conversionData"]){
            if(!isString(table["conversionData"][i]["kana"])) throw new Error(`Incorrect kana at index "${i}"`);
            if(!isString(table["conversionData"][i]["romaji"])) throw new Error(`Incorrect romaji at index "${i}"`);
            var toPush: ConversionUnit = {
                kana: new Store(table["conversionData"][i]["kana"]),
                romaji: new Store(table["conversionData"][i]["romaji"]),
                kanaIsDuplicated: new Store(false),
                romajiIsDuplicated: new Store(false)
            }
            toAdd.push(toPush);
        }
        this.conversionRecipe.conversionData.set(toAdd);

        this.prepareConversionRecipeEvents(this.conversionRecipe);
        this.verifyDuplicatedKana();
        this.verifyDuplicatedRomaji();
    }
    public deleteConversionunit(i: number){
        let cd = this.conversionRecipe.conversionData;
        cd.set([
            ...cd.get().slice(0, i),
            ...cd.get().slice(i+1, cd.get().length),
        ])
    }
    public addEmptyConversionUnit(){
        this.conversionRecipe.conversionData.set([
            ...this.conversionRecipe.conversionData.get(),
            {
                kana: new Store(""),
                romaji: new Store(""),
                kanaIsDuplicated: new Store(false),
                romajiIsDuplicated: new Store(false)
            }
        ])
    }
    public async save(fileName: string, fsh: IFileSystemHandler, stillModified: boolean){
        let toSave:ConversionRecipe = {
            head:{
                author: this.conversionRecipe.head.author.get(),
                description: this.conversionRecipe.head.description.get(),
                fileVersion: 1,
            },
            conversionData: []
        }
        let s_cd = this.conversionRecipe.conversionData;
        s_cd.get().forEach((el) => {
            toSave.conversionData.push({
                kana: el.kana.get(),
                romaji: el.romaji.get()
            });
        });
        await fsh.saveTextFile(fileName, 'utf8', JSON.stringify(toSave, null, '\t'));
        this.getWasModifiedRW().set(stillModified);
    }
    //TODO: Manage this on a different class
    public resetFileHistory(){
        this.fileHistory = {};
    }
    public resetAliasHistory(){
        this.aliasHistory = {};
        this.changedAlias = {};
        this.prefixList = [];
        this.suffixList = [];
    }
    private separateNameFromExtension(fname: string):SeparatedNameAndExtension {
        let stopAt = fname.lastIndexOf('.');
        var name = fname;
        var extension = "";
        if(stopAt > 0){
            name = fname.substr(0, stopAt);
            extension = fname.substr(stopAt);
        }
        if(extension.toLowerCase() == '.frq'){
            stopAt = fname.lastIndexOf('_');
            if(stopAt >= 0){
                name = fname.substr(0, stopAt);
                extension = fname.substr(stopAt);
            }
        }
        return{
            name: name,
            ext: extension
        }
    }
    public generateReplacedFilePath(toReplace: string, psh: IPathStringHandler): string{
        let toReplaceArray = psh.pathToArray(toReplace);
        for(let i = 0; i < toReplaceArray.length - 1; i++){
            toReplaceArray[i] = this.generateReplacedFileName(toReplaceArray[i], false);
        }
        toReplaceArray[toReplaceArray.length - 1] =
            this.generateReplacedFileName(toReplaceArray[toReplaceArray.length - 1], true);

        return psh.joinPath(...toReplaceArray);
    }
    public generateReplacedFileName(toReplace: string, separateExtension: boolean = true){
        if(toReplace == "") return "";
        let elements: SeparatedNameAndExtension = {
            name: toReplace,
            ext: ""
        }
        if(separateExtension == true){
            elements = this.separateNameFromExtension(toReplace);
        }
        let replaced = "";
        let nextAttachement = "";
        while(true){
            replaced = this.generateReplacedString(elements.name) + nextAttachement;
            
            if(this.fileHistory[replaced.toLowerCase()] == elements.name) break;
            if(this.fileHistory[replaced.toLowerCase()] == undefined) break;
            
            if(nextAttachement == ""){
                nextAttachement = "2";
            }else{
                nextAttachement = (parseInt(nextAttachement) + 1).toFixed(0);
            }
        }
        this.fileHistory[replaced.toLowerCase()] = elements.name;
        return replaced + elements.ext;
    }
    private separateAliasElements(toSeparate: string){
        let prefix: string = "";
        let center: string = toSeparate;
        let suffix: string = "";
        for(let i = 0; i < this.prefixList.length; i++){
            let currentPrefix = this.prefixList[i];
            if(currentPrefix.length >= center.length) continue;
            if(center.substr(0, currentPrefix.length) == currentPrefix){
                prefix = center.substr(0, currentPrefix.length);
                center = center.substr(currentPrefix.length);
                break;
            }
        }
        for(let i = 0; i < this.suffixList.length; i++){
            let currentSuffix = this.suffixList[i];
            if(currentSuffix.length >= center.length) continue;
            if(center.substr(center.length - currentSuffix.length) == currentSuffix){
                suffix = center.substr(center.length - currentSuffix.length);
                center = center.substr(0, center.length - currentSuffix.length);
                break;
            }
        }
        return {
            prefix: prefix,
            center: center,
            suffix: suffix
        }
    }
    public generateReplacedAlias(toReplace: string, mode: aliasConversionMode, deduplicate: boolean): string{
        if(toReplace == "") return "";
        if(mode == "all"){
            let elements = this.separateAliasElements(toReplace);
            return  this.generateReplacedAlias(elements.prefix, "prefix", deduplicate) + 
                    this.generateReplacedAlias(elements.center, "center", deduplicate) + 
                    this.generateReplacedAlias(elements.suffix, "suffix", deduplicate)
        }
        if(mode == "prefix" && this.prefixList.indexOf(toReplace) < 0){
            this.prefixList.push(toReplace);
        }
        if(mode == "suffix" && this.suffixList.indexOf(toReplace) < 0){
            this.suffixList.push(toReplace);
        }
        let replaced = "";
        let toReturn = "";
        let nextAttachement = "";
        let putOnChanged = false;
        let originalKana = "";
        let originalRomaji = "";
        let wasReplaced = false;
        while(true){
            replaced = this.generateReplacedString(toReplace) + nextAttachement;
            if(deduplicate == true || wasReplaced == false){
                toReturn = replaced;
                wasReplaced = true;
            }
            
            if(this.aliasHistory[replaced] == toReplace) break;
            if(this.aliasHistory[replaced] == undefined) break;
            if(putOnChanged == false){
                originalKana = this.aliasHistory[replaced];
                originalRomaji = replaced;
            }
            putOnChanged = true;
            
            if(nextAttachement == ""){
                nextAttachement = "2";
            }else{
                nextAttachement = (parseInt(nextAttachement) + 1).toFixed(0);
            }
        }
        this.aliasHistory[replaced] = toReplace;
        if(putOnChanged == true){
            this._changedAlias[toReplace] = {
                originalKana: originalKana,
                originalRomaji: originalRomaji,
                solvedKana: toReplace,
                solvedRomaji: replaced
            }
        }
        return toReturn;
    }
    public generateReplacedString(toReplace: string): string{
        var toReturn = '';
        let i = 0 ;
        let units = this.conversionRecipe.conversionData.get();
        while(i < toReplace.length){
            let replaced = toReplace.charAt(i);
            let skipCount = 1;
            for(let j = 0; j < units.length; j++){
                let cUnit = units[j];
                let cKana = cUnit.kana.get();
                let replacement = cUnit.romaji.get();
                if(cKana.length <= 0) continue;
                if(replacement.length <= 0) continue;
                //let replacementCount = replacement.length;
                let original = toReplace.substr(i, cKana.length);
                if(original == cKana && cKana.length >= skipCount){
                    skipCount = cKana.length;
                    replaced = replacement;
                }
            }
            toReturn = toReturn + replaced;
            i = i + skipCount;
        }
        return toReturn;
    }
    public generateReplacedStringReverse(toReplace: string): string{
        var toReturn = '';
        let i = 0 ;
        let units = this.conversionRecipe.conversionData.get();
        while(i < toReplace.length){
            let replaced = toReplace.charAt(i);
            let skipCount = 0;
            for(let j = 0; j < units.length; j++){
                let cUnit = units[j];
                let cRomaji = cUnit.romaji.get();
                let replacement = cUnit.kana.get();
                if(cRomaji.length <= 0) continue;
                if(replacement.length <= 0) continue;
                //let replacementCount = replacement.length;
                let original = toReplace.substr(i, cRomaji.length);
                if(original == cRomaji && cRomaji.length > skipCount){
                    skipCount = cRomaji.length;
                    replaced = replacement;
                }
            }
            if(skipCount <= 0) skipCount = 1;
            toReturn = toReturn + replaced;
            i = i + skipCount;
        }
        return toReturn;
    }
}