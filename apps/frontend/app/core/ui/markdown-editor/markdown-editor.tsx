// import MdEditor from 'react-markdown-editor-lite';
import { cn } from '@zcat/ui';
import { MdEditor } from 'md-editor-rt';

import 'md-editor-rt/lib/style.css';

interface MarkdownEditorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({
  value,
  onValueChange,
  className,
}: MarkdownEditorProps) {
  return (
    <MdEditor
      className={cn('h-full!', className)}
      value={value}
      onChange={onValueChange}
      onUploadImg={async (files, callBack) => {
        if (files.length === 0) {
          return;
        }
        const params = files.map((file) => {
          return {
            url: URL.createObjectURL(file),
            alt: file.name,
            title: '',
          };
        });
        callBack(params);
      }}
    />
  );
}
