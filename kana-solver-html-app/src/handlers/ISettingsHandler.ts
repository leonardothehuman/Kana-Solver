import type Store from "../minilibs/Store";

export type colorSchemeOptions = "light" | "dark" | "system";
export default interface ISettingsHandler{
    //fun:(p: string) => boolean;
    UTAUInstallationDirectory: Store<string>;
    ColorScheme: Store<colorSchemeOptions>;
    init:() => Promise<void>;
}