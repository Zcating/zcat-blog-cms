export * from './z-select/z-select';
export * from './z-avatar/z-avatar';
export * from './z-stick-header/z-sticky-header';
export * from './z-input/z-input';
export * from './z-form';
export * from './z-date-picker';
export * from './z-cascader';
export * from './z-pagination';
export * from './z-button/z-button';
export * from './z-navigation';
export * from './z-image';
export * from './z-view';
export * from './z-markdown';
export * from './z-waterfall';
export * from './z-grid';
export * from './z-siderbar';
export * from './z-collapsible';
export * from './z-dialog';
export * from './z-message';
export * from './z-checkbox';
export * from './z-textarea';
export * from './types';

export {};

declare global {
  interface CommonOption<T = string> {
    label: string;
    value: T;
  }
}
