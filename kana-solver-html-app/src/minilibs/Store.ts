//This file is licensed under MIT license

import type { subscriber, unsubscriber } from "./IReadOnlyStore";
import type IStore from "./IStore";
import type { updater } from "./IStore";

export default class Store<T> implements IStore<T>{
    protected currentValue: T;
    protected subscribers: Set<subscriber<T>>;
    constructor(initial: T){
        this.subscribers = new Set();
        this.set(initial);
    }
    public subscribe(cb: subscriber<T>): unsubscriber{
        var that = this;
        this.subscribers.add(cb);
        cb(this.currentValue);
        return function(){
            that.subscribers.delete(cb);
        }
    }
    public subscribeWithoutRun(cb: subscriber<T>): unsubscriber{
        var that = this;
        this.subscribers.add(cb);
        return function(){
            that.subscribers.delete(cb);
        }
    }
    public unsubscribe(cb: subscriber<T>){
        this.subscribers.delete(cb);
    }
    public set(nv: T): void{
        this.currentValue = nv;
        for (let cb of this.subscribers.values()){
            cb(this.currentValue);
        }
    }
    public update(fn: updater<T>){
        this.set(fn(this.currentValue));
    }
    public get(){
        return this.currentValue;
    }
}