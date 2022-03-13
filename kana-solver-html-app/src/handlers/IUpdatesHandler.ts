//This file is licensed under MIT license

import type IReadOnlyStore from "../minilibs/IReadOnlyStore";

export default interface IUpdatesHandler{
    readonly latestVersionInteger: IReadOnlyStore<number>,
	readonly downloadUrl: IReadOnlyStore<string>,
	readonly additionalInfo: IReadOnlyStore<any>,
    readonly updateTitle: IReadOnlyStore<string>,
    readonly updateMessage: IReadOnlyStore<string>,
    readonly loaded: IReadOnlyStore<boolean>,
    readonly currentVersion: number,
    init:() => Promise<void>;
}