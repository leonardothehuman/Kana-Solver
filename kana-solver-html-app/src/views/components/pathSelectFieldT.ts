//This file is licensed MIT license

export type ExtractedFile = {
    isFile: boolean,
    isDirectory: boolean,
    path: string
}

export interface IPathSelectFieldHandler{
    extractFileFromDragEvent(e: DragEvent): ExtractedFile
}

export class ManyItemsError extends Error{
    constructor(message: string) {
        super(message);
        this.name = 'ManyItemsError';
    }
}