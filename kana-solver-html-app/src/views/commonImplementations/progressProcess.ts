//This file is licensed under MIT license

import type { Dialog } from "framework7/types";
import type IProgressProcess from "../../presenters/commonInterfaces/IProgressProcess";

export default class ProgressProcess implements IProgressProcess{
    private d: Dialog.Dialog;
    constructor(d: Dialog.Dialog){
        this.d = d;
    }
    public setText(text: string) {
        this.d.setText(text);
    };
    public setProgress(progress: number){
        this.d.setProgress(progress);
    };
    public close(){
        this.d.close();
    };
}