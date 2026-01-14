export * from './z-select/z-select';
export * from './z-avatar/z-avatar';
export * from './z-stick-header/z-sticky-header';
export * from './z-input/z-input';
export * from './z-form/z-form';
export * from './z-date-picker/z-date-picker';
export * from './z-cascader';
export * from './z-pagination/z-pagination';
export * from './z-button/z-button';
export * from './z-navigation';
export * from './z-image';
export * from './z-view';
export * from './z-markdown';
export * from './z-waterfall';
export * from './z-grid';
export * from './z-siderbar';
export * from './z-collapsible';

export {};

declare global {
  interface CommonOption<T = string> {
    label: string;
    value: T;
  }
}
