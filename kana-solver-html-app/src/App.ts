import type IProgressProcess from "./presenters/commonInterfaces/IProgressProcess";
import type ISpinnerManipulator from "./presenters/commonInterfaces/ISpinnerManipulator";

export type GlobalInterface = {
    showSpinner: (text: string) => Promise<ISpinnerManipulator>;
    emitAlert: (text: string, title: string) => Promise<void>;
    createProgressProcess: (title: string, initialProgress: number) => IProgressProcess;
    askConfirmation: (text: string, title: string) => Promise<boolean>;
    askConfirmationYN: (text: string, title: string) => Promise<boolean>;
    popup: (text: string, title: string) => Promise<void>;
    prompt: (title: string, text: string, defaultValue: string) => Promise<{
        text: string,
        ok: boolean
    }>;
}