interface MarkdownConfig {
  title: string;
  to: string;
  contentImporter: () => Promise<typeof import('*.md?raw')>;
}

export const DOCUMENT_CONFIGURES = {
  button: {
    title: 'Button',
    to: 'button',
    contentImporter: () => import('./button.md?raw'),
  },
  select: {
    title: 'Select',
    to: 'select',
    contentImporter: () => import('./select.md?raw'),
  },
  pagination: {
    title: 'Pagination',
    to: 'pagination',
    contentImporter: () => import('./pagination.md?raw'),
  },
  view: {
    title: 'View',
    to: 'view',
    contentImporter: () => import('./view.md?raw'),
  },
  'z-avatar': {
    title: 'Avatar',
    to: 'z-avatar',
    contentImporter: () => import('./z-avatar.md?raw'),
  },
  'z-image': {
    title: 'Image',
    to: 'z-image',
    contentImporter: () => import('./z-image.md?raw'),
  },
  'z-waterfall': {
    title: 'Waterfall',
    to: 'z-waterfall',
    contentImporter: () => import('./z-waterfall.md?raw'),
  },
  'z-cascader': {
    title: 'Cascader',
    to: 'z-cascader',
    contentImporter: () => import('./z-cascader.md?raw'),
  },
  'z-date-picker': {
    title: 'Date Picker',
    to: 'z-date-picker',
    contentImporter: () => import('./z-date-picker.md?raw'),
  },
  'z-markdown': {
    title: 'Markdown',
    to: 'z-markdown',
    contentImporter: () => import('./z-markdown.md?raw'),
  },
  'z-dialog': {
    title: 'Dialog',
    to: 'z-dialog',
    contentImporter: () => import('./z-dialog.md?raw'),
  },
  'z-notification': {
    title: 'Message',
    to: 'z-notification',
    contentImporter: () => import('./z-notification.md?raw'),
  },
  'z-chat': {
    title: 'Chat',
    to: 'z-chat',
    contentImporter: () => import('./z-chat.md?raw'),
  },
  'z-sidebar': {
    title: 'Sidebar',
    to: 'z-sidebar',
    contentImporter: () => import('./z-sidebar.md?raw'),
  },
  'z-input': {
    title: 'Input',
    to: 'z-input',
    contentImporter: () => import('./z-input.md?raw'),
  },
  'z-textarea': {
    title: 'Textarea',
    to: 'z-textarea',
    contentImporter: () => import('./z-textarea.md?raw'),
  },
  'z-checkbox': {
    title: 'Checkbox',
    to: 'z-checkbox',
    contentImporter: () => import('./z-checkbox.md?raw'),
  },
  'z-toggle-group': {
    title: 'ToggleGroup',
    to: 'z-toggle-group',
    contentImporter: () => import('./z-toggle-group.md?raw'),
  },
  'z-form': {
    title: 'Form',
    to: 'z-form',
    contentImporter: () => import('./z-form.md?raw'),
  },
  'z-image-upload': {
    title: 'ImageUpload',
    to: 'z-image-upload',
    contentImporter: () => import('./z-image-upload.md?raw'),
  },
  'z-collapsible': {
    title: 'Collapsible',
    to: 'z-collapsible',
    contentImporter: () => import('./z-collapsible.md?raw'),
  },
  'z-drawer': {
    title: 'Drawer',
    to: 'z-drawer',
    contentImporter: () => import('./z-drawer.md?raw'),
  },
  'z-grid': {
    title: 'Grid',
    to: 'z-grid',
    contentImporter: () => import('./z-grid.md?raw'),
  },
  'z-tree': {
    title: 'Tree',
    to: 'z-tree',
    contentImporter: () => import('./z-tree.md?raw'),
  },
  'z-qrcode': {
    title: 'QRCode',
    to: 'z-qrcode',
    contentImporter: () => import('./z-qrcode.md?raw'),
  },
  'stagger-reveal': {
    title: 'StaggerReveal',
    to: 'stagger-reveal',
    contentImporter: () => import('./stagger-reveal.md?raw'),
  },
  'fold-animation': {
    title: 'FoldAnimation',
    to: 'fold-animation',
    contentImporter: () => import('./fold-animation.md?raw'),
  },
} as const;
