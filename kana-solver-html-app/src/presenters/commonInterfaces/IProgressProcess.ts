export default interface IProgressProcess{
    setText: (text: string) => void;
    setProgress: (progress: number) => void;
    close: () => void;
}