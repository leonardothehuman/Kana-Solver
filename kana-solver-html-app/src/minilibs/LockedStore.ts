//This file is licensed under MIT license

import type { subscriber, unsubscriber } from "./IReadOnlyStore";
import type IStore from "./IStore";
import type {updater } from "./IStore";

export default class LockedStore<T> implements IStore<T>{
    private currentValue: T;
    constructor(initial: T){
        this.currentValue = initial;
    }
    public subscribe(cb: subscriber<T>): unsubscriber{
        cb(this.currentValue);
        return function(){}
    }
    public subscribeWithoutRun(cb: subscriber<T>): unsubscriber{
        return function(){}
    }
    public unsubscribe(cb: subscriber<T>){
    }
    public set(nv: T): void{
    }
    public update(fn: updater<T>){
    }
    public get(){
        return this.currentValue;
    }
}