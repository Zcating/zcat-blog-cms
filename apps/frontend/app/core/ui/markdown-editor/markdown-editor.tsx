// import MdEditor from 'react-markdown-editor-lite';
import { cn } from '@zcat/ui';
import { MdEditor } from 'md-editor-rt';

import 'md-editor-rt/lib/style.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
}: MarkdownEditorProps) {
  return (
    <MdEditor
      className={cn('h-full!', className)}
      value={value}
      onChange={onChange}
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
