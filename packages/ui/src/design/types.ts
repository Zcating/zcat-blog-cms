export interface CommonOption<T = string> {
  value: T;
  label: string;
}

export interface CascaderOption<T = string> extends CommonOption<T> {
  children?: CascaderOption<T>[];
}
