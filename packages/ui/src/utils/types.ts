export type FnType = (...args: any[]) => any;

export type Teardown = () => void;

export type DeepRequired<T> = T extends FnType
  ? T
  : T extends object
    ? { [P in keyof T]-?: DeepRequired<NonNullable<T[P]>> }
    : NonNullable<T>;
