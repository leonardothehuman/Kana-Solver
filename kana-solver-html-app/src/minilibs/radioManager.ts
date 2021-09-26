//This file is licensed under MIT license

//Framework7 svelte's radio don't have a bindable property
//So we need some workaround

export type PopulateVariableCallback = (v: string) => void;

export type PopulateVariableCallbackCollection = {
    [key: string]: PopulateVariableCallback
}

export default class RadioManager{
    private populateVariableCallbacks: PopulateVariableCallbackCollection;
    constructor(){
        this.populateVariableCallbacks = {}
    }
    public addPopulatable(name: string, cb: PopulateVariableCallback){
        this.populateVariableCallbacks[name] = cb;
    }    
    public populateVariable(name: string) {
        var ele:NodeListOf<HTMLInputElement> = document.getElementsByName(name) as NodeListOf<HTMLInputElement>;
        for(let i:number = 0; i < ele.length; i++) {
            if(ele[i].checked){
                this.populateVariableCallbacks[name](ele[i].value)
            }
        }
    }
    public populateRadio(name: string, value:string){
        var ele:NodeListOf<HTMLInputElement> = document.getElementsByName(name) as NodeListOf<HTMLInputElement>;
        for(let i:number = 0; i < ele.length; i++) {
            if(ele[i].value == value)
                ele[i].checked = true;
        }
    }
}

//Boilerplate sample:
// radiomanager.addPopulatable("install-location", (v: string) => {
//     destinationOption = v
// });
// onMount(() => {
//     radiomanager.populateRadio("install-location", destinationOption);
// });
// $: radiomanager.populateRadio("install-location", destinationOption);


// <ListItem
//     radio
//     radioIcon="start"
//     title="Users Directory"
//     value="users"
//     name="install-location"
//     disabled={!canInstallUtau}
//     on:change={() => {radiomanager.populateVariable("install-location")}}
// ></ListItem>
// <ListItem
//     radio
//     radioIcon="start"
//     title="UTAU Directory"
//     value="utau"
//     name="install-location"
//     disabled={!canInstallUtau}
//     on:change={() => {radiomanager.populateVariable("install-location")}}
// ></ListItem>