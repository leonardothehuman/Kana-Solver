//This file is licensed under MIT license

export class LimitedStack<T>{
    private stack:T[] = []
    constructor(ammount:number, initialFill:T){
        for(let i = 0; i < ammount;i++){
            this.stack.push(initialFill);
        }
    }
    public add(toAdd: T){
        this.stack.shift();
        this.stack.push(toAdd);
    }
    public get(toGet: number):T{
        return this.stack[this.stack.length - 1 - toGet];
    }
}