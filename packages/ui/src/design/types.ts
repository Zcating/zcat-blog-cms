export interface CommonOption<T = string> {
  value: T;
  label: string;
}

export interface CascadeOption<T = string> {
  value: T;
  label: string;
  children?: CascadeOption<T>[];
}
