//TODO: Everything here should be async
//TODO: This file is incomplete and should not be used
export type asyncEventSubscriber<E, S> = (sender: S, event: E) => Promise<void>;
export type eventSubscriber<E, S> = (sender: S, event: E) => void;

export default class AsyncEvent<S, E>{
    private sender: S;
    private preAsyncSubscribers: Set<eventSubscriber<E, S>>;
    private asyncSubscribers: Set<asyncEventSubscriber<E, S>>;
    private postAsyncSubscribers: Set<eventSubscriber<E, S>>;
    private _isRunning: boolean;
    public get isRunning(): boolean {
        return this._isRunning;
    }
    constructor(_sender: S){
        this.sender = _sender;
        this.preAsyncSubscribers = new Set();
        this.asyncSubscribers = new Set();
        this.postAsyncSubscribers = new Set();
        this._isRunning = false;
    }
    public async trigger(event: E){
        this._isRunning = true;
        for (let sb of this.preAsyncSubscribers.values()){
            sb(this.sender, event);
        }
        for (let sb of this.asyncSubscribers.values()){
            await sb(this.sender, event);
        }
        for (let sb of this.postAsyncSubscribers.values()){
            sb(this.sender, event);
        }
        this._isRunning = false;
    }
    public addEventListener(cb: eventSubscriber<E, S>, post: boolean): eventSubscriber<E, S>{
        if(post == true){
            this.postAsyncSubscribers.add(cb);
        }else{
            this.preAsyncSubscribers.add(cb);
        }
        return cb;
    }
    public addAsyncEventListener(cb: asyncEventSubscriber<E, S>): asyncEventSubscriber<E, S>{
        this.asyncSubscribers.add(cb);
        return cb;
    }
    public removeEventListener(ev: eventSubscriber<E, S>, post: boolean){
        var newSb: Set<eventSubscriber<E, S>> = new Set();
        if(post == true){
            for (let sb of this.postAsyncSubscribers.values()){
                if(sb == ev) continue;
                newSb.add(sb);
            }
            this.postAsyncSubscribers = newSb;
        }else{
            for (let sb of this.preAsyncSubscribers.values()){
                if(sb == ev) continue;
                newSb.add(sb);
            }
            this.preAsyncSubscribers = newSb;
        }
    }
    public removeAsyncEventListener(ev: asyncEventSubscriber<E, S>){
        var newSb: Set<asyncEventSubscriber<E, S>> = new Set();
        for (let sb of this.asyncSubscribers.values()){
            if(sb == ev) continue;
            newSb.add(sb);
        }
        this.asyncSubscribers = newSb;
    }
}