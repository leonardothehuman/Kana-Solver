export type objectRepresentation = {
    completePath: string,
    name: string,
    isDirectory: boolean,
    isFile: boolean
}

export default interface IFileSystemHandler{
    getAvailableDriveList: () => Promise<string[]>;
    homeDirectory: () => string;
    getAllFilesOnDirectory: (d: string) => Promise<objectRepresentation[]>;
    isDirectoryEmpty(p: string): Promise<boolean>;
    existAndIsFile: (_path: string) => Promise<boolean>;
    existAndIsDirectory: (_path: string) => Promise<boolean>;
    readTextFile: (_path: string, encoding: string) => Promise<string>;
    recursiveDelete: (_path: string) => Promise<void>
}