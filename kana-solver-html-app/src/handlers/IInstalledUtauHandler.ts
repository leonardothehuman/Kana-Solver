import type {CharacterTxt} from "../minilibs/parsers/character_txt";

export interface IInstalledUtau{
    readonly completeRootPath: string;
    readonly directoryName: string;
    readonly characterTxt: CharacterTxt|null;
    readonly name: string;
    readonly uninstalled: boolean;
    readonly description: string[];
    readonly imageUri: string;
    readonly sampleUri: string;
    uninstallUtau: () => Promise<void>;
}

export default interface IInstalledUtauHandler{
    getUtauListFromDirectory: (directory: string) => Promise<IInstalledUtau[]>;
}