// import MdEditor from 'react-markdown-editor-lite';
import { MdEditor } from 'md-editor-rt';

import 'md-editor-rt/lib/style.css';
import { classnames } from '../utils';

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
      className={classnames('!h-full', className)}
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
