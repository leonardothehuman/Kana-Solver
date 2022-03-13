//This file is licensed under MIT license

//Like a store, but when the value changes, be a bit more interactive
//Useful when a change on a select box may cause an error that must revert the store
//In this class, the subscribe function should be invoked only with callback that exclusively updates the ui

import type { subscriber, unsubscriber } from "./IReadOnlyStore";
import type IStore from "./IStore";
import type { updater } from "./IStore";
import Store from "./Store";

export type loaderCallbackReturnObject<T> = {
    valid: boolean,
    newValue: T
}
export type loaderCallback<T> = (ov: T, nv: T) => Promise<loaderCallbackReturnObject<T>>;

export default class AsyncStoreInterceptor<T> extends Store<T>{
    //protected validC: Set<subscriber<T>>;
    protected loader: loaderCallback<T>;
    protected updateWhenInvalid: boolean;
    constructor(initial: T, updateWhenInvalid: boolean, loader: loaderCallback<T>){
        super(initial);
        this.currentValue = initial;
        this.updateWhenInvalid = updateWhenInvalid;
        this.loader = loader;
    }
    public setWithoutExecuteLoader(nv: T){
        super.set(nv);
    }
    public async set(nv: T): Promise<void>{
        if(this.loader == undefined) return;
        var result = await this.loader(this.currentValue, nv);
        if(result.valid == true){
            this.currentValue = result.newValue;
            for (let cb of this.subscribers.values()){
                cb(this.currentValue);
            }
        }else if(this.updateWhenInvalid == true){
            for (let cb of this.subscribers.values()){
                cb(this.currentValue);
            }
        }
    }
}