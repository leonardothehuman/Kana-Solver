import type IReadOnlyStore from "../minilibs/IReadOnlyStore";
import Store from "../minilibs/Store";
import type IFileSystemHandler from "./IFileSystemHandler";
import type IPathHandler from "./IPathHandler";
import type IPathStringHandler from "./IPathStringshandler";
import type ISettingsHandler from "./ISettingsHandler";


export default class PathHandler implements IPathHandler{
    private _UserConversionFilesDirectory: Store<string>;
    public get UserConversionFilesDirectory(): IReadOnlyStore<string> {
        return this._UserConversionFilesDirectory;
    }
    private _SystemConversionFilesDirectory: Store<string>;
    public get SystemConversionFilesDirectory(): IReadOnlyStore<string> {
        return this._SystemConversionFilesDirectory;
    }
    private _UserVoiceDirectory: Store<string>;
    public get UserVoiceDirectory(): IReadOnlyStore<string> {
        return this._UserVoiceDirectory;
    }
    private _SystemVoiceDirectory: Store<string>;
    public get SystemVoiceDirectory(): IReadOnlyStore<string> {
        return this._SystemVoiceDirectory;
    }
    constructor(psh: IPathStringHandler, fsh: IFileSystemHandler, sth: ISettingsHandler){
        this._UserConversionFilesDirectory = new Store(psh.joinPath(
            fsh.homeDirectory(),
            "kanasolver_files\\conversion_files"
        ));
        this._SystemConversionFilesDirectory = new Store(psh.joinPath(
            psh.goToParentDirectory(process.execPath), "package.nw\\presets"
        ));
        this._UserVoiceDirectory = new Store(psh.joinPath(process.env.APPDATA, "UTAU\\voice"));
        this._SystemVoiceDirectory = new Store("");
        sth.UTAUInstallationDirectory.subscribe((nv: string) => {
            this._SystemVoiceDirectory.set(
                psh.joinPath(
                    sth.UTAUInstallationDirectory.get(), "voice"
                )
            );
        });
    }
    //It's not uncommon for filesystem to have async operations, so we will have
    //An async init function even if we never use it ...
    public async init(){
        
    }
}