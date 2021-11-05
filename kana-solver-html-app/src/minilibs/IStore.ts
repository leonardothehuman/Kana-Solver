//We don't want the presenter and models to be dependent on svelte
//So we will write our own store
//And we can do some tricks with that ...
//And I don't like the fact that svelte stores don't have a get methiod ...

export type updater<T> = (cv: T) => T;
import type IReadOnlyStore from "./IReadOnlyStore";

export default interface IStore<T> extends IReadOnlyStore<T>{
    set: (nv: T) => void;
    update: (fn: updater<T>) => void;
}