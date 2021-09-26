export default interface IPathStringHandler{
    pathIsAbsolute:(p: string) => boolean;
    getPathWithoutDrive: (p: string) => string;
    getDriveFromPath: (p: string) => string;
    goToParentDirectory: (p: string) => string;
    pathToArray: (p:string) => string[];
    defaultPathSeparator: () => string;
    joinPath: (...p: string[]) => string;
    normalizePath: (p: string) => string;
    extractExtention: (p: string) => string;
    isCompleteWinPath: (_path: string) => boolean;
    normalizeSlash: (t: string) => string;
    zipNormalize: (t: string) => string;
    extractFileName: (name: string, ext: string) => string;
}