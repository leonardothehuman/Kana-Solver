/*This file is licensed under GNU GPL v3.0 only license*/

import type IFileSystemHandler from '../../handlers/IFileSystemHandler';
import type IPathStringHandler from '../../handlers/IPathStringshandler';
import type { ConversionFile } from './conversion_file';

export default interface ITransformableParser{
    transformFileNames: (rules: ConversionFile, psh: IPathStringHandler) => void;
    transformAlias: (rules: ConversionFile, deduplicate: boolean, keepOriginal: boolean) => void;
    save: (_path: string, fsh: IFileSystemHandler) => Promise<void>;
}