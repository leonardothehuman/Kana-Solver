//This file is licensed under GNU GPL v3.0 only license

import type IFileSystemHandler from "../handlers/IFileSystemHandler";
import type IPathStringHandler from "../handlers/IPathStringshandler";
import Store from "../minilibs/Store";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import type ISpinnerManipulator from "./commonInterfaces/ISpinnerManipulator";
import type IInstalledUtauHandler from "../handlers/IInstalledUtauHandler";
import type { IInstalledUtau } from "../handlers/IInstalledUtauHandler";
import AsyncStoreInterceptor from "../minilibs/AsyncStoreInterceptor";
import type IStore from "../minilibs/IStore";
import { UtauRelevantContent } from "../minilibs/parsers/utauRelevantContent";
import type { ConversionItem } from "./conversionFileSelectorPresenter";
import { htmlEntities } from "../minilibs/helpers";

export interface IUtauConversorDetailsModel {
    readonly psh: IPathStringHandler;
    readonly fsh: IFileSystemHandler;
    readonly iuh: IInstalledUtauHandler;
}

export interface IUtauConversorDetailsView {
    //TODO: Centralize this mundane things
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
    askConfirmationYN: (text: string, title: string) => Promise<boolean>;
    popup: (text: string, title: string) => Promise<void>;
    goBack: () => void;
    prompt: (title: string, text: string, defaultValue: string) => Promise<{
        text: string,
        ok: boolean
    }>;
}

export type deduplicateOptions = "true" | "false";

export class UtauConversorDetailsPresenter {
    //Initialization
    public readonly view: IUtauConversorDetailsView;
    public readonly model: IUtauConversorDetailsModel;

    private _utauPath: Store<string>;
    public get utauPath(): IStore<string> {
        return this._utauPath;
    }

    private _rootName: AsyncStoreInterceptor<string>;
    public get rootName(): AsyncStoreInterceptor<string> {
        return this._rootName;
    }

    private _utauName: Store<string>;
    public get utauName(): Store<string> {
        return this._utauName;
    }

    private _renameFiles: Store<boolean>;
    public get renameFiles(): Store<boolean> {
        return this._renameFiles;
    }

    private _renameAliases: Store<boolean>;
    public get renameAliases(): Store<boolean> {
        return this._renameAliases;
    }

    private _conversionItem: Store<ConversionItem | null>;
    public get conversionItem(): Store<ConversionItem | null> {
        return this._conversionItem;
    }

    private _deduplicateAlias: Store<deduplicateOptions | null>;
    public get deduplicateAlias(): Store<deduplicateOptions | null> {
        return this._deduplicateAlias;
    }

    private utauInfo: IInstalledUtau;
    constructor(utauInfo: IInstalledUtau, view: IUtauConversorDetailsView, model: IUtauConversorDetailsModel) {
        this.view = view;
        this.model = model;
        this.utauInfo = utauInfo;
        this._utauPath = new Store(utauInfo.completeRootPath);
        this._utauName = new Store(utauInfo.name);
        this._conversionItem = new Store(null);
        this._deduplicateAlias = new Store("true");
        this._rootName = new AsyncStoreInterceptor(utauInfo.directoryName, true, async (ov: string, nv: string) => {
            var toReturn: string = "";
            for (let i = 0; i < nv.length; i++) {
                if (nv.charAt(i) == ' ') toReturn = toReturn + '_';
                else toReturn = toReturn + nv.charAt(i);
            }
            return {
                valid: true,
                newValue: toReturn
            }
        });
        this._renameAliases = new Store(true);
        this._renameFiles = new Store(true);
    }
    public async init() {
    }
    public async convert() {
        let sp = await this.view.showSpinner("Converting");
        let toDisplay = "";
        try {
            let utau: UtauRelevantContent = new UtauRelevantContent(
                this.model.fsh, this.model.psh, this.utauInfo.completeRootPath
            );
            await utau.init();
            let dda: boolean = false;
            if(this.deduplicateAlias.get() == "true"){
                dda = true;
            }
            let duplicated = await utau.convertUtau(this.conversionItem.get().conversionFile, this.rootName.get(), {
                newUtauName: this.utauName.get(),
                renameAliases: this.renameAliases.get(),
                renameFiles: this.renameFiles.get(),
                deduplicateAlias: dda
            });
            let dEntries = Object.entries(duplicated);
            if(dEntries.length > 0){
                if(dda == true){
                    for(let i = 0; i < dEntries.length; i++){
                        toDisplay += `<p>"${htmlEntities(dEntries[i][1].originalKana)}" was supposed to be converted to "${htmlEntities(dEntries[i][1].originalRomaji)}" but it was already used by "${htmlEntities(dEntries[i][1].solvedKana)}" so it was converted to "${htmlEntities(dEntries[i][1].solvedRomaji)}" instead.</p>`;
                    }
                }else{
                    for(let i = 0; i < dEntries.length; i++){
                        toDisplay += `<p>"${htmlEntities(dEntries[i][1].originalKana)}" has collided with "${htmlEntities(dEntries[i][1].solvedKana)}" outputting "${htmlEntities(dEntries[i][1].originalRomaji)}".</p>`;
                    }
                }
            }
            sp.close();
        } catch (error) {
            sp.close();
            await this.view.emitAlert(error.message, "Error");
        }
        if(toDisplay != ""){
            await this.view.popup(toDisplay, "Warning");
        }
        this.view.goBack();
    }
}