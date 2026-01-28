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
  'z-textarea': {
    title: 'Textarea',
    to: 'z-textarea',
    contentImporter: () => import('./z-textarea.md?raw'),
  },
  'z-sidebar': {
    title: 'Sidebar',
    to: 'z-sidebar',
    contentImporter: () => import('./z-sidebar.md?raw'),
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
