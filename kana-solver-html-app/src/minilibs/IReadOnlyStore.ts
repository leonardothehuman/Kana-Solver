//We don't want the presenter and models to be dependent on svelte
//So we will write our own store
//And we can do some tricks with that ...
//And I don't like the fact that svelte stores don't have a get methiod ...

export type subscriber<T> = (nv: T) => void;
export type unsubscriber = () => void;

export default interface IReadOnlyStore<T>{
    subscribe: (cb: subscriber<T>) => unsubscriber;
    get: () => T;
    subscribeWithoutRun: (cb: subscriber<T>) => unsubscriber;
    unsubscribe: (cb: subscriber<T>) => void;
}