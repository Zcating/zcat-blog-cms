export * from './z-select';
export * from './z-avatar';
export * from './z-stick-header';
export * from './z-input';
export * from './z-form';
export * from './z-date-picker';
export * from './z-cascader';
export * from './z-pagination';
export * from './z-button';
export * from './z-navigation';
export * from './z-image';
export * from './z-view';
export * from './z-markdown';
export * from './z-waterfall';
export * from './z-grid';
export * from './z-sidebar';
export * from './z-collapsible';
export * from './z-dialog';
export * from './z-notification';
export * from './z-checkbox';
export * from './z-textarea';
export * from './z-image-upload';
export * from './z-chat';
export * from './z-toggle-group';
export * from './z-qrcode';
export * from './z-tree';
export * from './types';

export {};

declare global {
  interface CommonOption<T = string> {
    label: React.ReactNode;
    value: T;
  }
}
