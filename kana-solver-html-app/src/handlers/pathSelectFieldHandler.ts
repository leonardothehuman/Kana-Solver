//This file is licensed under MIT license
import {ManyItemsError} from "../views/components/pathSelectFieldT";
import type {IPathSelectFieldHandler, ExtractedFile} from "../views/components/pathSelectFieldT";

export type NwFile = {
    path: string
} & File;

export default class PathSelectFieldHandler implements IPathSelectFieldHandler{
    public extractFileFromDragEvent(e: DragEvent): ExtractedFile{
        if (!e.dataTransfer.items){
            throw new Error("No files found");
        }
        if(e.dataTransfer.items.length != 1){
            throw new ManyItemsError("More than one item dropped");
        }
        let toReturn: ExtractedFile;
        for (var i = 0; i < e.dataTransfer.items.length; i++) {
            let entry = e.dataTransfer.items[i].webkitGetAsEntry();
            let gaf: NwFile = e.dataTransfer.items[i].getAsFile() as NwFile;
            toReturn = {
                isFile: entry.isFile,
                isDirectory: entry.isDirectory,
                path: gaf.path
                //path: "aaa"
            }
        }
        return toReturn;
    }
}