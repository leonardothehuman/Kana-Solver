/*This file is licensed under GNU GPL v3.0 only license*/

import type Store from "../minilibs/Store";

export type colorSchemeOptions = "light" | "dark" | "system";
export default interface ISettingsHandler{
    //fun:(p: string) => boolean;
    UTAUInstallationDirectory: Store<string>;
    ColorScheme: Store<colorSchemeOptions>;
    LastUpdateCheckTime: Store<number>;
    LastUpdateObject: Store<string|null>;
    init:() => Promise<void>;
}