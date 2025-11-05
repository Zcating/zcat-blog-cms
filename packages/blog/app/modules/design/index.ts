export * from "./select";
export * from "./avatar";

export {};

declare global {
  interface CommonOption<T = string> {
    label: string;
    value: T;
  }
}
