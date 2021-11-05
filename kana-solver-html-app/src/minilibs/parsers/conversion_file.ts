import {isNumber, isString} from '../helpers'
import Store from '../../minilibs/Store';
import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type IReadOnlyStore from '../IReadOnlyStore';
import type IStore from '../IStore';
import type { unsubscriber } from '../IReadOnlyStore';

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

export class ConversionFile{
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
}