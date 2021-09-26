import type { ZipFile } from 'yauzl';
import type {InstallTxt} from '../minilibs/parsers/install_txt';

export type ZipExtractProgressInfo = {
    totalEntries: number,
    currentEntry: number,
    currentFileName: string,
    currentZipPath: string
}
export type ZipExtractProgressCallback = (pr:ZipExtractProgressInfo) => void

export type UtauZipInfo = {
    installTxt: null|InstallTxt,
    sourceOnZip: string,
    relativeDestination: string
}

export type ExploreZipCallback = (entry: any, decodedPath: string, isDirectory: boolean, zipFile: ZipFile) => Promise<boolean>

export default interface IZipHandler{
    getUtauZipInfo: (zipFile: string) => Promise<UtauZipInfo>;
    extractUtau: (
        zipFile: string,
        installDir: string,
        sourceZipDirectory: string,//normalized
        destinationOnInstallDir: string,//normalized
        progressCallback: ZipExtractProgressCallback,
        failIfFileExists: boolean
    ) => Promise<void>;
}