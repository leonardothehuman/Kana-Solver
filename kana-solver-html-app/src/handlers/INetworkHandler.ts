export default interface INetworkHandler{
    fetchJson:(url: string) => Promise<object>;
    openUrlOnBrowser: (url: string) => void;
}