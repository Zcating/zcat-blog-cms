export * from "./z-select";
export * from "./z-avatar";
export * from "./z-navigation-menu";
export * from "./z-sticky-header";

export {};

declare global {
  interface CommonOption<T = string> {
    label: string;
    value: T;
  }
}
