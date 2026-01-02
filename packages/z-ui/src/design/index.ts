export * from './z-select/z-select';
export * from './z-avatar/z-avatar';
export * from './z-navigation/z-navigation-menu';
export * from './z-stick-header/z-sticky-header';
export * from './z-input/z-input';
export * from './z-form/z-form';
export * from './z-address/z-address';
export * from './z-date-picker/z-date-picker';
export * from './z-cascader/z-cascader';
export * from './z-pagination/z-pagination';

export {};

declare global {
  interface CommonOption<T = string> {
    label: string;
    value: T;
  }

  type Teardown = () => void;
}
