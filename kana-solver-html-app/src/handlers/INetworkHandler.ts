//This file is licensed under MIT license

export default interface INetworkHandler{
    fetchJson:(url: string) => Promise<object>;
    openUrlOnBrowser: (url: string) => void;
}