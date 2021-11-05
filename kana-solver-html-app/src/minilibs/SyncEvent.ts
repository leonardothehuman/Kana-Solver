export type eventSubscriber<E, S> = (sender: S, event: E) => void;

export default class SyncEvent<S, E>{
    private sender: S;
    private syncSubscribers: Set<eventSubscriber<E, S>>;
    constructor(_sender: S){
        this.sender = _sender;
        this.syncSubscribers = new Set();
    }
    public async trigger(event: E){
        for (let sb of this.syncSubscribers.values()){
            sb(this.sender, event);
        }
    }
    public addEventListener(cb: eventSubscriber<E, S>): eventSubscriber<E, S>{
        this.syncSubscribers.add(cb);
        return cb;
    }
    public removeEventListener(ev: eventSubscriber<E, S>){
        this.syncSubscribers.delete(ev);
    }
}