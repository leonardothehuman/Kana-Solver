//This file is licensed under MIT license

export default interface IProgressProcess{
    setText: (text: string) => void;
    setProgress: (progress: number) => void;
    close: () => void;
}