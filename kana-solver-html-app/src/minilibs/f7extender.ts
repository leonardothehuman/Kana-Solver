import type {f7} from "framework7-svelte";

export function f7ConfirmPromisse(_f7: typeof f7, text: string, title: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
        _f7.dialog.confirm(text, title, 
            () => {resolve(true)},
            () => {resolve(false)}
        );
    });
}

export function f7ConfirmYNPromisse(_f7: typeof f7, text: string, title: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
        _f7.dialog.create({
            title: title,
            text: text,
            buttons: [
              {
                text: 'No',
                color: 'gray',
                onClick: (d, e) => {
                    resolve(false);
                }
              },
              {
                text: 'Yes',
                onClick: (d, e) => {
                    resolve(true);
                }
              }
            ],
            verticalButtons: false,
        }).open();
    });
}