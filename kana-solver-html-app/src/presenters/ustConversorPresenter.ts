//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import type { ConversionItem } from "./conversionFileSelectorPresenter";
import type IStore from "../minilibs/IStore";
import { Ust } from "../minilibs/parsers/ust";

export interface IUstConversorModel{
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
}

export interface IUstConversorView{
    //TODO: Centralize this mundane things
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
    scrollTo: (x: number, y: number) => void;
}

export class UstConversorPresenter{
    //Initialization
    public readonly view: IUstConversorView;
    public readonly model: IUstConversorModel;

    private _ustFilePath: Store<string>;
    public get ustFilePath(): IStore<string> {
        return this._ustFilePath;
    }

    private _conversionRules: Store<ConversionItem | null>;
    public get conversionRules(): IStore<ConversionItem | null> {
        return this._conversionRules;
    }

    private ustFile: Ust|null;

    private _canConvertCharset: Store<boolean>;
    public get canConvertCharset(): IReadOnlyStore<boolean> {
        return this._canConvertCharset;
    }

    private _canSaveKanaVCV: Store<boolean>;
    public get canSaveKanaVCV(): Store<boolean> {
        return this._canSaveKanaVCV;
    }

    private _canSaveRomajiVCV: Store<boolean>;
    public get canSaveRomajiVCV(): Store<boolean> {
        return this._canSaveRomajiVCV;
    }

    constructor(view: IUstConversorView, model: IUstConversorModel){
        this.view = view;
        this.model = model;

        this._canConvertCharset = new Store(true);
        this._canSaveKanaVCV = new Store(true);
        this._canSaveRomajiVCV = new Store(true);

        this._ustFilePath = new Store("");
        this.ustFile = null;
        this._conversionRules = new Store(null);
    }
    public async init(){
        this._ustFilePath.subscribeWithoutRun((nv: string) => {
            if(nv == ""){
                this.view.scrollTo(0, 0);
            }
            this.ustFile = null;
            this.resetPermisions();
        });
    }

    private resetPermisions(){
        this._canConvertCharset.set(true);
        this._canSaveKanaVCV.set(true);
        this._canSaveRomajiVCV.set(true);
    }

    private async loadFieldFile(){
        if(this._ustFilePath.get().trim() == ''){
            throw new Error("The specified file path is empty");
        }
        if(this.ustFile != null) return;
        if(!await this.model.fsh.existAndIsFile(this._ustFilePath.get())){
            throw new Error(`Failed to open "${this._ustFilePath.get()}"`);
        }
        let fileContent = await this.model.fsh.readTextFile(this._ustFilePath.get(), 'SHIFT_JIS');
        this.ustFile = new Ust(fileContent);
        this.ustFile.forceCV();
    }
    
    public async kanaToRomaji(){
        let sp = await this.view.showSpinner("Loading ...");
        try {
            await this.loadFieldFile();
            this.ustFile.kanaToRomaji(this._conversionRules.get().conversionFile);
            this._canConvertCharset.set(false);
            this._canSaveKanaVCV.set(false);
            sp.close();
            this.view.emitAlert("Ust converted to romaji, now, select one of the save options below ...", "Conversion done");
        } catch (error) {
            this._ustFilePath.set('');
            sp.close();
            this.view.emitAlert(error.message, "Error");
        }
    }
    public async romajiToKana(){
        let sp = await this.view.showSpinner("Loading ...");
        try {
            await this.loadFieldFile();
            this.ustFile.romajiToKana(this._conversionRules.get().conversionFile);
            this._canConvertCharset.set(false);
            this._canSaveRomajiVCV.set(false);
            sp.close();
            this.view.emitAlert("Ust converted to kana, now, select one of the save options below ...", "Conversion done");
        } catch (error) {
            this._ustFilePath.set('');
            sp.close();
            this.view.emitAlert(error.message, "Error");
        }
    }

    
    public async save(vcv: boolean, kana: boolean){
        let sp = await this.view.showSpinner("Loading ...");
        try {
            await this.loadFieldFile();
            if(vcv == true){
                if(kana == true){
                    this.ustFile.addKanaVCV(this.conversionRules.get().conversionFile);
                }else{
                    this.ustFile.addRomajiVCV();
                }
            }
            await this.model.fsh.renameFileAsBackup(this._ustFilePath.get());
            await this.ustFile.save(this._ustFilePath.get(), this.model.fsh);
            this._ustFilePath.set('');
            sp.close();
            this.view.emitAlert("The UST file has been saved", "Save");
        } catch (error) {
            this._ustFilePath.set('');
            sp.close();
            this.view.emitAlert(error.message, "Error");
        }
    }
    public async saveCV(){
        await this.save(false, false);
    }
    public async saveRomajiVCV(){
        await this.save(true, false);
    }
    public async saveKanaVCV(){
        await this.save(true, true);
    }
}