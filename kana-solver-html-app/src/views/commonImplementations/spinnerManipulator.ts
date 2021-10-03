import type { Dialog } from "framework7/types";
import type ISpinnerManipulator from "../../presenters/commonInterfaces/ISpinnerManipulator";

export default class SpinnerManipulator implements ISpinnerManipulator{
    private d: Dialog.Dialog;
    constructor(d: Dialog.Dialog){
        this.d = d;
    }
    public close(){
        this.d.close();
    };
}