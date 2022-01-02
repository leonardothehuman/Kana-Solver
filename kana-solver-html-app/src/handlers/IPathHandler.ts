import type IReadOnlyStore from "../minilibs/IReadOnlyStore";

export default interface IPathHandler{
    readonly UserConversionFilesDirectory: IReadOnlyStore<string>;
    readonly SystemConversionFilesDirectory: IReadOnlyStore<string>;
    readonly UserVoiceDirectory: IReadOnlyStore<string>;
    readonly SystemVoiceDirectory: IReadOnlyStore<string>;
    init:() => Promise<void>;
}