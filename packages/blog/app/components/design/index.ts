export * from "./z-select";
export * from "./z-avatar";

export {};

declare global {
  interface CommonOption<T = string> {
    label: string;
    value: T;
  }
}
