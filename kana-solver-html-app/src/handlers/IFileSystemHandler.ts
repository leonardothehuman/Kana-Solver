//This file is licensed under MIT license
export type objectRepresentation = {
    completePath: string,
    name: string,
    isDirectory: boolean,
    isFile: boolean
}

export type nestedObjectRepresentation = objectRepresentation & {
    subObjects: nestedObjectRepresentation[]
}

export default interface IFileSystemHandler{
    getAvailableDriveList: () => Promise<string[]>;
    homeDirectory: () => string;
    getAllFilesOnDirectory: (d: string) => Promise<objectRepresentation[]>;
    getAllFilesOnDirectoryRecursive: (d: string) => Promise<nestedObjectRepresentation[]>;
    flattenNestedObjectRepresentation: (obj: nestedObjectRepresentation[], includeDirectories: boolean) => objectRepresentation[];
    flattenAndSortDirectoryStructureByLengthRelativeToADirectory: (obj: nestedObjectRepresentation[], relative: string, includeDirectories: boolean) => objectRepresentation[];
    isDirectoryEmpty(p: string): Promise<boolean>;
    existAndIsFile: (_path: string) => Promise<boolean>;
    existAndIsDirectory: (_path: string) => Promise<boolean>;
    createDirectory: (_path: string) => Promise<void>;
    exist: (_path: string) => Promise<boolean>;
    readTextFile: (_path: string, encoding: string) => Promise<string>;
    saveTextFile: (_path: string, encoding: string, text: string) => Promise<void>;
    recursiveDelete: (_path: string) => Promise<void>;
    deleteFile: (_path: string) => Promise<void>;
    openOnFileExplorer: (_path: string) => Promise<void>;
    copyFile: (source: string, destination: string) => Promise<void>;
    renameFile: (source: string, destination: string) => Promise<void>;
    hide: (path: string) => void;
    renameFileAsBackup: (f: string) => Promise<void>;
}