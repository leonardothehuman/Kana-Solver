//This file is licensed under MIT license

var nw = require('nw.gui');
import type INetworkHandler from "./INetworkHandler";

export default class NetworkHandler implements INetworkHandler{
    public async fetchJson(url: string): Promise<object>{
        let response = await fetch(url+"?_="+Date.now());
        if (!response.ok) {
            throw new Error("HTTP error: " + response.status);
        }
        return await response.json();
    }
    public openUrlOnBrowser(url: string){
        nw.Shell.openExternal(url);
    }
}