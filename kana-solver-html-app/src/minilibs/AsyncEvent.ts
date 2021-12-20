export type asyncEventSubscriber<E, S> = (sender: S, event: E) => Promise<void>;

export default class AsyncEvent<S, E>{
    private sender: S;
    private asyncSubscribers: Set<asyncEventSubscriber<E, S>>;
    constructor(_sender: S){
        this.sender = _sender;
        this.asyncSubscribers = new Set();
    }
    public async trigger(event: E){
        for (let sb of this.asyncSubscribers.values()){
            await sb(this.sender, event);
        }
    }
    public addEventListener(cb: asyncEventSubscriber<E, S>): asyncEventSubscriber<E, S>{
        this.asyncSubscribers.add(cb);
        return cb;
    }
    public removeEventListener(ev: asyncEventSubscriber<E, S>){
        this.asyncSubscribers.delete(ev);
    }
}