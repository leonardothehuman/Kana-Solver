import { sleep } from "../minilibs/helpers";
import Store from "../minilibs/Store";
import type { colorSchemeOptions } from "./ISettingsHandler";
import type ISettingsHandler from "./ISettingsHandler";


export default class SettingsHandler implements ISettingsHandler{
    public UTAUInstallationDirectory: Store<string>;
    public ColorScheme: Store<colorSchemeOptions>;
    constructor(){
        let uid = localStorage.getItem("UTAUInstallationDirectory");
        if(uid == null) uid = "";
        this.UTAUInstallationDirectory = new Store(uid);
        this.UTAUInstallationDirectory.subscribeWithoutRun((nv: string) => {
            localStorage.setItem("UTAUInstallationDirectory", nv);
        });

        let cs:colorSchemeOptions = localStorage.getItem("ColorScheme") as colorSchemeOptions;
        if(cs == null) cs = "system";
        this.ColorScheme = new Store(cs);
        this.ColorScheme.subscribeWithoutRun((nv: colorSchemeOptions) => {
            localStorage.setItem("ColorScheme", nv);
        });
    }
    //It's not uncommon for settings to be saved on async databases, so we will have
    //An async init function even if we never use it ...
    public async init(){
        //await sleep(5000);
    }
}