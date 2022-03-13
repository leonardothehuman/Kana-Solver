//This file is licensed under MIT license

import { isArrayOfAdditionalInfoAray, isNumber, isString } from "../minilibs/helpers";
import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import Store from "../minilibs/Store";
import type INetworkHandler from "./INetworkHandler";
import type ISettingsHandler from "./ISettingsHandler";
import type IUpdatesHandler from "./IUpdatesHandler";

export type AdditionalInfoArayOrString = AdditionalInfoAray|string;
export type AdditionalInfoAray = [string, ...AdditionalInfoArayOrString[]];

export default class UpdatesHandler implements IUpdatesHandler {
    private _latestVersionInteger: Store<number>;
    public get latestVersionInteger(): IReadOnlyStore<number> {
        return this._latestVersionInteger;
    }
    private _downloadUrl: Store<string>;
    public get downloadUrl(): IReadOnlyStore<string> {
        return this._downloadUrl;
    }
    private _updateTitle: Store<string>;
    public get updateTitle(): IReadOnlyStore<string> {
        return this._updateTitle;
    }
    private _updateMessage: Store<string>;
    public get updateMessage(): IReadOnlyStore<string> {
        return this._updateMessage;
    }
    private _additionalInfo: Store<AdditionalInfoAray[]>;
    public get additionalInfo(): IReadOnlyStore<AdditionalInfoAray[]> {
        return this._additionalInfo;
    }
    private _loaded: Store<boolean>;
    public get loaded(): IReadOnlyStore<boolean> {
        return this._loaded;
    }
    private updateUrl: string;
    private _currentVersion: number;
    public get currentVersion(): number {
        return this._currentVersion;
    }

    private sh: ISettingsHandler;
    private nh: INetworkHandler;
    constructor(updateUrl: string, currentVersion: number, _sh: ISettingsHandler, _nh: INetworkHandler) {
        this.sh = _sh;
        this.nh = _nh;
        this._loaded = new Store(false);
        this._latestVersionInteger = new Store(0);
        this._downloadUrl = new Store("");
        this._updateTitle = new Store("");
        this._updateMessage = new Store("");
        this._additionalInfo = new Store([["",""]]);
        this.updateUrl = updateUrl;
        this._currentVersion = currentVersion;
    }
    public async init() {
        try {
            let today = Date.now();
            if(
                today > this.sh.LastUpdateCheckTime.get() + 86400000 || //86400000 = 1 day in milliseconds
                today < this.sh.LastUpdateCheckTime.get()
            ){
                try {
                    let updateData = await this.nh.fetchJson(this.updateUrl);
                    this.sh.LastUpdateCheckTime.set(today);
                    this.sh.LastUpdateObject.set(JSON.stringify(updateData));
                } catch (error) {}
            }
            let update = JSON.parse(this.sh.LastUpdateObject.get());

            if(!isNumber(update["latestVersionInteger"])) throw new Error("Incorrect version field");
            this._latestVersionInteger.set(update["latestVersionInteger"]);
            
            if(!isString(update["downloadUrl"])) throw new Error("Incorrect download url field");
            this._downloadUrl.set(update["downloadUrl"]);

            if(!isString(update["updateTitle"])) throw new Error("Incorrect update title field");
            this._updateTitle.set(update["updateTitle"]);
            
            if(!isString(update["updateMessage"])) throw new Error("Incorrect update message field");
            this._updateMessage.set(update["updateMessage"]);

            if(!isArrayOfAdditionalInfoAray(update["additionalInfo"])) throw new Error("Incorrect additional info field");
            this._additionalInfo.set(update["additionalInfo"]);

            this._loaded.set(true);
        } catch (error) {}
    }
}